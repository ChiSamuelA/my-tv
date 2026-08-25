import "server-only";

import { Readable } from "node:stream";
import { getChannelById } from "../catalog";
import { resolveCatalogBoundResource } from "./catalog-binding";
import { CAPABILITY_LIFETIME_SECONDS, createPlaybackCapability, gatewayPath, verifyPlaybackCapability } from "./capability";
import { rewriteHlsManifest } from "./hls-rewrite";
import type { GatewayResponse, PlaybackCapability } from "./types";
import { fetchUpstream, readBounded, validRangeHeader } from "./upstream";

const PROOF_CHANNEL_ID = "00sReplay.us";
const PROOF_SOURCE_ID = "7XHFFcGQlWx6";
const PLAYLIST_TYPES = ["application/vnd.apple.mpegurl", "application/x-mpegurl", "audio/mpegurl", "audio/x-mpegurl"];

export function isGatewayProofSource(channelId: string, sourceId: string): boolean {
  return channelId === PROOF_CHANNEL_ID && sourceId === PROOF_SOURCE_ID;
}

export function createGatewayEntryPath(channelId: string, sourceId: string): string {
  if (!isGatewayProofSource(channelId, sourceId)) throw new Error("Source is not enabled for the Phase 9A gateway proof");
  return gatewayPath(createPlaybackCapability({ channelId, sourceId, resourceKind: "root-manifest" }));
}

async function bindCapability(value: PlaybackCapability): Promise<{ upstreamUrl: string }> {
  return { upstreamUrl: await resolveCatalogBoundResource(value, getChannelById, isGatewayProofSource) };
}

function responseHeaders(requestOrigin: string | null): Headers {
  const headers = new Headers({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  const allowed = process.env.PLAYBACK_ALLOWED_ORIGIN ?? "http://localhost:3000";
  if (requestOrigin === allowed) { headers.set("Access-Control-Allow-Origin", allowed); headers.set("Vary", "Origin"); }
  return headers;
}

function copyMediaHeaders(source: NodeJS.Dict<string | string[]>, target: Headers): void {
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"] as const) {
    const value = source[name];
    if (typeof value === "string") target.set(name, value);
  }
}

export async function handleGatewayRequest(token: string, request: Request): Promise<GatewayResponse> {
  const startedAt = Date.now();
  const capability = verifyPlaybackCapability(token);
  const { upstreamUrl } = await bindCapability(capability);
  const range = validRangeHeader(request.headers.get("range"));
  if (request.headers.has("range") && !range) return { status: 416, body: null, headers: responseHeaders(request.headers.get("origin")) };
  const upstream = await fetchUpstream(upstreamUrl, { range });
  const status = upstream.response.statusCode ?? 502;
  if (status < 200 || status >= 300) { upstream.response.resume(); throw new Error(`Upstream rejected resource (${status})`); }
  const headers = responseHeaders(request.headers.get("origin"));
  if (capability.resourceKind === "root-manifest" || capability.resourceKind === "manifest") {
    const contentType = String(upstream.response.headers["content-type"] ?? "").split(";", 1)[0].toLowerCase();
    const body = await readBounded(upstream.response);
    const text = body.toString("utf8");
    if (contentType && !PLAYLIST_TYPES.includes(contentType) && !text.trimStart().startsWith("#EXTM3U")) throw new Error("Upstream returned a non-HLS resource");
    const rewritten = rewriteHlsManifest(text, {
      channelId: capability.channelId,
      sourceId: capability.sourceId,
      manifestUrl: upstream.finalUrl,
      expiresAt: capability.expiresAt,
    });
    headers.set("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    headers.set("Cache-Control", "no-store, max-age=0");
    if (process.env.NODE_ENV === "development") console.info(`Playback gateway diagnostic resource=${capability.resourceKind} source=${capability.sourceId} status=200 durationMs=${Date.now() - startedAt}`);
    return { status: 200, body: rewritten, headers };
  }
  copyMediaHeaders(upstream.response.headers, headers);
  headers.set("Cache-Control", headers.get("Cache-Control") ?? "private, max-age=30");
  if (process.env.NODE_ENV === "development") console.info(`Playback gateway diagnostic resource=${capability.resourceKind} source=${capability.sourceId} status=${status} durationMs=${Date.now() - startedAt}`);
  return { status, body: Readable.toWeb(upstream.response) as ReadableStream, headers };
}

export { CAPABILITY_LIFETIME_SECONDS };
