import { createHash } from "node:crypto";
import type { Channel, ChannelStream } from "../../../../scripts/data/schema";
import { displayCategory, displayCountry, displayLanguage } from "../content/display-names";

export type WatchPlaybackState = "ready" | "unavailable" | "insecure-source" | "unsupported";

export interface WatchSource {
  id: string;
  label: string;
  quality: string | null;
  format: string | null;
  protocol: string;
  isSecure: boolean;
  availability: Array<"geo-blocked" | "not-24-7">;
  feedName: string | null;
  requiresReferrer: boolean;
  requiresUserAgent: boolean;
}

export type PlaybackKind = "hls" | "direct" | "dash" | "unsupported";

export interface SelectedPlaybackSource {
  id: string;
  url: string;
  kind: PlaybackKind;
  protocol: string;
  isSecure: boolean;
  requiresReferrer: boolean;
  requiresUserAgent: boolean;
  delivery: "direct" | "gateway";
}

export interface WatchPageData {
  channel: {
    id: string;
    name: string;
    logo: string | null;
    countryCode: string | null;
    country: string;
    categories: string[];
    languages: string[];
  };
  sources: WatchSource[];
  selectedSource: WatchSource | null;
  selectedPlayback: SelectedPlaybackSource | null;
  playbackState: WatchPlaybackState;
  guideAvailable: boolean;
  guideReferenceCount: number;
}

export function sourceIdentity(stream: ChannelStream): string {
  return createHash("sha256").update(stream.url).digest("base64url").slice(0, 12);
}

function deriveFormat(stream: ChannelStream): string | null {
  try {
    const pathname = new URL(stream.url).pathname.toLowerCase();
    if (pathname.endsWith(".m3u8")) return "HLS";
    if (pathname.endsWith(".mpd")) return "MPEG-DASH";
  } catch { /* Catalog validation owns URL validity; unknown remains honest here. */ }
  if (stream.protocol.toLowerCase() === "rtmp") return "RTMP";
  if (stream.protocol.toLowerCase() === "rtsp") return "RTSP";
  return null;
}

export function classifyPlayback(stream: ChannelStream): PlaybackKind {
  const protocol = stream.protocol.toLowerCase();
  if (!["http", "https"].includes(protocol)) return "unsupported";
  try {
    const pathname = new URL(stream.url).pathname.toLowerCase();
    if (pathname.endsWith(".m3u8")) return "hls";
    if (pathname.endsWith(".mpd")) return "dash";
    if ([".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v"].some((extension) => pathname.endsWith(extension))) return "direct";
  } catch { return "unsupported"; }
  return "direct";
}

function playbackState(source: WatchSource | null, stream: ChannelStream | null): WatchPlaybackState {
  if (!source) return "unavailable";
  if (!["http", "https"].includes(source.protocol.toLowerCase())) return "unsupported";
  if (stream && ["dash", "unsupported"].includes(classifyPlayback(stream))) return "unsupported";
  if (!source.isSecure) return "insecure-source";
  return "ready";
}

export function createWatchPageData(channel: Channel, requestedSource?: string): WatchPageData {
  const feeds = new Map(channel.feeds.map((feed) => [feed.id, feed]));
  const sources = channel.streams.map((stream, index): WatchSource => ({
    id: sourceIdentity(stream),
    label: `Source ${index + 1}`,
    quality: stream.quality,
    format: deriveFormat(stream),
    protocol: stream.protocol.toUpperCase(),
    isSecure: stream.isHttps,
    availability: [...stream.availability],
    feedName: stream.feed ? feeds.get(stream.feed)?.name ?? null : null,
    requiresReferrer: Boolean(stream.referrer),
    requiresUserAgent: Boolean(stream.userAgent),
  }));
  const selectedIndex = Math.max(0, sources.findIndex((source) => source.id === requestedSource));
  const selectedSource = sources[selectedIndex] ?? null;
  const selectedStream = channel.streams[selectedIndex] ?? null;
  return {
    channel: {
      id: channel.id,
      name: channel.name,
      logo: channel.logo,
      countryCode: channel.country,
      country: channel.country ? displayCountry(channel.country) : "International",
      categories: channel.categories.map(displayCategory),
      languages: channel.languages.map(displayLanguage),
    },
    sources,
    selectedSource,
    selectedPlayback: selectedSource && selectedStream ? {
      id: selectedSource.id,
      url: selectedStream.url,
      kind: classifyPlayback(selectedStream),
      protocol: selectedSource.protocol,
      isSecure: selectedSource.isSecure,
      requiresReferrer: selectedSource.requiresReferrer,
      requiresUserAgent: selectedSource.requiresUserAgent,
      delivery: "direct",
    } : null,
    playbackState: playbackState(selectedSource, selectedStream),
    guideAvailable: channel.guides.length > 0,
    guideReferenceCount: channel.guides.length,
  };
}

export async function resolveWatchChannelId(param: string, lookup: (id: string) => Promise<Channel | null>): Promise<Channel | null> {
  const direct = await lookup(param);
  if (direct) return direct;
  try {
    const decoded = decodeURIComponent(param);
    return decoded === param ? null : lookup(decoded);
  } catch {
    return null;
  }
}
