import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  Catalog,
  CatalogManifest,
} from "../../../scripts/data/schema";

async function readGeneratedJson<T>(filename: string): Promise<T> {
  const filePath = path.resolve(process.cwd(), "../../data/generated", filename);
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export async function loadCatalog(): Promise<Catalog> {
  return readGeneratedJson<Catalog>("catalog.json");
}

export async function loadCatalogManifest(): Promise<CatalogManifest> {
  return readGeneratedJson<CatalogManifest>("manifest.json");
}
