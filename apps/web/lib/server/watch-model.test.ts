import assert from "node:assert/strict";
import test from "node:test";
import type { Channel, ChannelStream } from "../../../../scripts/data/schema";
import { createWatchPageData, resolveWatchChannelId, sourceIdentity } from "./watch-model";

function stream(url: string, protocol: string, isHttps: boolean): ChannelStream {
  return { url, feed: "SD", quality: "720p", availability: [], referrer: null, userAgent: null, protocol, isHttps, provenance: { adapter: "local-iptv-checkout", file: "fixture.m3u", line: 1, upstreamChannelId: null, publishedMatch: null } };
}

function channel(streams: ChannelStream[]): Channel {
  return { id: "Fixture News.test", name: "Fixture News", country: "FR", languages: ["fra"], categories: ["news"], logo: null, feeds: [{ id: "SD", name: "Main", isMain: true, broadcastAreas: [], timezones: [], languages: ["fra"], format: "720p" }], guides: [], provenance: { localPlaylist: true, authoritativeMetadata: null }, streams };
}

test("resolves valid, encoded, invalid, and malformed channel IDs", async () => {
  const fixture = channel([]);
  const lookup = async (id: string) => id === fixture.id ? fixture : null;
  assert.equal((await resolveWatchChannelId(fixture.id, lookup))?.id, fixture.id);
  assert.equal((await resolveWatchChannelId(encodeURIComponent(fixture.id), lookup))?.id, fixture.id);
  assert.equal(await resolveWatchChannelId("Missing.test", lookup), null);
  assert.equal(await resolveWatchChannelId("%E0%A4%A", lookup), null);
});

test("builds stable sources in catalog order and validates selection", () => {
  const first = stream("https://example.test/main.m3u8", "https", true);
  const second = stream("http://example.test/alternate.m3u8", "http", false);
  const initial = createWatchPageData(channel([first, second]));
  assert.equal(initial.sources.length, 2);
  assert.equal(initial.selectedSource?.id, sourceIdentity(first));
  assert.equal(initial.sources[1]?.id, sourceIdentity(second));
  assert.equal(createWatchPageData(channel([first, second]), "invalid").selectedSource?.id, sourceIdentity(first));
  assert.equal(createWatchPageData(channel([first, second]), sourceIdentity(second)).selectedSource?.id, sourceIdentity(second));
  assert.equal(sourceIdentity(first), sourceIdentity(first));
});

test("detects HTTPS, HTTP, HLS, unsupported, single-source, and zero-source states", () => {
  const secure = createWatchPageData(channel([stream("https://example.test/live.m3u8", "https", true)]));
  assert.equal(secure.sources[0]?.format, "HLS");
  assert.equal(secure.playbackState, "ready");
  assert.equal(createWatchPageData(channel([stream("http://example.test/live.m3u8", "http", false)])).playbackState, "insecure-source");
  assert.equal(createWatchPageData(channel([stream("rtmp://example.test/live", "rtmp", false)])).playbackState, "unsupported");
  assert.equal(createWatchPageData(channel([])).playbackState, "unavailable");
});
