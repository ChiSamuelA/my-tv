import type {
  Catalog,
  CatalogManifest,
  Channel,
} from "../../../../../scripts/data/schema";
import type {
  CatalogStats,
  GetChannelsOptions,
  PaginatedChannels,
} from "./types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 100;

function normalize(value: string): string {
  return value.trim().normalize("NFKC").toLowerCase();
}

function validatePagination(page: number, limit: number): void {
  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError("Catalog page must be an integer greater than or equal to 1");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new RangeError(`Catalog limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
}

export interface CatalogStore {
  getChannelById(id: string): Channel | null;
  getChannels(options?: GetChannelsOptions): PaginatedChannels;
  getCategories(): string[];
  getCountries(): string[];
  getLanguages(): string[];
  getCatalogStats(): CatalogStats;
}

export function createCatalogStore(
  catalog: Catalog,
  manifest: CatalogManifest,
): CatalogStore {
  const channels = [...catalog.channels].sort((a, b) => a.id.localeCompare(b.id, "en"));
  const channelsById = new Map(channels.map((channel) => [channel.id, channel]));

  const facets = (select: (channel: Channel) => string[]): string[] =>
    [...new Set(channels.flatMap(select).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "en"),
    );

  const categories = facets((channel) => channel.categories);
  const countries = facets((channel) => channel.country ? [channel.country] : []);
  const languages = facets((channel) => channel.languages);

  return {
    getChannelById(id) {
      if (typeof id !== "string" || !id.trim()) {
        throw new TypeError("Channel ID is required");
      }
      return channelsById.get(id.trim()) ?? null;
    },

    getChannels(options = {}) {
      const page = options.page ?? DEFAULT_PAGE;
      const limit = options.limit ?? DEFAULT_LIMIT;
      validatePagination(page, limit);

      const search = options.search ? normalize(options.search) : "";
      const category = options.category ? normalize(options.category) : "";
      const country = options.country ? normalize(options.country) : "";
      const language = options.language ? normalize(options.language) : "";

      const filtered = channels.filter((channel) => {
        if (search && !normalize(channel.name).includes(search) && !normalize(channel.id).includes(search)) return false;
        if (category && !channel.categories.some((value) => normalize(value) === category)) return false;
        if (country && normalize(channel.country ?? "") !== country) return false;
        if (language && !channel.languages.some((value) => normalize(value) === language)) return false;
        return true;
      });

      const totalItems = filtered.length;
      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit),
        page,
        limit,
        totalItems,
        totalPages,
      };
    },

    getCategories: () => categories,
    getCountries: () => countries,
    getLanguages: () => languages,
    getCatalogStats: () => ({
      schemaVersion: manifest.schemaVersion,
      generatedAt: manifest.generatedAt,
      channelCount: manifest.channelCount,
      streamCount: manifest.streamCount,
      enrichment: {
        channelsEnriched: manifest.enrichment.channelsEnriched,
        channelsWithoutAuthoritativeMetadata: manifest.enrichment.channelsWithoutAuthoritativeMetadata,
        channelsWithLogos: manifest.enrichment.channelsWithLogos,
        channelsWithCategories: manifest.enrichment.channelsWithCategories,
        channelsWithLanguages: manifest.enrichment.channelsWithLanguages,
        channelsWithCountry: manifest.enrichment.channelsWithCountry,
      },
    }),
  };
}
