import assert from "node:assert/strict";
import test from "node:test";
import { createPlaybackCapability, verifyPlaybackCapability } from "./capability";

const secret = "test-only-secret-with-at-least-thirty-two-characters";
const now = 1_800_000_000_000;

test("creates and verifies an opaque catalog-bound capability", () => {
  const token = createPlaybackCapability({ channelId: "Channel.test", sourceId: "source-id", resourceKind: "root-manifest", expiresAt: now + 1000 }, { secret, now });
  assert.equal(token.includes("Channel.test"), false);
  assert.equal(verifyPlaybackCapability(token, { secret, now }).channelId, "Channel.test");
});

test("rejects tampered, malformed, wrong-secret, and expired capabilities", () => {
  const token = createPlaybackCapability({ channelId: "Channel.test", sourceId: "source-id", resourceKind: "root-manifest", expiresAt: now + 1000 }, { secret, now });
  const parts = token.split(".");
  parts[2] = `${parts[2][0] === "A" ? "B" : "A"}${parts[2].slice(1)}`;
  assert.throws(() => verifyPlaybackCapability(parts.join("."), { secret, now }), /Invalid playback capability/);
  assert.throws(() => verifyPlaybackCapability("not-a-token", { secret, now }), /Invalid playback capability/);
  assert.throws(() => verifyPlaybackCapability(token, { secret: `${secret}x`, now }), /Invalid playback capability/);
  assert.throws(() => verifyPlaybackCapability(token, { secret, now: now + 1000 }), /Expired capability/);
});

test("requires child resources and forbids a URL in root capabilities", () => {
  const missing = createPlaybackCapability({ channelId: "Channel.test", sourceId: "source-id", resourceKind: "media", expiresAt: now + 1000 }, { secret, now });
  const rootWithUrl = createPlaybackCapability({ channelId: "Channel.test", sourceId: "source-id", resourceKind: "root-manifest", resourceUrl: "https://example.test/injected", expiresAt: now + 1000 }, { secret, now });
  assert.throws(() => verifyPlaybackCapability(missing, { secret, now }), /Invalid playback capability/);
  assert.throws(() => verifyPlaybackCapability(rootWithUrl, { secret, now }), /Invalid playback capability/);
});
