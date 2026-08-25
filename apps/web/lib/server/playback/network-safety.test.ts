import assert from "node:assert/strict";
import test from "node:test";
import { isPublicIpAddress, validateNetworkTarget } from "./network-safety";
import { resolveRedirectTarget, validRangeHeader } from "./upstream";

test("rejects private, loopback, link-local, metadata, reserved, and malformed addresses", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::", "::1", "fc00::1", "fe80::1", "ff02::1", "2001:db8::1", "::ffff:127.0.0.1"]) assert.equal(isPublicIpAddress(address), false, address);
  assert.equal(isPublicIpAddress("8.8.8.8"), true);
  assert.equal(isPublicIpAddress("2606:4700:4700::1111"), true);
});

test("rejects unsupported protocols, credentials, localhost, and unsafe literal targets", async () => {
  await assert.rejects(validateNetworkTarget("http://example.com/live.m3u8"), /Only HTTPS/);
  await assert.rejects(validateNetworkTarget("https://user:pass@example.com/live.m3u8"), /Credentialed/);
  await assert.rejects(validateNetworkTarget("https://localhost/live.m3u8"), /Unsafe upstream hostname/);
  await assert.rejects(validateNetworkTarget("https://127.0.0.1/live.m3u8"), /Unsafe upstream address/);
  await assert.rejects(validateNetworkTarget("https://[::1]/live.m3u8"), /Unsafe upstream address/);
});

test("allows only a bounded single byte range", () => {
  assert.equal(validRangeHeader("bytes=0-1023"), "bytes=0-1023");
  assert.equal(validRangeHeader("bytes=-500"), "bytes=-500");
  assert.equal(validRangeHeader("bytes=0-1,5-8"), undefined);
  assert.equal(validRangeHeader("items=0-10"), undefined);
});

test("rejects unsafe redirect destinations and excessive redirect chains", async () => {
  await assert.rejects(resolveRedirectTarget("https://127.0.0.1/secret", "https://example.com/start", 0, 4), /Unsafe upstream address/);
  await assert.rejects(resolveRedirectTarget("https://example.com/again", "https://example.com/start", 4, 4), /Too many upstream redirects/);
  await assert.rejects(resolveRedirectTarget(undefined, "https://example.com/start", 0, 4), /omitted Location/);
});
