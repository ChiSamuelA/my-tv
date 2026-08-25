import assert from "node:assert/strict";
import test from "node:test";
import type { Channel } from "../../../../scripts/data/schema";
import { selectRelatedChannels } from "./related-selection";

function channel(id: string, country: string | null, categories: string[]): Channel {
  return { id, name: id, country, languages: [], categories, logo: null, feeds: [], guides: [], provenance: { localPlaylist: true, authoritativeMetadata: null }, streams: [] };
}

test("prefers same-category same-country channels and excludes the current channel", () => {
  const current = channel("current", "FR", ["news"]);
  const local = channel("local", "FR", ["news"]);
  const international = channel("international", "US", ["news"]);
  const selected = selectRelatedChannels(current, { sameCategoryCountry: [current, local], sameCategory: [international, local] });
  assert.deepEqual(selected.map(({ id }) => id), ["local", "international"]);
});

test("deduplicates deterministically across category and country fallback pools", () => {
  const current = channel("current", "FR", ["sports"]);
  const category = channel("category", "US", ["sports"]);
  const country = channel("country", "FR", ["news"]);
  const selected = selectRelatedChannels(current, { sameCategory: [category], sameCountry: [category, country], general: [country] });
  assert.deepEqual(selected.map(({ id }) => id), ["category", "country"]);
});

test("uses country and general fallbacks when category candidates are absent", () => {
  const current = channel("current", "FR", []);
  const country = channel("country", "FR", []);
  const general = channel("general", "US", ["music"]);
  assert.deepEqual(selectRelatedChannels(current, { sameCountry: [country], general: [general] }).map(({ id }) => id), ["country", "general"]);
});

test("honors the maximum related-channel count", () => {
  const current = channel("current", "FR", ["news"]);
  const candidates = Array.from({ length: 20 }, (_, index) => channel(`candidate-${index}`, "FR", ["news"]));
  assert.equal(selectRelatedChannels(current, { sameCategoryCountry: candidates }, 12).length, 12);
});
