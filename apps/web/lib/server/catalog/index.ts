import "server-only";

import type { Channel } from "../../../../../scripts/data/schema";
import { getCatalogFiles } from "./loader";
import { createCatalogStore, type CatalogStore } from "./store";
import type { CatalogStats, CountryCatalogFacet, GetChannelsOptions, PaginatedChannels } from "./types";

let storePromise: Promise<CatalogStore> | undefined;

async function getStore(): Promise<CatalogStore> {
  storePromise ??= getCatalogFiles().then(({ catalog, manifest }) =>
    createCatalogStore(catalog, manifest),
  );
  return storePromise;
}

export async function getChannelById(id: string): Promise<Channel | null> {
  return (await getStore()).getChannelById(id);
}

export async function getChannels(options?: GetChannelsOptions): Promise<PaginatedChannels> {
  return (await getStore()).getChannels(options);
}

export async function getCategories(): Promise<string[]> {
  return (await getStore()).getCategories();
}

export async function getCountries(): Promise<string[]> {
  return (await getStore()).getCountries();
}

export async function getLanguages(): Promise<string[]> {
  return (await getStore()).getLanguages();
}

export async function getCatalogStats(): Promise<CatalogStats> {
  return (await getStore()).getCatalogStats();
}

export async function getCountryFacets(): Promise<CountryCatalogFacet[]> {
  return (await getStore()).getCountryFacets();
}

export type { CatalogStats, CountryCatalogFacet, GetChannelsOptions, PaginatedChannels } from "./types";
