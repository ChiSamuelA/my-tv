import type { IncomingMessage } from "node:http";
import { request, type RequestOptions } from "node:https";
import type { LookupFunction } from "node:net";
import { validateNetworkTarget } from "./network-safety";
import { buildUpstreamHeaders, mayForwardRefererAcrossRedirect, type UpstreamHeaderPolicy } from "./header-policy";

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

function requestOnce(url: string, range: string | undefined, headerPolicy: UpstreamHeaderPolicy, includeReferer: boolean): Promise<IncomingMessage> {
  return validateNetworkTarget(url).then((target) => new Promise((resolve, reject) => {
    const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
      if (options.all) callback(null, [{ address: target.address, family: target.family }]);
      else callback(null, target.address, target.family);
    };
    const options: RequestOptions = {
      method: "GET",
      headers: buildUpstreamHeaders(range, headerPolicy, includeReferer),
      lookup: pinnedLookup,
      servername: target.url.hostname,
    };
    const upstream = request(target.url, options, resolve);
    upstream.setTimeout(REQUEST_TIMEOUT_MS, () => upstream.destroy(new Error("Upstream request timed out")));
    upstream.on("error", reject);
    upstream.end();
  }));
}

export async function fetchUpstream(url: string, options: { range?: string; redirects?: number; headerPolicy?: UpstreamHeaderPolicy } = {}): Promise<UpstreamResult> {
  let current = url;
  let includeReferer = true;
  const headerPolicy = options.headerPolicy ?? {};
  const max = options.redirects ?? MAX_REDIRECTS;
  for (let count = 0; count <= max; count += 1) {
    const response = await requestOnce(current, options.range, headerPolicy, includeReferer);
    if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers.location;
      response.resume();
      const destination = await resolveRedirectTarget(location, current, count, max);
      includeReferer = includeReferer && mayForwardRefererAcrossRedirect(current, destination);
      current = destination;
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
