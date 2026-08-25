import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Catalog, CatalogManifest } from "../../../../../scripts/data/schema";
import { CATALOG_SCHEMA_VERSION } from "../../../../../scripts/data/schema";

interface CatalogFiles {
  catalog: Catalog;
  manifest: CatalogManifest;
}

let catalogFilesPromise: Promise<CatalogFiles> | undefined;

async function readJson(filename: string): Promise<unknown> {
  const filePath = path.resolve(process.cwd(), "../../data/generated", filename);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read generated catalog file '${filename}': ${detail}`, { cause: error });
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`Generated catalog file '${filename}' contains malformed JSON`, { cause: error });
  }
}

function assertCatalog(value: unknown): asserts value is Catalog {
  if (!value || typeof value !== "object") throw new Error("Generated catalog must be a JSON object");
  const candidate = value as Partial<Catalog>;
  if (candidate.schemaVersion !== CATALOG_SCHEMA_VERSION) {
    throw new Error(`Incompatible catalog schema version '${String(candidate.schemaVersion)}'; expected '${CATALOG_SCHEMA_VERSION}'`);
  }
  if (!Array.isArray(candidate.channels)) throw new Error("Generated catalog is missing its channels array");
  for (const [index, channel] of candidate.channels.entries()) {
    if (!channel || typeof channel.id !== "string" || !channel.id.trim()) {
      throw new Error(`Generated catalog channel at index ${index} is missing its ID`);
    }
    if (typeof channel.name !== "string" || !Array.isArray(channel.streams)) {
      throw new Error(`Generated catalog channel '${channel.id}' is malformed`);
    }
  }
}

function assertManifest(value: unknown): asserts value is CatalogManifest {
  if (!value || typeof value !== "object") throw new Error("Generated manifest must be a JSON object");
  const candidate = value as Partial<CatalogManifest>;
  if (candidate.schemaVersion !== CATALOG_SCHEMA_VERSION) {
    throw new Error(`Incompatible manifest schema version '${String(candidate.schemaVersion)}'; expected '${CATALOG_SCHEMA_VERSION}'`);
  }
  if (typeof candidate.generatedAt !== "string" || !Number.isInteger(candidate.channelCount) ||
      !Number.isInteger(candidate.streamCount) || !candidate.enrichment) {
    throw new Error("Generated catalog manifest is malformed");
  }
}

async function loadCatalogFiles(): Promise<CatalogFiles> {
  const [catalogValue, manifestValue] = await Promise.all([
    readJson("catalog.json"),
    readJson("manifest.json"),
  ]);
  assertCatalog(catalogValue);
  assertManifest(manifestValue);
  if (catalogValue.channels.length !== manifestValue.channelCount) {
    throw new Error(`Catalog/manifest channel count mismatch: ${catalogValue.channels.length} versus ${manifestValue.channelCount}`);
  }
  const streamCount = catalogValue.channels.reduce((total, channel) => total + channel.streams.length, 0);
  if (streamCount !== manifestValue.streamCount) {
    throw new Error(`Catalog/manifest stream count mismatch: ${streamCount} versus ${manifestValue.streamCount}`);
  }
  return { catalog: catalogValue, manifest: manifestValue };
}

export function getCatalogFiles(): Promise<CatalogFiles> {
  catalogFilesPromise ??= loadCatalogFiles();
  return catalogFilesPromise;
}
