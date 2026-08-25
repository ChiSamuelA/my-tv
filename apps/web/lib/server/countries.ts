import "server-only";

import { countryFlag, displayCategory, displayCountry, displayLanguage } from "../content/display-names";
import { getChannels, getCountryFacets } from "./catalog";
import type { CountryCatalogFacet, PaginatedChannels } from "./catalog";

export interface CountrySummary {
  code: string;
  name: string;
  flag: string;
  channelCount: number;
  categories: Array<{ value: string; label: string }>;
  languages: Array<{ value: string; label: string }>;
}

export interface CountriesPageData {
  countries: CountrySummary[];
  featured: CountrySummary[];
  query: string;
  totalCountries: number;
}

export interface CountryFiltersState {
  search: string;
  category?: string;
  language?: string;
  page: number;
}

export interface CountryPageData {
  country: CountrySummary;
  results: PaginatedChannels;
  filters: CountryFiltersState;
}

export type CountrySearchParams = Record<string, string | string[] | undefined>;

const FEATURED_CODES = ["FR", "US", "UK", "IN", "ES", "DE"];
let countriesPromise: Promise<CountrySummary[]> | undefined;

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

function presentCountry(facet: CountryCatalogFacet): CountrySummary {
  return {
    code: facet.code,
    name: displayCountry(facet.code),
    flag: countryFlag(facet.code),
    channelCount: facet.channelCount,
    categories: facet.categories.map((value) => ({ value, label: displayCategory(value) })),
    languages: facet.languages.map((value) => ({ value, label: displayLanguage(value) })).sort((a, b) => a.label.localeCompare(b.label, "en")),
  };
}

async function loadCountries(): Promise<CountrySummary[]> {
  return (await getCountryFacets()).map(presentCountry).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function getCountryDirectory(): Promise<CountrySummary[]> {
  countriesPromise ??= loadCountries();
  return countriesPromise;
}

export async function getCountriesPageData(params: CountrySearchParams): Promise<CountriesPageData> {
  const allCountries = await getCountryDirectory();
  const query = firstValue(params.q).slice(0, 80);
  const normalized = query.normalize("NFKC").toLowerCase();
  const countries = normalized ? allCountries.filter((country) => country.code.toLowerCase().includes(normalized) || country.name.normalize("NFKC").toLowerCase().includes(normalized)) : allCountries;
  const byCode = new Map(allCountries.map((country) => [country.code, country]));
  return {
    countries,
    featured: normalized ? [] : FEATURED_CODES.map((code) => byCode.get(code)).filter((country): country is CountrySummary => Boolean(country)),
    query,
    totalCountries: allCountries.length,
  };
}

function canonicalValue(value: string, options: Array<{ value: string }>): string | undefined {
  return options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.value;
}

export async function getCountryPageData(code: string, params: CountrySearchParams): Promise<CountryPageData | null> {
  const countries = await getCountryDirectory();
  const country = countries.find((item) => item.code.toLowerCase() === code.trim().toLowerCase());
  if (!country) return null;
  const pageValue = firstValue(params.page);
  const rawPage = /^\d+$/.test(pageValue) ? Number(pageValue) : Number.NaN;
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const filters: CountryFiltersState = {
    search: firstValue(params.search).slice(0, 120),
    category: canonicalValue(firstValue(params.category), country.categories),
    language: canonicalValue(firstValue(params.language), country.languages),
    page: requestedPage,
  };
  const query = { country: country.code, search: filters.search || undefined, category: filters.category, language: filters.language, limit: 40 };
  let results = await getChannels({ ...query, page: requestedPage });
  if (results.totalPages > 0 && requestedPage > results.totalPages) {
    filters.page = results.totalPages;
    results = await getChannels({ ...query, page: results.totalPages });
  }
  return { country, results, filters };
}
