import type { LocalPlaylistEntry } from "./adapters/local-iptv.js";
import { syntheticChannelId } from "./adapters/local-iptv.js";
import type {
  PublishedData,
  PublishedLogo,
  PublishedStream,
} from "./adapters/published-iptv-org.js";
import {
  CATALOG_SCHEMA_VERSION,
  type Catalog,
  type Channel,
  type ChannelStream,
  type FeedMetadata,
  type GuideReference,
  type StreamAvailability,
} from "./schema.js";

const QUALITY_PATTERN = /\((\d{3,4}p|\d{1,2}K)\)/i;
const AVAILABILITY_PATTERN = /\s*\[(Geo-blocked|Not 24\/7)\]/gi;

export interface NormalizationResult {
  catalog: Catalog;
  localStreamsMatchedByPublishedUrl: number;
}

function normalizeName(rawName: string): string {
  return rawName.replace(AVAILABILITY_PATTERN, "").replace(QUALITY_PATTERN, "").replace(/\s+/g, " ").trim();
}

function availabilityFromLabels(...labels: Array<string | null>): StreamAvailability[] {
  const combined = labels.filter(Boolean).join(" ");
  const availability: StreamAvailability[] = [];
  if (/Geo-blocked/i.test(combined)) availability.push("geo-blocked");
  if (/Not 24\/7/i.test(combined)) availability.push("not-24-7");
  return availability;
}

function splitStreamId(streamId: string | null): { channelId: string | null; feedId: string | null } {
  if (!streamId) return { channelId: null, feedId: null };
  const [channelId, feedId] = streamId.split("@", 2);
  return { channelId: channelId || null, feedId: feedId || null };
}

function preferredLogo(logos: PublishedLogo[]): string | null {
  return [...logos].sort((a, b) => {
    const score = (logo: PublishedLogo) =>
      (logo.in_use ? 1_000_000_000 : 0) +
      (logo.feed === null ? 100_000_000 : 0) +
      (logo.tags.includes("horizontal") ? 10_000_000 : 0) +
      logo.width * logo.height;
    return score(b) - score(a) || a.url.localeCompare(b.url, "en");
  })[0]?.url ?? null;
}

function uniquePublishedStreamByUrl(published: PublishedData | undefined): Map<string, PublishedStream> {
  const candidates = new Map<string, PublishedStream | null>();
  for (const stream of published?.streams ?? []) {
    if (!stream.channel) continue;
    if (candidates.has(stream.url)) candidates.set(stream.url, null);
    else candidates.set(stream.url, stream);
  }
  return new Map([...candidates].filter((entry): entry is [string, PublishedStream] => entry[1] !== null));
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

export function normalizeEntries(
  entries: LocalPlaylistEntry[],
  published?: PublishedData,
): NormalizationResult {
  const publishedChannels = new Map(published?.channels.map((channel) => [channel.id, channel]));
  const publishedStreamsByUrl = uniquePublishedStreamByUrl(published);
  const feedsByChannel = groupBy(published?.feeds ?? [], (feed) => feed.channel);
  const guidesByChannel = groupBy(
    (published?.guides ?? []).filter((guide) => guide.channel !== null),
    (guide) => guide.channel as string,
  );
  const logosByChannel = groupBy(published?.logos ?? [], (logo) => logo.channel);
  const channels = new Map<string, Channel>();
  let localStreamsMatchedByPublishedUrl = 0;

  for (const entry of entries) {
    const publishedStream = publishedStreamsByUrl.get(entry.url);
    if (publishedStream) localStreamsMatchedByPublishedUrl += 1;
    const localStreamId = splitStreamId(entry.upstreamChannelId);
    const channelId = localStreamId.channelId ?? publishedStream?.channel ?? syntheticChannelId(normalizeName(entry.name), entry.country);
    const feedId = localStreamId.feedId ?? publishedStream?.feed ?? null;
    const authoritative = publishedChannels.get(channelId);
    const protocol = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(entry.url)?.[1].toLowerCase() ?? "";
    const localQuality = QUALITY_PATTERN.exec(entry.name)?.[1].toLowerCase() ?? null;
    const stream: ChannelStream = {
      url: entry.url,
      feed: feedId,
      quality: localQuality ?? publishedStream?.quality ?? null,
      availability: availabilityFromLabels(entry.name, publishedStream?.label ?? null),
      referrer: entry.referrer ?? publishedStream?.referrer ?? null,
      userAgent: entry.userAgent ?? publishedStream?.user_agent ?? null,
      protocol,
      isHttps: protocol === "https",
      provenance: {
        adapter: "local-iptv-checkout",
        file: entry.sourceFile,
        line: entry.sourceLine,
        upstreamChannelId: entry.upstreamChannelId,
        publishedMatch: publishedStream ? { dataset: "streams.json", matchedBy: "url" } : null,
      },
    };

    const existing = channels.get(channelId);
    if (existing) {
      existing.streams.push(stream);
      if (!existing.logo && entry.logo) existing.logo = entry.logo;
      continue;
    }

    const publishedFeeds = feedsByChannel.get(channelId) ?? [];
    const feeds: FeedMetadata[] = publishedFeeds.map((feed) => ({
      id: feed.id,
      name: feed.name,
      isMain: feed.is_main,
      broadcastAreas: [...feed.broadcast_area].sort(),
      timezones: [...feed.timezones].sort(),
      languages: [...feed.languages].sort(),
      format: feed.format,
    })).sort((a, b) => a.id.localeCompare(b.id, "en"));
    const guides: GuideReference[] = (guidesByChannel.get(channelId) ?? []).map((guide) => ({
      feed: guide.feed,
      site: guide.site,
      siteId: guide.site_id,
      siteName: guide.site_name,
      language: guide.lang,
      sources: guide.sources.map((source) => ({ ...source })).sort((a, b) => a.url.localeCompare(b.url, "en")),
    })).sort((a, b) => `${a.feed ?? ""}:${a.site}:${a.siteId}:${a.language}`.localeCompare(`${b.feed ?? ""}:${b.site}:${b.siteId}:${b.language}`, "en"));
    const languages = [...new Set(publishedFeeds.flatMap((feed) => feed.languages))].sort();

    channels.set(channelId, {
      id: channelId,
      name: authoritative?.name ?? normalizeName(entry.name),
      country: authoritative?.country || entry.country,
      languages,
      categories: [...(authoritative?.categories ?? [])].sort(),
      logo: preferredLogo(logosByChannel.get(channelId) ?? []) ?? entry.logo,
      feeds,
      guides,
      provenance: {
        localPlaylist: true,
        authoritativeMetadata: authoritative ? { dataset: "channels.json", channelId } : null,
      },
      streams: [stream],
    });
  }

  const sortedChannels = [...channels.values()].map((channel) => ({
    ...channel,
    streams: channel.streams.sort((a, b) =>
      `${a.url}\0${a.provenance.file}\0${a.provenance.line}`.localeCompare(`${b.url}\0${b.provenance.file}\0${b.provenance.line}`, "en"),
    ),
  })).sort((a, b) => a.id.localeCompare(b.id, "en"));

  return {
    catalog: { schemaVersion: CATALOG_SCHEMA_VERSION, channels: sortedChannels },
    localStreamsMatchedByPublishedUrl,
  };
}
