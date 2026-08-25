export const CATALOG_SCHEMA_VERSION = "1.1.0" as const;

export type StreamProtocol =
  | "http"
  | "https"
  | "rtmp"
  | "rtsp"
  | "mmsh"
  | "srt";

export type StreamAvailability = "geo-blocked" | "not-24-7";

export interface StreamProvenance {
  adapter: "local-iptv-checkout";
  file: string;
  line: number;
  upstreamChannelId: string | null;
  publishedMatch: {
    dataset: "streams.json";
    matchedBy: "url";
  } | null;
}

export interface FeedMetadata {
  id: string;
  name: string;
  isMain: boolean;
  broadcastAreas: string[];
  timezones: string[];
  languages: string[];
  format: string | null;
}

export interface GuideReference {
  feed: string | null;
  site: string;
  siteId: string;
  siteName: string;
  language: string;
  sources: Array<{ host: string; url: string; format: string }>;
}

export interface ChannelProvenance {
  localPlaylist: boolean;
  authoritativeMetadata: {
    dataset: "channels.json";
    channelId: string;
  } | null;
}

export interface ChannelStream {
  url: string;
  feed: string | null;
  quality: string | null;
  availability: StreamAvailability[];
  referrer: string | null;
  userAgent: string | null;
  protocol: StreamProtocol | string;
  isHttps: boolean;
  provenance: StreamProvenance;
}

export interface Channel {
  id: string;
  name: string;
  country: string | null;
  languages: string[];
  categories: string[];
  logo: string | null;
  feeds: FeedMetadata[];
  guides: GuideReference[];
  provenance: ChannelProvenance;
  streams: ChannelStream[];
}

export interface Catalog {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  channels: Channel[];
}

export interface CatalogManifest {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  generatedAt: string;
  source: {
    pathType: "local-checkout";
    configuredPath: string;
    upstreamCommit: string | null;
    published: {
      baseUrl: string;
      fetchedAt: string;
      files: Array<{
        name: string;
        etag: string | null;
        lastModified: string | null;
      }>;
    } | null;
  };
  channelCount: number;
  streamCount: number;
  enrichment: {
    channelsEnriched: number;
    channelsWithoutAuthoritativeMetadata: number;
    channelsWithLogos: number;
    channelsWithCategories: number;
    channelsWithLanguages: number;
    channelsWithCountry: number;
    localStreamsMatchedByPublishedUrl: number;
  };
}
