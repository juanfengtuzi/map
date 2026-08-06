# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page travel map (中国地图) built with React 18 + TypeScript + Vite. It records trips and locations for a couple, displayed on a Gaode (高德) tile map via Leaflet. Visited provinces light up by trip color, each trip has a dashed route line, and clicking a timeline pill opens a fullscreen story album. **There is no backend server** — all data lives in this Git repo's `data/travels.json`, written via the GitHub Contents API. Deployed to GitHub Pages.

The UI is built entirely with the `animal-island-ui` component library (Animal-Crossing style). Before touching any UI, run the `animal-island-ui-style` skill and consult `AI_USAGE.md` (at repo root; also shipped in `node_modules/animal-island-ui/`). Hard rules: import `'animal-island-ui/style'` once in `src/main.tsx`, never invent props, `Modal.title` is plain text (not the `<Title>` component), use only the 13-color NookPhone palette for `Card`/`Tag`/`Title`.

## Commands

```bash
npm run dev       # Vite dev server → http://localhost:5173/map/
npm run build     # tsc --noEmit && vite build → dist/
npm run preview   # preview the production build
```

There are no tests. `npm run build` is the verification gate (it type-checks).

## Data Flow & Storage (read this before touching data logic)

The data-sync layer went through a long debugging saga; its current invariants are deliberate and load-bearing. Full postmortem: `docs/CRUD-同步问题复盘.md`.

**Data model** (`src/types.ts`): `TravelsData { trips: Trip[] }`, where `Trip { id, name, date, color, locations: Location[] }` and `Location { id, city, lat, lng, date, description, tags, photo }`.

**Two separate channels — they must never be conflated:**

- **Read** (`useGitHubApi.fetchData`): **always** via the GitHub Contents API (`GITHUB_API_URL` in `src/constants.ts`) — authenticated when a token exists, unauthenticated public-API otherwise (repo is public). `readContentsApi()` decodes base64 with `TextDecoder` (UTF-8 safe; `atob` alone corrupts Chinese text).
- **Write** (`useGitHubApi.saveData`): GET current `sha` then PUT with `sha` + base64 content + branch `main`. Retries on 409.

**Critical invariants:**

1. **Never read via `GITHUB_RAW_URL` / `raw.githubusercontent.com`.** It is CDN-cached for ~5 minutes (`Cache-Control: max-age=300`); after a PUT it silently returns pre-save data with HTTP 200 (no error). `?t=` query strings and `cache:'no-store'` do NOT bypass the CDN edge (cache key is the path). This was the root cause of "deletion reverts on refresh". The raw URL constant still exists only for documentation/reference.
2. **`localStorage['cached_trips']` is an offline fallback, never a source of truth.** Only write it from a fresh Contents-API read or from a user edit; only read it when the network read *throws*. A stale-but-200 CDN read must never overwrite it.
3. **Writes are batched on logout, not per-operation.** Edits (`addLocation`, `deleteLocation`, `updateLocation`, `addTripWithLocation` in `useTravelsData`) call `updateLocalTrips()` which updates React state + `tripsRef` + localStorage immediately (zero latency). The whole file is PUT once via `syncToGitHub()` when the user clicks "保存并退出" (see `handleLogout` in `src/App.tsx`). Do not revert to per-operation saves — that reintroduced race conditions.

**CRUD functions** operate on `tripsRef.current` (a `useRef` mirror), never the closure `trips`, to avoid stale-closure overwrites on rapid operations. `deleteLocation` also drops trips whose `locations` becomes empty. `updateLocation` supports moving a location between trips via an optional `newTripId`.

## Map Layer

- `MapView.tsx`: Leaflet `MapContainer` with Gaode tiles (`GAODE_TILE_URL`, subdomains 1–4). `FitBounds` runs once on load (no animation). `FlyToTrip` animates to a trip's centroid when a timeline pill is clicked.
- `ProvinceLayer.tsx` + `useProvinces.ts`: the China province GeoJSON is bundled (`src/assets/china-provinces.json`, Aliyun DataV `100000_full`, 34 provinces + 九段线, GCJ-02) so the layer always renders with no runtime fetch. Build the `L.geoJSON` layer once (custom pane `provinces`); only restyle when the `visitedMap` changes. `computeVisitedProvinces` (`utils/geo.ts`) derives visited adcode → trip color from trips.
- `TripPolylines.tsx`: dashed route line per trip connecting its locations, colored by trip.
- `LocationMarkers.tsx`: pins use `L.icon` (image-based) NOT `L.divIcon` — the divIcon variant visibly drifts during `flyTo` animations. Colors come from a precomputed `locationId → color` map. `Tooltip` shows city/date/description/photo.
- `Timeline.tsx`: bottom horizontal scroll of `<Tag>` pills (one per trip), colored by trip. Clicking a pill flies to the trip AND opens `TripAlbum`.
- `TripAlbum.tsx`: fullscreen story album for a trip — location carousel with photo/description/tags + progress bar; closes via ✕ or `Esc` (arrow keys navigate).
- `useIsMobile.ts` (breakpoint 768): mobile pass — compact header, FAB pinned bottom-right (top-right on desktop), reduced bottom chrome.

## Deployment

- `.github/workflows/deploy.yml` → builds and deploys `dist/` to GitHub Pages (Actions-based deploy, not branch-based).
- `vite.config.ts` sets `base: '/map/'` — must match the repo name (`juanfengtuzi/map`).
- `GITHUB_API_URL` / `GITHUB_RAW_URL` are hardcoded to `juanfengtuzi/map` in `src/constants.ts`; they'd need updating if the repo is renamed/forked.

## Network note

Pushing to GitHub from this machine may require a local proxy (`HTTP_PROXY`/`HTTPS_PROXY`). If `git push` fails with connection errors, push with the proxy env vars or ask the user which proxy port is active.
