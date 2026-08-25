import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export interface LocalPlaylistEntry {
  upstreamChannelId: string | null;
  name: string;
  country: string | null;
  logo: string | null;
  url: string;
  referrer: string | null;
  userAgent: string | null;
  sourceFile: string;
  sourceLine: number;
}

export interface LocalReadResult {
  entries: LocalPlaylistEntry[];
  warnings: string[];
}

function parseAttributes(value: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of value.matchAll(/([\w-]+)="([^"]*)"/g)) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function countryFromFilename(filename: string): string | null {
  const match = /^([a-z]{2})(?:_|\.)/i.exec(filename);
  return match ? match[1].toUpperCase() : null;
}

export function syntheticChannelId(
  name: string,
  country: string | null,
): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "unnamed";
  const digest = createHash("sha256")
    .update(`${country ?? "XX"}\0${name}`)
    .digest("hex")
    .slice(0, 12);
  return `local:${slug}:${digest}`;
}

export async function readLocalIptvCheckout(
  sourceDir: string,
): Promise<LocalReadResult> {
  const streamsDir = path.join(sourceDir, "streams");
  const streamsStat = await stat(streamsDir).catch(() => null);
  if (!streamsStat?.isDirectory()) {
    throw new Error(`IPTV streams directory not found: ${streamsDir}`);
  }

  const files = (await readdir(streamsDir))
    .filter((file) => file.endsWith(".m3u"))
    .sort((a, b) => a.localeCompare(b, "en"));
  const entries: LocalPlaylistEntry[] = [];
  const warnings: string[] = [];

  for (const filename of files) {
    const relativeFile = path.posix.join("streams", filename);
    const lines = (await readFile(path.join(streamsDir, filename), "utf8"))
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/);
    let pending:
      | {
          upstreamChannelId: string | null;
          name: string;
          logo: string | null;
          line: number;
          referrer: string | null;
          userAgent: string | null;
        }
      | undefined;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (line.startsWith("#EXTINF:")) {
        const comma = line.indexOf(",");
        const metadata = comma >= 0 ? line.slice(0, comma) : line;
        const attributes = parseAttributes(metadata);
        pending = {
          upstreamChannelId: attributes["tvg-id"]?.trim() || null,
          name: comma >= 0 ? line.slice(comma + 1).trim() : "",
          logo: attributes["tvg-logo"]?.trim() || null,
          line: index + 1,
          referrer: null,
          userAgent: null,
        };
      } else if (pending && line.startsWith("#EXTVLCOPT:http-referrer=")) {
        pending.referrer = line.slice("#EXTVLCOPT:http-referrer=".length).trim() || null;
      } else if (pending && line.startsWith("#EXTVLCOPT:http-user-agent=")) {
        pending.userAgent = line.slice("#EXTVLCOPT:http-user-agent=".length).trim() || null;
      } else if (pending && line && !line.startsWith("#")) {
        entries.push({
          ...pending,
          country: countryFromFilename(filename),
          url: line,
          sourceFile: relativeFile,
          sourceLine: pending.line,
        });
        if (!pending.upstreamChannelId) {
          warnings.push(
            `${relativeFile}:${pending.line} has no upstream tvg-id; assigned a stable local ID`,
          );
        }
        pending = undefined;
      }
    }

    if (pending) {
      warnings.push(`${relativeFile}:${pending.line} has metadata but no stream URL`);
    }
  }

  return { entries, warnings };
}
