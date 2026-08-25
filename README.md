# my-tv

`my-tv` is a pnpm workspace containing a Next.js web application and a local, typed IPTV catalog pipeline. This foundation does not include a player or the final TV interface.

## Architecture

- `apps/web` — Next.js 16 App Router application.
- `scripts/data` — source adapters, application-owned schema, normalization, generation, and validation.
- `data/generated` — deterministic catalog content plus a generation manifest.
- `data/fixtures` — reserved for small checked-in test inputs.
- `docs` — design notes for the data boundary.

The web app reads `data/generated/catalog.json` and `manifest.json` on the server through a typed loader. It does not read the upstream repository directly.

## Data flow

1. The local adapter reads `streams/*.m3u` from `IPTV_SOURCE_DIR` without modifying that checkout.
2. The explicit published mode downloads only `channels.json`, `feeds.json`, `logos.json`, `streams.json`, and `guides.json` from the IPTV-org API into ignored `data/cache/iptv-org`.
3. Normalization joins playlist `channelId@feedId` values to authoritative channel/feed records. Missing playlist IDs may be recovered only by an unambiguous exact stream-URL match; channel names are never fuzzy-matched.
4. Normalization maps records into the application-owned `Catalog` schema and sorts channels, feeds, guides, and streams for stable output. Local values remain as deterministic fallbacks when published metadata is absent.
5. Validation reports fatal errors separately from warnings. Duplicate stream URLs are retained and reported; records are never silently removed.
6. `catalog.json` and `manifest.json` are written only when there are no fatal validation errors.
7. The Next.js server-side loader exposes the generated data to the app.

## Setup and commands

Install workspace dependencies from this directory:

```sh
pnpm install
```

The default source path is already `../iptv-mb`. To override it locally, copy `.env.example` to `.env` and edit `IPTV_SOURCE_DIR`. Do not commit `.env`.

```sh
pnpm data:update
pnpm data:update:published
pnpm data:validate
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm data:update` is local-only and performs no network requests. `pnpm data:update:published` explicitly refreshes the ignored API cache and generates the enriched catalog. `pnpm dev` starts `apps/web` and never downloads IPTV data.

## Local-only and production requirements

The stream source remains a local sibling IPTV checkout, while enrichment uses explicit published API snapshots. The manifest records the local Git commit plus the API fetch time, ETags, and Last-Modified headers. Production builds should consume an already generated catalog; a separate data job should refresh, validate, and publish or check in that artifact before the web build.

## Current limitations

Published coverage is not complete. Channels without a current authoritative relationship keep local names/country inference, any local logo, and stable `local:` IDs where necessary. Published channel data no longer carries languages directly, so channel languages are the deterministic union of its authoritative feed languages. IPTV-org has a broad `sports` category but no authoritative football-specific category; football counts must not be presented without a clearly labeled heuristic.

No remote fetch, upstream generator, player, EPG, playlists, favorites, history, or final TV UI is included in this step.
