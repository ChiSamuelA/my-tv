import type { Channel } from "../../../../scripts/data/schema";

export interface RelatedChannelPools {
  sameCategoryCountry?: Channel[];
  sameCategory?: Channel[];
  sameCountry?: Channel[];
  general?: Channel[];
}

export function selectRelatedChannels(current: Channel, pools: RelatedChannelPools, limit = 12): Channel[] {
  const selected: Channel[] = [];
  const seen = new Set([current.id]);
  for (const pool of [pools.sameCategoryCountry, pools.sameCategory, pools.sameCountry, pools.general]) {
    for (const candidate of pool ?? []) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      selected.push(candidate);
      if (selected.length === limit) return selected;
    }
  }
  return selected;
}
