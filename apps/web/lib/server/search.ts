import "server-only";

import { normalizeSearchParams, type SearchParams } from "../content/search-params";
import { getChannels } from "./catalog";
import type { PaginatedChannels } from "./catalog";

export interface SearchPageData {
  query: string;
  results: PaginatedChannels | null;
}

export async function getSearchPageData(params: SearchParams): Promise<SearchPageData> {
  const normalized = normalizeSearchParams(params);
  if (!normalized.query) return { query: "", results: null };
  let results = await getChannels({ search: normalized.query, page: normalized.page, limit: 40 });
  if (results.totalPages > 0 && normalized.page > results.totalPages) {
    results = await getChannels({ search: normalized.query, page: results.totalPages, limit: 40 });
  }
  return { query: normalized.query, results };
}

export type { SearchParams };
