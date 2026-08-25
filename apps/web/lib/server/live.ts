import "server-only";

import { displayCountry, displayLanguage } from "../content/display-names";
import { getCategories, getChannels, getCountries, getLanguages } from "./catalog";
import type { PaginatedChannels } from "./catalog";

export interface LiveFacet {
  value: string;
  label: string;
}

export interface LiveFacets {
  categories: LiveFacet[];
  countries: LiveFacet[];
  languages: LiveFacet[];
}

export interface LiveFiltersState {
  search: string;
  category?: string;
  country?: string;
  language?: string;
  page: number;
}

export interface LivePageData {
  results: PaginatedChannels;
  facets: LiveFacets;
  filters: LiveFiltersState;
}

export type LiveSearchParams = Record<string, string | string[] | undefined>;

let facetsPromise: Promise<LiveFacets> | undefined;

function titleCase(value: string): string {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function loadLiveFacets(): Promise<LiveFacets> {
  const [categories, countries, languages] = await Promise.all([getCategories(), getCountries(), getLanguages()]);
  return {
    categories: categories.map((value) => ({ value, label: titleCase(value) })),
    countries: countries.map((value) => ({ value, label: displayCountry(value) })).sort((a, b) => a.label.localeCompare(b.label, "en")),
    languages: languages.map((value) => ({ value, label: displayLanguage(value) })).sort((a, b) => a.label.localeCompare(b.label, "en")),
  };
}

export function getLiveFacets(): Promise<LiveFacets> {
  facetsPromise ??= loadLiveFacets();
  return facetsPromise;
}

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

function canonicalFacet(value: string, options: LiveFacet[]): string | undefined {
  return options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.value;
}

export async function getLivePageData(params: LiveSearchParams): Promise<LivePageData> {
  const facets = await getLiveFacets();
  const pageValue = firstValue(params.page);
  const rawPage = /^\d+$/.test(pageValue) ? Number(pageValue) : Number.NaN;
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const filters: LiveFiltersState = {
    search: firstValue(params.search).slice(0, 120),
    category: canonicalFacet(firstValue(params.category), facets.categories),
    country: canonicalFacet(firstValue(params.country), facets.countries),
    language: canonicalFacet(firstValue(params.language), facets.languages),
    page: requestedPage,
  };
  const query = { search: filters.search || undefined, category: filters.category, country: filters.country, language: filters.language, limit: 40 };
  let results = await getChannels({ ...query, page: requestedPage });
  if (results.totalPages > 0 && requestedPage > results.totalPages) {
    filters.page = results.totalPages;
    results = await getChannels({ ...query, page: results.totalPages });
  }
  return { results, facets, filters };
}
