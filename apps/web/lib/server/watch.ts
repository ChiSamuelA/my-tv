import "server-only";

import { getChannelById } from "./catalog";
import { createWatchPageData, resolveWatchChannelId, type WatchPageData } from "./watch-model";

export type WatchSearchParams = Record<string, string | string[] | undefined>;

export async function getWatchPageData(id: string, params: WatchSearchParams): Promise<WatchPageData | null> {
  const channel = await resolveWatchChannelId(id, getChannelById);
  if (!channel) return null;
  const value = Array.isArray(params.source) ? params.source[0] : params.source;
  const source = typeof value === "string" ? value.trim().slice(0, 80) : undefined;
  return createWatchPageData(channel, source);
}

export type { WatchPageData, WatchSource } from "./watch-model";
