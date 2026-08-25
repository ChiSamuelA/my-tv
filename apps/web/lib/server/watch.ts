import "server-only";

import { getChannelById } from "./catalog";
import { createWatchPageData, resolveWatchChannelId, type WatchPageData } from "./watch-model";
import { createGatewayEntryPath, isGatewayProofSource } from "./playback/gateway";

export type WatchSearchParams = Record<string, string | string[] | undefined>;

export async function getWatchPageData(id: string, params: WatchSearchParams): Promise<WatchPageData | null> {
  const channel = await resolveWatchChannelId(id, getChannelById);
  if (!channel) return null;
  const value = Array.isArray(params.source) ? params.source[0] : params.source;
  const source = typeof value === "string" ? value.trim().slice(0, 80) : undefined;
  const data = createWatchPageData(channel, source);
  if (data.selectedPlayback && isGatewayProofSource(channel.id, data.selectedPlayback.id)) {
    data.selectedPlayback = { ...data.selectedPlayback, url: createGatewayEntryPath(channel.id, data.selectedPlayback.id), delivery: "gateway" };
  }
  return data;
}

export type { SelectedPlaybackSource, WatchPageData, WatchSource } from "./watch-model";
