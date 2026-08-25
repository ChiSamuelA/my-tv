import assert from "node:assert/strict";
import test from "node:test";
import { verifyPlaybackCapability } from "./capability";
import { rewriteHlsManifest } from "./hls-rewrite";

const secret = "test-only-secret-with-at-least-thirty-two-characters";
const expiresAt = 1_900_000_000_000;

function decodePaths(value: string) {
  return [...value.matchAll(/\/api\/playback\/([^\s"]+)/g)].map((match) => verifyPlaybackCapability(decodeURIComponent(match[1]), { secret, now: expiresAt - 1 }));
}

test("rewrites relative and absolute playlists and segments without exposing upstream URLs", () => {
  const input = "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nvideo/720.m3u8?token=x\n#EXTINF:4,\nhttps://cdn.example.test/segment.ts?part=1\n";
  const output = rewriteHlsManifest(input, { channelId: "Channel.test", sourceId: "source", manifestUrl: "https://origin.example.test/live/master.m3u8", expiresAt, secret });
  assert.equal(output.includes("origin.example.test"), false);
  assert.equal(output.includes("cdn.example.test"), false);
  const values = decodePaths(output);
  assert.equal(values[0].resourceKind, "manifest");
  assert.equal(values[0].resourceUrl, "https://origin.example.test/live/video/720.m3u8?token=x");
  assert.equal(values[1].resourceKind, "media");
  assert.equal(values[1].resourceUrl, "https://cdn.example.test/segment.ts?part=1");
});

test("rewrites EXT-X-MEDIA, MAP, and KEY URI attributes", () => {
  const input = "#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,URI=\"audio/index.m3u8\"\n#EXT-X-MAP:URI=\"init.mp4\"\n#EXT-X-KEY:METHOD=AES-128,URI=\"https://keys.example.test/key.bin\"\n#EXTINF:4,\nsegment.m4s\n";
  const output = rewriteHlsManifest(input, { channelId: "Channel.test", sourceId: "source", manifestUrl: "https://origin.example.test/live/index.m3u8", expiresAt, secret });
  assert.deepEqual(decodePaths(output).map((value) => value.resourceKind), ["manifest", "media", "key", "media"]);
  assert.equal(output.includes("keys.example.test"), false);
});

test("rejects non-HLS input", () => {
  assert.throws(() => rewriteHlsManifest("<html>error</html>", { channelId: "x", sourceId: "y", manifestUrl: "https://example.test/a", expiresAt, secret }), /not an HLS manifest/);
});

test("rewrites consecutive live refreshes with fresh segment capabilities", () => {
  const first = "#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:10\n#EXT-X-KEY:METHOD=AES-128,URI=\"keys/key-10.bin\"\n#EXTINF:5,\nsegments/10.ts?token=first\n";
  const second = "#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:11\n#EXT-X-KEY:METHOD=AES-128,URI=\"keys/key-11.bin\"\n#EXTINF:5,\nsegments/11.ts?token=second\n";
  const context = { channelId: "Channel.test", sourceId: "source", manifestUrl: "https://origin.example.test/live/index.m3u8", expiresAt, secret };
  const firstValues = decodePaths(rewriteHlsManifest(first, context));
  const secondValues = decodePaths(rewriteHlsManifest(second, context));
  assert.equal(firstValues[1].resourceUrl, "https://origin.example.test/live/segments/10.ts?token=first");
  assert.equal(secondValues[1].resourceUrl, "https://origin.example.test/live/segments/11.ts?token=second");
  assert.notEqual(firstValues[0].resourceUrl, secondValues[0].resourceUrl);
  assert.notEqual(firstValues[1].resourceUrl, secondValues[1].resourceUrl);
});
