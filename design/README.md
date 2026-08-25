# my·tv static design prototypes

These files are standalone, high-fidelity HTML/CSS prototypes for visual approval before the real Next.js UI is implemented. They do not import application code, query the IPTV catalog, require a server, or make network requests.

## Opening the prototypes

Open any HTML file directly in Chrome. From PowerShell, for example:

```powershell
start design\index.html
```

No install or build command is required.

| File | Screen |
|---|---|
| `index.html` | Desktop Home with opening stage, rails, countries and categories |
| `sports.html` | Sports destination, filters, five-column grid and pagination |
| `live.html` | Full catalog browsing and calm filter controls |
| `countries.html` | Country discovery plus a France page preview |
| `search.html` | Dedicated search results, loading concept and empty state |
| `watch.html` | Watch composition, source selector and player-state language |
| `mobile.html` | Dedicated 390px Home composition with bottom navigation |

The pages link to one another, so `index.html` is the natural starting point.

## Visual principles

- Near-black cinematic canvas rather than a dashboard surface
- Electric blue reserved for interaction and focus
- Red reserved for real live/playback semantics
- Large 16:9 logo-led channel surfaces
- Minimal badges and almost no visible borders
- Generous spacing, restrained radii and subtle depth
- Strong keyboard focus and TV-safe target sizes
- Responsive grids and touch-scrollable rails

All sample identities are local text, monograms and CSS marks. They are intentionally fictional and avoid copying broadcaster brands. Channel counts and metadata are representative of the current catalog, but the prototypes do not claim current programs, stream health, scores, popularity, or viewer counts.

## Responsive behavior

- `1440px+`: approximately five cards plus a partial sixth in Home rails; five-column catalog grids
- `1024–1439px`: four-card rails and four-column grids
- `768–1023px`: three-card rails and three-column grids
- `<768px`: two-column grids, fixed bottom navigation, horizontally swipeable rails
- `1800px+ / TV`: larger gutters, six-column grids, larger text and stronger focus treatment

`mobile.html` remains a framed 390px prototype on desktop and fits the viewport on smaller screens.

## Prototype interactions

The small shared `assets/app.js` provides only design-preview behavior:

- Rail arrow scrolling
- Left/Right keyboard movement within channel rails
- Filter chip selection and reset
- Source row selection
- Search clear buttons
- Sticky-header depth on scroll

All links and buttons are keyboard focusable. Reduced-motion preferences disable nonessential motion.

## Mapping to the future application

The shell, cards, rails, filters, country tiles, pagination, search results, watch layout, source rows and state messages can map directly to future React components. The static sample data must be replaced by the existing server-only catalog queries. The future player, favorites, history, EPG, and playlist features are intentionally absent.
