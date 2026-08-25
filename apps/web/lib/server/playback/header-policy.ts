import type { ChannelStream } from "../../../../../scripts/data/schema";

export interface UpstreamHeaderPolicy {
  referer?: string;
  userAgent?: string;
}

const MAX_REFERER_LENGTH = 2048;
const MAX_USER_AGENT_LENGTH = 512;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function validateCatalogReferer(value: string | null): string | undefined {
  if (value === null) return undefined;
  if (!value || value.length > MAX_REFERER_LENGTH || CONTROL_CHARACTERS.test(value)) throw new Error("Invalid catalog Referer policy");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Invalid catalog Referer policy"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid catalog Referer policy");
  return url.toString();
}

export function validateCatalogUserAgent(value: string | null): string | undefined {
  if (value === null) return undefined;
  if (!value.trim() || value.length > MAX_USER_AGENT_LENGTH || CONTROL_CHARACTERS.test(value)) throw new Error("Invalid catalog User-Agent policy");
  return value;
}

export function headerPolicyForStream(stream: ChannelStream): UpstreamHeaderPolicy {
  const referer = validateCatalogReferer(stream.referrer);
  const userAgent = validateCatalogUserAgent(stream.userAgent);
  return { ...(referer ? { referer } : {}), ...(userAgent ? { userAgent } : {}) };
}

export function mayForwardRefererAcrossRedirect(from: string, to: string): boolean {
  const fromHost = new URL(from).hostname.toLowerCase();
  const toHost = new URL(to).hostname.toLowerCase();
  return fromHost === toHost || fromHost.endsWith(`.${toHost}`) || toHost.endsWith(`.${fromHost}`);
}

export function buildUpstreamHeaders(range: string | undefined, policy: UpstreamHeaderPolicy, includeReferer = true): Record<string, string> {
  return {
    Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, video/*;q=0.9, */*;q=0.5",
    ...(range ? { Range: range } : {}),
    ...(includeReferer && policy.referer ? { Referer: policy.referer } : {}),
    ...(policy.userAgent ? { "User-Agent": policy.userAgent } : {}),
  };
}
