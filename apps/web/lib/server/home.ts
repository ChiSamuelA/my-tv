import "server-only";

import type { Channel } from "../../../../scripts/data/schema";
import { HOME_EDITORIAL } from "../content/home";
import {
  getCategories,
  getChannelById,
  getChannels,
} from "./catalog";

export interface HomeCountry {
  code: string;
  name: string;
  flag: string;
  channelCount: number;
}

export interface HomeData {
  heroChannels: Channel[];
  sportsChannels: Channel[];
  newsChannels: Channel[];
  entertainmentChannels: Channel[];
  countries: HomeCountry[];
  categories: Array<{ id: string; label: string }>;
}

async function resolveEditorialSection(
  ids: readonly string[],
  fallbackCategories: readonly string[],
  count: number,
  requireLogo = false,
): Promise<Channel[]> {
  const configured = (await Promise.all(ids.map((id) => getChannelById(id))))
    .filter((channel): channel is Channel => channel !== null)
    .filter((channel) => !requireLogo || Boolean(channel.logo));
  const selected = new Map(configured.map((channel) => [channel.id, channel]));

  for (const category of fallbackCategories) {
    if (selected.size >= count) break;
    const fallback = await getChannels({ category, page: 1, limit: 100 });
    for (const channel of fallback.items) {
      if (requireLogo && !channel.logo) continue;
      selected.set(channel.id, channel);
      if (selected.size >= count) break;
    }
  }

  return [...selected.values()].slice(0, count);
}

export async function getHomeData(): Promise<HomeData> {
  const [sectionData, countryResults] = await Promise.all([
    Promise.all([
      resolveEditorialSection(HOME_EDITORIAL.heroChannelIds, ["sports", "news", "movies"], 4, true),
      resolveEditorialSection(HOME_EDITORIAL.sportsChannelIds, ["sports"], 12),
      resolveEditorialSection(HOME_EDITORIAL.newsChannelIds, ["news"], 12),
      resolveEditorialSection(HOME_EDITORIAL.entertainmentChannelIds, ["movies", "entertainment"], 12),
      getCategories(),
    ]),
    Promise.all(
      HOME_EDITORIAL.countries.map(({ code }) =>
        getChannels({ country: code, page: 1, limit: 1 }),
      ),
    ),
  ]);
  const [
    heroChannels,
    sportsChannels,
    newsChannels,
    entertainmentChannels,
    availableCategories,
  ] = sectionData;

  const categorySet = new Set(availableCategories);
  return {
    heroChannels,
    sportsChannels,
    newsChannels,
    entertainmentChannels,
    countries: HOME_EDITORIAL.countries.map((country, index) => ({
      ...country,
      channelCount: countryResults[index]?.totalItems ?? 0,
    })),
    categories: HOME_EDITORIAL.categories.filter(({ id }) => categorySet.has(id)),
  };
}
