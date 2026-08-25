import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { readLocalIptvCheckout } from "./adapters/local-iptv.js";
import { readPublishedIptvOrgData } from "./adapters/published-iptv-org.js";
import { normalizeEntries } from "./normalize.js";
import { CATALOG_SCHEMA_VERSION, type CatalogManifest } from "./schema.js";
import { printValidation, validateCatalog } from "./validation.js";

const execFileAsync = promisify(execFile);

async function loadRootEnv(rootDir: string): Promise<void> {
  const envPath = path.join(rootDir, ".env");
  const content = await readFile(envPath, "utf8").catch(() => "");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals < 1) continue;
    const key = line.slice(0, equals).trim();
    const value = line.slice(equals + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function getCommit(sourceDir: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-c", `safe.directory=${sourceDir.replaceAll("\\", "/")}`, "-C", sourceDir, "rev-parse", "HEAD"],
      { windowsHide: true },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  await loadRootEnv(rootDir);
  const configuredPath = process.env.IPTV_SOURCE_DIR || "../iptv-mb";
  const sourceDir = path.resolve(rootDir, configuredPath);
  const outputDir = path.join(rootDir, "data", "generated");
  const publishedMode = process.argv.includes("--published");

  console.log(`Reading local IPTV checkout: ${configuredPath}`);
  const imported = await readLocalIptvCheckout(sourceDir);
  const published = publishedMode
    ? await readPublishedIptvOrgData(rootDir, { download: true })
    : undefined;
  if (published) {
    console.log(`Published metadata errors: ${published.errors.length}`);
    for (const error of published.errors.slice(0, 20)) console.log(`  ${error}`);
    console.log(`Published metadata warnings: ${published.warnings.length}`);
    for (const warning of published.warnings.slice(0, 20)) console.log(`  ${warning}`);
    if (published.warnings.length > 20) console.log(`  ... ${published.warnings.length - 20} more`);
    if (published.errors.length > 0) throw new Error("Published metadata contains fatal errors");
  }
  const normalized = normalizeEntries(imported.entries, published);
  const catalog = normalized.catalog;
  const validation = validateCatalog(catalog);
  printValidation(validation);
  console.log(`Import warnings: ${imported.warnings.length}`);
  for (const warning of imported.warnings.slice(0, 20)) console.log(`  ${warning}`);
  if (imported.warnings.length > 20) console.log(`  ... ${imported.warnings.length - 20} more`);
  if (validation.errors.length > 0) {
    throw new Error("Catalog contains fatal validation errors; generated files were not replaced");
  }

  const streamCount = catalog.channels.reduce((sum, channel) => sum + channel.streams.length, 0);
  const manifest: CatalogManifest = {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      pathType: "local-checkout",
      configuredPath,
      upstreamCommit: await getCommit(sourceDir),
      published: published?.revision ?? null,
    },
    channelCount: catalog.channels.length,
    streamCount,
    enrichment: {
      channelsEnriched: catalog.channels.filter((channel) => channel.provenance.authoritativeMetadata).length,
      channelsWithoutAuthoritativeMetadata: catalog.channels.filter((channel) => !channel.provenance.authoritativeMetadata).length,
      channelsWithLogos: catalog.channels.filter((channel) => channel.logo).length,
      channelsWithCategories: catalog.channels.filter((channel) => channel.categories.length > 0).length,
      channelsWithLanguages: catalog.channels.filter((channel) => channel.languages.length > 0).length,
      channelsWithCountry: catalog.channels.filter((channel) => channel.country).length,
      localStreamsMatchedByPublishedUrl: normalized.localStreamsMatchedByPublishedUrl,
    },
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${manifest.channelCount} channels and ${manifest.streamCount} streams`);
  console.log(`Enriched ${manifest.enrichment.channelsEnriched} channels; ${manifest.enrichment.channelsWithoutAuthoritativeMetadata} remain local-only`);
  const sports = catalog.channels.filter((channel) => channel.categories.includes("sports")).length;
  console.log(`Sports category: ${sports} channels`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
