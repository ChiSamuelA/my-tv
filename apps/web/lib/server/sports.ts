import "server-only";

import type { Channel } from "../../../../scripts/data/schema";
import { displayCountry, displayLanguage } from "../content/display-names";
import { getChannels } from "./catalog";
import type { PaginatedChannels } from "./catalog";

export interface SportsFacet {
  value: string;
  label: string;
  count: number;
}

export interface SportsFacets {
  totalSports: number;
  countries: SportsFacet[];
  languages: SportsFacet[];
}

export interface SportsFiltersState {
  search: string;
  country?: string;
  language?: string;
  page: number;
}

export interface SportsPageData {
  results: PaginatedChannels;
  facets: SportsFacets;
  filters: SportsFiltersState;
}

export type SportsSearchParams = Record<string, string | string[] | undefined>;

let facetsPromise: Promise<SportsFacets> | undefined;

function countValues(channels: Channel[], select: (channel: Channel) => string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const channel of channels) {
    for (const value of new Set(select(channel).filter(Boolean))) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

async function loadSportsFacets(): Promise<SportsFacets> {
  const first = await getChannels({ category: "sports", page: 1, limit: 100 });
  const remaining = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
    getChannels({ category: "sports", page: index + 2, limit: 100 }),
  ));
  const channels = [...first.items, ...remaining.flatMap((result) => result.items)];
  const countries = countValues(channels, (channel) => channel.country ? [channel.country] : []);
  const languages = countValues(channels, (channel) => channel.languages);

  return {
    totalSports: first.totalItems,
    countries: [...countries].map(([value, count]) => ({ value, count, label: displayCountry(value) }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "en")),
    languages: [...languages].map(([value, count]) => ({ value, count, label: displayLanguage(value) }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "en")),
  };
}

export function getSportsFacets(): Promise<SportsFacets> {
  facetsPromise ??= loadSportsFacets();
  return facetsPromise;
}

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

function canonicalFacet(value: string, options: SportsFacet[]): string | undefined {
  return options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.value;
}

export async function getSportsPageData(params: SportsSearchParams): Promise<SportsPageData> {
  const facets = await getSportsFacets();
  const pageValue = firstValue(params.page);
  const rawPage = /^\d+$/.test(pageValue) ? Number(pageValue) : Number.NaN;
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const filters: SportsFiltersState = {
    search: firstValue(params.search).slice(0, 120),
    country: canonicalFacet(firstValue(params.country), facets.countries),
    language: canonicalFacet(firstValue(params.language), facets.languages),
    page: requestedPage,
  };
  const query = { category: "sports", search: filters.search || undefined, country: filters.country, language: filters.language, limit: 40 };
  let results = await getChannels({ ...query, page: requestedPage });
  if (results.totalPages > 0 && requestedPage > results.totalPages) {
    filters.page = results.totalPages;
    results = await getChannels({ ...query, page: results.totalPages });
  }
  return { results, facets, filters };
}
