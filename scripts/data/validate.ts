import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Catalog } from "./schema.js";
import { printValidation, validateCatalog } from "./validation.js";

const rootDir = process.cwd();
const catalogPath = path.join(rootDir, "data", "generated", "catalog.json");

async function main(): Promise<void> {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as Catalog;
  const result = validateCatalog(catalog);
  printValidation(result);
  if (result.errors.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
