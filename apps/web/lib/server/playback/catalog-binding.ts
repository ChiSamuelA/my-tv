import type { Channel } from "../../../../../scripts/data/schema";
import { sourceIdentity } from "../watch-model";
import type { PlaybackCapability } from "./types";

export async function resolveCatalogBoundResource(
  value: PlaybackCapability,
  lookup: (id: string) => Promise<Channel | null>,
  enabled: (channelId: string, sourceId: string) => boolean,
): Promise<string> {
  if (!enabled(value.channelId, value.sourceId)) throw new Error("Gateway source is not enabled");
  const channel = await lookup(value.channelId);
  if (!channel) throw new Error("Unknown gateway channel");
  const stream = channel.streams.find((candidate) => sourceIdentity(candidate) === value.sourceId);
  if (!stream) throw new Error("Gateway source does not belong to channel");
  if (!stream.isHttps || stream.protocol.toLowerCase() !== "https" || !new URL(stream.url).pathname.toLowerCase().endsWith(".m3u8")) throw new Error("Gateway source is not HTTPS HLS");
  if (stream.referrer || stream.userAgent) throw new Error("Phase 9A does not support custom upstream headers");
  return value.resourceKind === "root-manifest" ? stream.url : value.resourceUrl!;
}
