# Data pipeline

The pipeline is intentionally adapter-based. `local-iptv.ts` reads the upstream checkout's M3U files, `normalize.ts` translates those records into the application schema, and `validate.ts` checks the generated artifact independently.

`published-iptv-org.ts` consumes the official published JSON API without importing IPTV-org internal types. It downloads only the five datasets needed for this catalog:

- `channels.json` for names, countries, and categories
- `feeds.json` for feed IDs, languages, broadcast areas, timezones, and formats
- `logos.json` for deterministic logo selection
- `streams.json` solely for exact URL relationships and published stream fallback fields
- `guides.json` for feed-aware guide site IDs and sources

Playlist IDs have the form `channelId@feedId`. The channel portion joins `channels.json.id`; the pair joins feed-aware metadata. A missing playlist ID is joined only when its URL occurs exactly once in the published streams dataset. Ambiguous and unmatched records remain local. Raw snapshots are ignored under `data/cache/iptv-org`, and no ordinary development or build command downloads them.
