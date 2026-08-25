import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSearchParams } from "./search-params";

test("normalizes missing and whitespace-only search queries to the initial state", () => {
  assert.deepEqual(normalizeSearchParams({}), { query: "", page: 1 });
  assert.deepEqual(normalizeSearchParams({ q: "   " }), { query: "", page: 1 });
});

test("trims and caps global search queries", () => {
  assert.deepEqual(normalizeSearchParams({ q: "  BEIN  ", page: "2" }), { query: "BEIN", page: 2 });
  assert.equal(normalizeSearchParams({ q: "x".repeat(140) }).query.length, 120);
});

test("uses page one for malformed, zero, negative, and array parameters", () => {
  assert.equal(normalizeSearchParams({ page: "two" }).page, 1);
  assert.equal(normalizeSearchParams({ page: "0" }).page, 1);
  assert.equal(normalizeSearchParams({ page: "-4" }).page, 1);
  assert.deepEqual(normalizeSearchParams({ q: ["bbc", "cnn"], page: ["3", "4"] }), { query: "bbc", page: 3 });
});
