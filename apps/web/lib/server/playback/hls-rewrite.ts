import { createPlaybackCapability, gatewayPath } from "./capability";
import type { PlaybackResourceKind } from "./types";

interface RewriteContext { channelId: string; sourceId: string; manifestUrl: string; expiresAt: number; secret?: string }

function resourceUrl(reference: string, base: string): string {
  return new URL(reference, base).toString();
}

function capability(reference: string, kind: PlaybackResourceKind, context: RewriteContext): string {
  return gatewayPath(createPlaybackCapability({
    channelId: context.channelId,
    sourceId: context.sourceId,
    resourceKind: kind,
    resourceUrl: resourceUrl(reference, context.manifestUrl),
    expiresAt: context.expiresAt,
  }, { secret: context.secret }));
}

function attributeKind(tag: string): PlaybackResourceKind {
  if (tag.startsWith("#EXT-X-KEY") || tag.startsWith("#EXT-X-SESSION-KEY")) return "key";
  if (tag.startsWith("#EXT-X-MAP")) return "media";
  return "manifest";
}

export function rewriteHlsManifest(manifest: string, context: RewriteContext): string {
  if (!manifest.trimStart().startsWith("#EXTM3U")) throw new Error("Upstream response is not an HLS manifest");
  let nextUriKind: PlaybackResourceKind = "media";
  return manifest.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (trimmed.startsWith("#")) {
      if (trimmed.startsWith("#EXT-X-STREAM-INF")) nextUriKind = "manifest";
      return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${capability(uri, attributeKind(trimmed), context)}"`);
    }
    const rewritten = capability(trimmed, nextUriKind, context);
    nextUriKind = "media";
    return rewritten;
  }).join("\n");
}
