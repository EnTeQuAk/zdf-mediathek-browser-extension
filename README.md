# ZDF Klassik

Firefox extension that restores content discovery features removed in ZDF's March 2025 Mediathek redesign.

Injects chronological content listings, pre-release ("Vorab") sections, brand filtering, and sort options into ZDF category pages using their public REST API.

## Supported pages

`/dokus`, `/dokumentation`, `/wissen`, `/gesellschaft`, `/kultur`, `/geschichte`

## Features

- **Neue Inhalte**: chronological listing of recently published content per category
- **Vorab verfügbar**: pre-release content available before official broadcast
- **Serien & Reihen**: series and collections (on pages with enough content)
- **Neu in der Mediathek**: cross-category newest content (on /dokus)
- **Brand pills**: filter by brand (Terra X, ZDFinfo Doku, 37 Grad, etc.)
- **Sort toggle**: switch between newest and most-viewed
- Lazy-loaded secondary sections via IntersectionObserver
- SPA navigation detection (works across client-side page transitions)
- Retry with exponential backoff on API errors, automatic token re-extraction

## Development

```bash
npm install
npm run dev          # esbuild watch + web-ext with auto-reload
npm test             # vitest
npm run lint         # eslint
npm run format       # prettier
```

## Build

```bash
npm run build        # production bundle → dist/
npm run package      # build + web-ext xpi → web-ext-artifacts/
```

## Install from source

Load `dist/` as a temporary extension via `about:debugging` in Firefox, or install the `.xpi` from `web-ext-artifacts/`.

## Architecture

```
src/
  main.js        entry point, section orchestration, SPA wiring
  config.js      page registry, section definitions, constants
  api.js         token extraction, fetch with retry, response parsing
  sections.js    section DOM creation, skeleton loading, card rendering
  cards.js       individual card elements with badges
  dom.js         grid container detection, injection
  filters.js     history API patching, filter change observation
  pills.js       brand filter pill bar
  format.js      date formatting, duration, availability helpers
```

esbuild bundles these ESM modules into a single IIFE content script targeting Firefox 115+.
