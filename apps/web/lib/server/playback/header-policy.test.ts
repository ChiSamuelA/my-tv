import assert from "node:assert/strict";
import test from "node:test";
import type { ChannelStream } from "../../../../../scripts/data/schema";
import { buildUpstreamHeaders, headerPolicyForStream, mayForwardRefererAcrossRedirect, validateCatalogReferer, validateCatalogUserAgent } from "./header-policy";

function stream(referrer: string | null = null, userAgent: string | null = null): ChannelStream {
  return { url: "https://example.test/live.m3u8", feed: null, quality: null, availability: [], referrer, userAgent, protocol: "https", isHttps: true, provenance: { adapter: "local-iptv-checkout", file: "fixture", line: 1, upstreamChannelId: null, publishedMatch: null } };
}

test("validates catalog Referer and User-Agent policies", () => {
  assert.equal(validateCatalogReferer("https://player.example.test/watch"), "https://player.example.test/watch");
  assert.equal(validateCatalogUserAgent("Catalog Player/1.0"), "Catalog Player/1.0");
  for (const value of ["not a URL", "ftp://example.test/", "https://user:pass@example.test/", "https://example.test/\r\nX-Test: injected", `https://example.test/${"x".repeat(2050)}`]) assert.throws(() => validateCatalogReferer(value));
  for (const value of ["", "   ", "Agent\r\nX-Test: injected", `Agent/${"x".repeat(520)}`]) assert.throws(() => validateCatalogUserAgent(value));
});

test("constructs only the explicitly supported upstream headers", () => {
  assert.deepEqual(Object.keys(buildUpstreamHeaders(undefined, {})), ["Accept"]);
  assert.deepEqual(Object.keys(buildUpstreamHeaders("bytes=0-10", {})).sort(), ["Accept", "Range"]);
  assert.deepEqual(Object.keys(buildUpstreamHeaders(undefined, { referer: "https://example.test/" })).sort(), ["Accept", "Referer"]);
  assert.deepEqual(Object.keys(buildUpstreamHeaders(undefined, { userAgent: "Catalog Agent" })).sort(), ["Accept", "User-Agent"]);
  const all = buildUpstreamHeaders("bytes=0-10", headerPolicyForStream(stream("https://example.test/", "Catalog Agent")));
  assert.deepEqual(Object.keys(all).sort(), ["Accept", "Range", "Referer", "User-Agent"]);
  assert.equal("Cookie" in all || "Authorization" in all || "Origin" in all, false);
});

test("does not apply headers globally and drops Referer on unrelated redirects", () => {
  assert.deepEqual(headerPolicyForStream(stream()), {});
  assert.equal(mayForwardRefererAcrossRedirect("https://media.example.test/a", "https://cdn.media.example.test/b"), true);
  assert.equal(mayForwardRefererAcrossRedirect("https://media.example.test/a", "https://attacker.invalid/b"), false);
  assert.equal(buildUpstreamHeaders(undefined, { referer: "https://player.example.test/", userAgent: "Catalog Agent" }, false).Referer, undefined);
  assert.equal(buildUpstreamHeaders(undefined, { referer: "https://player.example.test/", userAgent: "Catalog Agent" }, false)["User-Agent"], "Catalog Agent");
});
