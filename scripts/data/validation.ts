import type { Catalog } from "./schema.js";

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const SUPPORTED_PROTOCOLS = new Set([
  "http",
  "https",
  "rtmp",
  "rtsp",
  "mmsh",
  "srt",
]);

export function validateCatalog(catalog: Catalog): ValidationResult {
  const issues: ValidationIssue[] = [];
  const channelIds = new Set<string>();
  const streamUrls = new Map<string, string>();

  for (const channel of catalog.channels) {
    if (!channel.id.trim()) {
      issues.push({ severity: "error", code: "missing-channel-id", message: "A channel has no ID" });
    } else if (channelIds.has(channel.id)) {
      issues.push({ severity: "error", code: "duplicate-channel-id", message: `Duplicate channel ID: ${channel.id}` });
    }
    channelIds.add(channel.id);

    if (!channel.name.trim()) {
      issues.push({ severity: "error", code: "empty-channel-name", message: `Channel ${channel.id || "<missing>"} has an empty name` });
    }
    if (channel.streams.length === 0) {
      issues.push({ severity: "error", code: "empty-stream-array", message: `Channel ${channel.id} has no streams` });
    }
    if (
      channel.provenance.authoritativeMetadata &&
      channel.provenance.authoritativeMetadata.channelId !== channel.id
    ) {
      issues.push({ severity: "error", code: "metadata-id-mismatch", message: `Authoritative metadata ID does not match channel ${channel.id}` });
    }
    if (channel.country !== null && !/^[A-Z]{2}$/.test(channel.country)) {
      issues.push({ severity: "warning", code: "invalid-country-code", message: `Channel ${channel.id} has malformed country '${channel.country}'` });
    }
    if (channel.categories.some((category) => !category.trim())) {
      issues.push({ severity: "error", code: "malformed-category", message: `Channel ${channel.id} has an empty category` });
    }
    if (channel.languages.some((language) => !/^[a-z]{3}$/.test(language))) {
      issues.push({ severity: "warning", code: "malformed-language", message: `Channel ${channel.id} has a malformed language code` });
    }
    if (channel.logo) {
      try {
        const protocol = new URL(channel.logo).protocol;
        if (protocol !== "http:" && protocol !== "https:") throw new Error();
      } catch {
        issues.push({ severity: "error", code: "invalid-logo-url", message: `Channel ${channel.id} has an invalid logo URL` });
      }
    }
    const feedIds = new Set<string>();
    for (const feed of channel.feeds) {
      if (!feed.id.trim() || feedIds.has(feed.id)) {
        issues.push({ severity: "error", code: "duplicate-or-empty-feed-id", message: `Channel ${channel.id} has a duplicate or empty feed ID '${feed.id}'` });
      }
      feedIds.add(feed.id);
    }
    for (const guide of channel.guides) {
      if (!guide.site.trim() || !guide.siteId.trim()) {
        issues.push({ severity: "error", code: "malformed-guide", message: `Channel ${channel.id} has a guide missing its site or site ID` });
      }
      for (const source of guide.sources) {
        try {
          const protocol = new URL(source.url).protocol;
          if (protocol !== "http:" && protocol !== "https:") throw new Error();
        } catch {
          issues.push({ severity: "error", code: "invalid-guide-url", message: `Channel ${channel.id} has an invalid guide source URL` });
        }
      }
    }

    for (const stream of channel.streams) {
      const firstChannel = streamUrls.get(stream.url);
      if (firstChannel) {
        issues.push({ severity: "warning", code: "duplicate-stream-url", message: `Stream URL is shared by ${firstChannel} and ${channel.id}: ${stream.url}` });
      } else {
        streamUrls.set(stream.url, channel.id);
      }

      try {
        new URL(stream.url);
      } catch {
        issues.push({ severity: "error", code: "invalid-stream-url", message: `Invalid URL in ${channel.id}: ${stream.url}` });
      }
      if (!SUPPORTED_PROTOCOLS.has(stream.protocol)) {
        issues.push({ severity: "error", code: "unsupported-protocol", message: `Unsupported protocol '${stream.protocol || "<missing>"}' in ${channel.id}: ${stream.url}` });
      }
    }
  }

  return {
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
  };
}

export function printValidation(result: ValidationResult): void {
  const printGroup = (label: string, issues: ValidationIssue[]) => {
    console.log(`${label}: ${issues.length}`);
    for (const issue of issues.slice(0, 20)) console.log(`  [${issue.code}] ${issue.message}`);
    if (issues.length > 20) console.log(`  ... ${issues.length - 20} more`);
  };
  printGroup("Fatal errors", result.errors);
  printGroup("Warnings", result.warnings);
}
