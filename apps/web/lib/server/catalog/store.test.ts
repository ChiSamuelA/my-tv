import assert from "node:assert/strict";
import test from "node:test";
import type {
  Catalog,
  CatalogManifest,
  Channel,
} from "../../../../../scripts/data/schema";
import { CATALOG_SCHEMA_VERSION } from "../../../../../scripts/data/schema";
import { createCatalogStore } from "./store";

function channel(
  id: string,
  name: string,
  country: string,
  languages: string[],
  categories: string[],
): Channel {
  return {
    id,
    name,
    country,
    languages,
    categories,
    logo: `https://example.test/${id}.png`,
    feeds: [{
      id: "SD",
      name: "SD",
      isMain: true,
      broadcastAreas: [`c/${country}`],
      timezones: [],
      languages,
      format: "720p",
    }],
    guides: [{
      feed: "SD",
      site: "guide.example.test",
      siteId: id,
      siteName: name,
      language: "en",
      sources: [{ host: "guide.example.test", url: "https://guide.example.test/guide.xml", format: "XML" }],
    }],
    provenance: {
      localPlaylist: true,
      authoritativeMetadata: { dataset: "channels.json", channelId: id },
    },
    streams: [{
      url: `https://stream.example.test/${id}.m3u8`,
      feed: "SD",
      quality: "720p",
      availability: [],
      referrer: null,
      userAgent: null,
      protocol: "https",
      isHttps: true,
      provenance: {
        adapter: "local-iptv-checkout",
        file: "streams/fixture.m3u",
        line: 1,
        upstreamChannelId: `${id}@SD`,
        publishedMatch: { dataset: "streams.json", matchedBy: "url" },
      },
    }],
  };
}

const catalog: Catalog = {
  schemaVersion: CATALOG_SCHEMA_VERSION,
  channels: [
    channel("ZuluSports.de", "Zulu Sports", "DE", ["deu"], ["sports"]),
    channel("Alpha.fr", "Alpha Télévision", "FR", ["fra"], ["sports"]),
    channel("News.us", "Daily News", "US", ["eng"], ["news"]),
    channel("beINSports.fr", "beIN Sports France", "FR", ["ara", "fra"], ["sports"]),
    channel("Culture.fr", "Culture France", "FR", ["fra"], ["culture"]),
  ],
};

const manifest: CatalogManifest = {
  schemaVersion: CATALOG_SCHEMA_VERSION,
  generatedAt: "2026-08-25T00:00:00.000Z",
  source: { pathType: "local-checkout", configuredPath: "fixture", upstreamCommit: null, published: null },
  channelCount: 5,
  streamCount: 5,
  enrichment: {
    channelsEnriched: 5,
    channelsWithoutAuthoritativeMetadata: 0,
    channelsWithLogos: 5,
    channelsWithCategories: 5,
    channelsWithLanguages: 5,
    channelsWithCountry: 5,
    localStreamsMatchedByPublishedUrl: 5,
  },
};

const store = createCatalogStore(catalog, manifest);

test("gets a complete existing channel by ID", () => {
  const result = store.getChannelById("beINSports.fr");
  assert.equal(result?.name, "beIN Sports France");
  assert.equal(result?.streams.length, 1);
  assert.equal(result?.feeds[0]?.id, "SD");
  assert.equal(result?.guides[0]?.siteId, "beINSports.fr");
});

test("returns null for a missing channel ID", () => {
  assert.equal(store.getChannelById("Missing.example"), null);
});

test("filters the authoritative sports category", () => {
  const result = store.getChannels({ category: "SPORTS", page: 1, limit: 40 });
  assert.equal(result.totalItems, 3);
  assert.deepEqual(result.items.map((item) => item.id), ["Alpha.fr", "beINSports.fr", "ZuluSports.de"]);
});

test("filters countries case-insensitively", () => {
  assert.equal(store.getChannels({ country: "fr" }).totalItems, 3);
});

test("filters ISO 639-3 language codes case-insensitively", () => {
  assert.equal(store.getChannels({ language: "FRA" }).totalItems, 3);
});

test("searches names and IDs case-insensitively", () => {
  assert.deepEqual(store.getChannels({ search: "BeIn" }).items.map((item) => item.id), ["beINSports.fr"]);
  assert.deepEqual(store.getChannels({ search: "news.us" }).items.map((item) => item.id), ["News.us"]);
});

test("paginates deterministically", () => {
  const first = store.getChannels({ category: "sports", page: 1, limit: 2 });
  const second = store.getChannels({ category: "sports", page: 2, limit: 2 });
  assert.deepEqual(first.items.map((item) => item.id), ["Alpha.fr", "beINSports.fr"]);
  assert.deepEqual(second.items.map((item) => item.id), ["ZuluSports.de"]);
  assert.equal(first.totalPages, 2);
  assert.deepEqual(store.getChannels({ category: "sports", page: 1, limit: 2 }), first);
});

test("rejects invalid page, limit, and missing lookup IDs", () => {
  assert.throws(() => store.getChannels({ page: 0 }), RangeError);
  assert.throws(() => store.getChannels({ page: 1.5 }), RangeError);
  assert.throws(() => store.getChannels({ limit: 0 }), RangeError);
  assert.throws(() => store.getChannels({ limit: 101 }), RangeError);
  assert.throws(() => store.getChannelById("  "), TypeError);
});

test("returns stable empty pagination metadata", () => {
  assert.deepEqual(store.getChannels({ search: "nothing-matches-this", page: 1, limit: 10 }), {
    items: [], page: 1, limit: 10, totalItems: 0, totalPages: 0,
  });
});

test("builds deterministic country counts and scoped facets", () => {
  assert.deepEqual(store.getCountryFacets(), [
    { code: "DE", channelCount: 1, categories: ["sports"], languages: ["deu"] },
    { code: "FR", channelCount: 3, categories: ["culture", "sports"], languages: ["ara", "fra"] },
    { code: "US", channelCount: 1, categories: ["news"], languages: ["eng"] },
  ]);
});
