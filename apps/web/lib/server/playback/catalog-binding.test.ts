import assert from "node:assert/strict";
import test from "node:test";
import type { Channel, ChannelStream } from "../../../../../scripts/data/schema";
import { sourceIdentity } from "../watch-model";
import { resolveCatalogBoundResource } from "./catalog-binding";
import type { PlaybackCapability } from "./types";

function stream(url = "https://example.test/live.m3u8"): ChannelStream {
  return { url, feed: null, quality: null, availability: [], referrer: null, userAgent: null, protocol: new URL(url).protocol.slice(0, -1), isHttps: url.startsWith("https:"), provenance: { adapter: "local-iptv-checkout", file: "fixture", line: 1, upstreamChannelId: null, publishedMatch: null } };
}
function channel(item = stream()): Channel {
  return { id: "Proof.test", name: "Proof", country: null, languages: [], categories: [], logo: null, feeds: [], guides: [], provenance: { localPlaylist: true, authoritativeMetadata: null }, streams: [item] };
}
function capability(channelId: string, sourceId: string): PlaybackCapability {
  return { version: 1, channelId, sourceId, resourceKind: "root-manifest", expiresAt: Date.now() + 1000 };
}

test("binds a root resource to the exact catalog channel and source", async () => {
  const fixture = channel();
  const result = await resolveCatalogBoundResource(capability(fixture.id, sourceIdentity(fixture.streams[0])), async (id) => id === fixture.id ? fixture : null, () => true);
  assert.equal(result.upstreamUrl, fixture.streams[0].url);
  assert.deepEqual(result.headerPolicy, {});
});

test("rejects unknown channels, unknown sources, mismatched sources, and disabled proof sources", async () => {
  const fixture = channel();
  const lookup = async (id: string) => id === fixture.id ? fixture : null;
  await assert.rejects(resolveCatalogBoundResource(capability("Missing.test", "x"), lookup, () => true), /Unknown gateway channel/);
  await assert.rejects(resolveCatalogBoundResource(capability(fixture.id, "unknown"), lookup, () => true), /does not belong/);
  await assert.rejects(resolveCatalogBoundResource(capability(fixture.id, sourceIdentity(fixture.streams[0])), lookup, () => false), /not enabled/);
});

test("rejects HTTP and non-HLS catalog sources", async () => {
  for (const fixture of [channel(stream("http://example.test/live.m3u8")), channel(stream("https://example.test/live.mp4"))]) {
    await assert.rejects(resolveCatalogBoundResource(capability(fixture.id, sourceIdentity(fixture.streams[0])), async () => fixture, () => true));
  }
});

test("binds one source policy across every HLS resource kind without mixing source policies", async () => {
  const first = { ...stream("https://example.test/first.m3u8"), userAgent: "First Agent" };
  const second = { ...stream("https://example.test/second.m3u8"), userAgent: "Second Agent" };
  const fixture = { ...channel(first), streams: [first, second] };
  for (const resourceKind of ["root-manifest", "manifest", "media", "key"] as const) {
    const value: PlaybackCapability = { ...capability(fixture.id, sourceIdentity(first)), resourceKind, ...(resourceKind === "root-manifest" ? {} : { resourceUrl: "https://cdn.example.test/resource" }) };
    const result = await resolveCatalogBoundResource(value, async () => fixture, () => true);
    assert.equal(result.headerPolicy.userAgent, "First Agent");
    assert.notEqual(result.headerPolicy.userAgent, "Second Agent");
  }
});

test("rejects injected catalog header metadata", async () => {
  const fixture = channel({ ...stream(), userAgent: "Agent\r\nCookie: injected" });
  await assert.rejects(resolveCatalogBoundResource(capability(fixture.id, sourceIdentity(fixture.streams[0])), async () => fixture, () => true), /Invalid catalog User-Agent/);
});
