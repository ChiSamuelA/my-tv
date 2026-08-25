import "server-only";

import type { Channel } from "../../../../scripts/data/schema";
import { displayCategory, displayCountry } from "../content/display-names";
import { getChannels } from "./catalog";
import type { WatchRelatedChannel } from "./watch-model";
import { selectRelatedChannels } from "./related-selection";

const RELATED_LIMIT = 12;
const CANDIDATE_LIMIT = 100;

function toViewModel(channel: Channel, primaryCategory: string | null): WatchRelatedChannel {
  const category = primaryCategory && channel.categories.includes(primaryCategory) ? primaryCategory : channel.categories[0] ?? null;
  return {
    id: channel.id,
    name: channel.name,
    logo: channel.logo,
    country: channel.country ? displayCountry(channel.country) : "International",
    category: category ? displayCategory(category) : null,
  };
}

export async function getRelatedChannels(current: Channel, limit = RELATED_LIMIT): Promise<WatchRelatedChannel[]> {
  const primaryCategory = current.categories.find(Boolean) ?? null;
  const country = current.country;
  const [sameCategoryCountry, sameCategory, sameCountry] = await Promise.all([
    primaryCategory && country ? getChannels({ category: primaryCategory, country, limit: CANDIDATE_LIMIT }).then((result) => result.items) : Promise.resolve([]),
    primaryCategory ? getChannels({ category: primaryCategory, limit: CANDIDATE_LIMIT }).then((result) => result.items) : Promise.resolve([]),
    country ? getChannels({ country, limit: CANDIDATE_LIMIT }).then((result) => result.items) : Promise.resolve([]),
  ]);

  let selected = selectRelatedChannels(current, { sameCategoryCountry, sameCategory, sameCountry }, limit);
  if (selected.length < limit) {
    const general = (await getChannels({ limit: CANDIDATE_LIMIT })).items;
    selected = selectRelatedChannels(current, { sameCategoryCountry: selected, general }, limit);
  }
  return selected.map((channel) => toViewModel(channel, primaryCategory));
}
