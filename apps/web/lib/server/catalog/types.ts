import type { Channel, CatalogManifest } from "../../../../../scripts/data/schema";

export interface GetChannelsOptions {
  search?: string;
  category?: string;
  country?: string;
  language?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedChannels {
  items: Channel[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface CatalogStats {
  schemaVersion: CatalogManifest["schemaVersion"];
  generatedAt: string;
  channelCount: number;
  streamCount: number;
  enrichment: Pick<
    CatalogManifest["enrichment"],
    | "channelsEnriched"
    | "channelsWithoutAuthoritativeMetadata"
    | "channelsWithLogos"
    | "channelsWithCategories"
    | "channelsWithLanguages"
    | "channelsWithCountry"
  >;
}

export interface CountryCatalogFacet {
  code: string;
  channelCount: number;
  categories: string[];
  languages: string[];
}
