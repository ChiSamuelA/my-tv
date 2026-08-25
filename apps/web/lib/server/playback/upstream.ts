import type { IncomingMessage } from "node:http";
import { request, type RequestOptions } from "node:https";
import type { LookupFunction } from "node:net";
import { validateNetworkTarget } from "./network-safety";

export const MAX_REDIRECTS = 4;
export const REQUEST_TIMEOUT_MS = 12_000;
export const MAX_MANIFEST_BYTES = 1024 * 1024;

export interface UpstreamResult { response: IncomingMessage; finalUrl: string }

export async function resolveRedirectTarget(location: string | undefined, current: string, count: number, maximum: number): Promise<string> {
  if (!location) throw new Error("Upstream redirect omitted Location");
  if (count >= maximum) throw new Error("Too many upstream redirects");
  const destination = new URL(location, current).toString();
  await validateNetworkTarget(destination);
  return destination;
}

function requestOnce(url: string, range?: string): Promise<IncomingMessage> {
  return validateNetworkTarget(url).then((target) => new Promise((resolve, reject) => {
    const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
      if (options.all) callback(null, [{ address: target.address, family: target.family }]);
      else callback(null, target.address, target.family);
    };
    const options: RequestOptions = {
      method: "GET",
      headers: { Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, video/*;q=0.9, */*;q=0.5", ...(range ? { Range: range } : {}) },
      lookup: pinnedLookup,
      servername: target.url.hostname,
    };
    const upstream = request(target.url, options, resolve);
    upstream.setTimeout(REQUEST_TIMEOUT_MS, () => upstream.destroy(new Error("Upstream request timed out")));
    upstream.on("error", reject);
    upstream.end();
  }));
}

export async function fetchUpstream(url: string, options: { range?: string; redirects?: number } = {}): Promise<UpstreamResult> {
  let current = url;
  const max = options.redirects ?? MAX_REDIRECTS;
  for (let count = 0; count <= max; count += 1) {
    const response = await requestOnce(current, options.range);
    if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers.location;
      response.resume();
      current = await resolveRedirectTarget(location, current, count, max);
      continue;
    }
    return { response, finalUrl: current };
  }
  throw new Error("Too many upstream redirects");
}

export async function readBounded(response: IncomingMessage, maximum = MAX_MANIFEST_BYTES): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const value of response) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    size += chunk.length;
    if (size > maximum) { response.destroy(); throw new Error("Upstream manifest exceeded size limit"); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function validRangeHeader(value: string | null): string | undefined {
  if (!value) return undefined;
  return /^bytes=(?:\d+-\d*|-\d+)$/.test(value) && value.length <= 80 ? value : undefined;
}
