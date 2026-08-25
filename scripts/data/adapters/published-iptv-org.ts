import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const IPTV_ORG_API_BASE_URL = "https://iptv-org.github.io/api";
const DATASET_NAMES = ["channels", "feeds", "logos", "streams", "guides"] as const;
type DatasetName = (typeof DATASET_NAMES)[number];

export interface PublishedChannel {
  id: string;
  name: string;
  country: string;
  categories: string[];
}

export interface PublishedFeed {
  channel: string;
  id: string;
  name: string;
  is_main: boolean;
  broadcast_area: string[];
  timezones: string[];
  languages: string[];
  format: string | null;
}

export interface PublishedLogo {
  channel: string;
  feed: string | null;
  in_use: boolean;
  tags: string[];
  width: number;
  height: number;
  format: string | null;
  url: string;
}

export interface PublishedStream {
  channel: string | null;
  feed: string | null;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  quality: string | null;
  label: string | null;
}

export interface PublishedGuide {
  channel: string | null;
  feed: string | null;
  site: string;
  site_id: string;
  site_name: string;
  lang: string;
  sources: Array<{ host: string; url: string; format: string }>;
}

export interface PublishedCacheManifest {
  baseUrl: string;
  fetchedAt: string;
  files: Array<{
    name: string;
    etag: string | null;
    lastModified: string | null;
  }>;
}

export interface PublishedData {
  channels: PublishedChannel[];
  feeds: PublishedFeed[];
  logos: PublishedLogo[];
  streams: PublishedStream[];
  guides: PublishedGuide[];
  revision: PublishedCacheManifest;
  errors: string[];
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

function nullableString(value: unknown): string | null | undefined {
  return value === null || typeof value === "string" ? value : undefined;
}

function validHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function validStreamUrl(value: string): boolean {
  try {
    return ["http:", "https:", "rtmp:", "rtsp:", "mmsh:", "srt:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function downloadDatasets(cacheDir: string): Promise<PublishedCacheManifest> {
  await mkdir(cacheDir, { recursive: true });
  const files: PublishedCacheManifest["files"] = [];
  for (const name of DATASET_NAMES) {
    const filename = `${name}.json`;
    const response = await fetch(`${IPTV_ORG_API_BASE_URL}/${filename}`, {
      headers: { Accept: "application/json", "User-Agent": "my-tv-data-pipeline/1.0" },
    });
    if (!response.ok) throw new Error(`Failed to download ${filename}: HTTP ${response.status}`);
    const raw = await response.text();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error(`${filename} is not a JSON array`);
    const temporaryPath = path.join(cacheDir, `${filename}.tmp`);
    await writeFile(temporaryPath, `${JSON.stringify(parsed)}\n`);
    await rename(temporaryPath, path.join(cacheDir, filename));
    files.push({
      name: filename,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    });
  }
  const manifest: PublishedCacheManifest = {
    baseUrl: IPTV_ORG_API_BASE_URL,
    fetchedAt: new Date().toISOString(),
    files,
  };
  await writeFile(path.join(cacheDir, "cache-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

async function readArray(cacheDir: string, name: DatasetName): Promise<unknown[]> {
  const parsed: unknown = JSON.parse(await readFile(path.join(cacheDir, `${name}.json`), "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${name}.json is not a JSON array`);
  return parsed;
}

export async function readPublishedIptvOrgData(
  rootDir: string,
  options: { download: boolean },
): Promise<PublishedData> {
  const cacheDir = path.join(rootDir, "data", "cache", "iptv-org");
  const revision = options.download
    ? await downloadDatasets(cacheDir)
    : JSON.parse(await readFile(path.join(cacheDir, "cache-manifest.json"), "utf8")) as PublishedCacheManifest;
  const [rawChannels, rawFeeds, rawLogos, rawStreams, rawGuides] = await Promise.all(
    DATASET_NAMES.map((name) => readArray(cacheDir, name)),
  );
  const errors: string[] = [];
  const warnings: string[] = [];

  const channels: PublishedChannel[] = [];
  const channelIds = new Set<string>();
  rawChannels.forEach((item, index) => {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id.trim() ||
        typeof item.name !== "string" || !item.name.trim() || typeof item.country !== "string" ||
        !strings(item.categories)) {
      warnings.push(`channels.json[${index}] is malformed and was not used`);
      return;
    }
    if (channelIds.has(item.id)) {
      errors.push(`channels.json contains duplicate ID '${item.id}'`);
      return;
    }
    channelIds.add(item.id);
    channels.push({ id: item.id, name: item.name, country: item.country, categories: strings(item.categories) ?? [] });
  });

  const feeds: PublishedFeed[] = [];
  const feedKeys = new Set<string>();
  rawFeeds.forEach((item, index) => {
    if (!isRecord(item) || typeof item.channel !== "string" || typeof item.id !== "string" ||
        typeof item.name !== "string" || typeof item.is_main !== "boolean" ||
        !strings(item.broadcast_area) || !strings(item.timezones) || !strings(item.languages) ||
        nullableString(item.format) === undefined) {
      warnings.push(`feeds.json[${index}] is malformed and was not used`);
      return;
    }
    const key = `${item.channel}@${item.id}`;
    if (feedKeys.has(key)) errors.push(`feeds.json contains duplicate feed '${key}'`);
    else if (!channelIds.has(item.channel)) warnings.push(`Feed '${key}' references a missing channel`);
    else {
      feedKeys.add(key);
      feeds.push(item as unknown as PublishedFeed);
    }
  });

  const logos: PublishedLogo[] = [];
  rawLogos.forEach((item, index) => {
    if (!isRecord(item) || typeof item.channel !== "string" || nullableString(item.feed) === undefined ||
        typeof item.in_use !== "boolean" || !strings(item.tags) || typeof item.width !== "number" ||
        typeof item.height !== "number" || nullableString(item.format) === undefined ||
        typeof item.url !== "string" || !validHttpUrl(item.url)) {
      warnings.push(`logos.json[${index}] is malformed and was not used`);
    } else if (!channelIds.has(item.channel)) warnings.push(`Logo at logos.json[${index}] references missing channel '${item.channel}'`);
    else logos.push(item as unknown as PublishedLogo);
  });

  const streams: PublishedStream[] = [];
  const publishedUrls = new Set<string>();
  rawStreams.forEach((item, index) => {
    if (!isRecord(item) || nullableString(item.channel) === undefined || nullableString(item.feed) === undefined ||
        typeof item.url !== "string" || !validStreamUrl(item.url) || nullableString(item.referrer) === undefined ||
        nullableString(item.user_agent) === undefined || nullableString(item.quality) === undefined ||
        nullableString(item.label) === undefined) {
      warnings.push(`streams.json[${index}] is malformed and was not used`);
    } else {
      if (publishedUrls.has(item.url)) warnings.push(`streams.json contains duplicate URL '${item.url}'`);
      publishedUrls.add(item.url);
      if (item.channel && !channelIds.has(item.channel as string)) warnings.push(`Published stream '${item.url}' references missing channel '${item.channel}'`);
      streams.push(item as unknown as PublishedStream);
    }
  });

  const guides: PublishedGuide[] = [];
  const guideKeys = new Set<string>();
  rawGuides.forEach((item, index) => {
    const sources = isRecord(item) && Array.isArray(item.sources) ? item.sources : null;
    const validSources = sources?.every((source) => isRecord(source) && typeof source.host === "string" &&
      typeof source.url === "string" && validHttpUrl(source.url) && typeof source.format === "string");
    if (!isRecord(item) || nullableString(item.channel) === undefined || nullableString(item.feed) === undefined ||
        typeof item.site !== "string" || typeof item.site_id !== "string" || typeof item.site_name !== "string" ||
        typeof item.lang !== "string" || !validSources) {
      warnings.push(`guides.json[${index}] is malformed and was not used`);
    } else {
      const key = `${item.channel ?? ""}@${item.feed ?? ""}:${item.site}:${item.site_id}:${item.lang}`;
      if (guideKeys.has(key)) warnings.push(`guides.json contains duplicate guide '${key}'`);
      else if (item.channel && !channelIds.has(item.channel as string)) warnings.push(`Guide '${key}' references a missing channel`);
      else {
        guideKeys.add(key);
        guides.push(item as unknown as PublishedGuide);
      }
    }
  });

  return { channels, feeds, logos, streams, guides, revision, errors, warnings };
}
