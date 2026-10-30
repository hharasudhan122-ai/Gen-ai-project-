# Google Photorealistic 3D removal — what changed and why

This fork intentionally never calls Google Maps Platform. Everything else from
upstream gods-eye-view is unchanged: live flights, military flights,
earthquakes, satellites, rocket launches, traffic, CCTV, radio, bikeshare,
live AIS vessels, military installations, annotations, sensor visual styles
(NVG/FLIR/noir/etc.), the scene director, voice control, and the HUD.

## Files touched

**`src/main.js`** — removed the hard `throw` on a missing
`GOOGLE_MAPS_API_KEY` and the `createGooglePhotorealistic3DTileset()` call.
`tileset` is now always `null`. This wasn't a workaround — `MapStackController`
already treats `googleTileset: null` as "photoreal unavailable" and defaults
`_activeId` to `'osm'` on its own (see `mapStackController.js` constructor).
The OSM stack needs zero keys: keyless global terrain (Re:Earth/Mapterhorn,
CC BY 4.0) + OpenStreetMap imagery. If you set `CESIUM_ION_TOKEN` (free,
no billing), the Bing Aerial/Labels stacks also become available as extra
choices in the map-stack chips.

**`src/mapStackChips.js`** — removed `'photoreal'` from
`PRESENTED_MAP_STACK_IDS` so the UI doesn't show a permanently-greyed-out
"Google 3D" chip. The chip system already had graceful unavailable-state
handling built in; this just avoids presenting a choice that can never work
in this build.

**`src/locations.js`** — `searchAndFlyTo()` (the location search bar) was
hard-wired to Google's Geocoding API specifically, a *separate* Google
service from the 3D Tiles that would have silently broken search entirely.
Added a genuine OpenStreetMap Nominatim fallback branch that runs whenever no
Google key is present, producing the same `{lat, lng, label, types, viewport}`
shape the rest of the function already expects — so all the downstream
framing/navigation-mode logic (city vs. landmark vs. natural-region framing)
keeps working unchanged. Nominatim's type/viewport data is coarser than
Google's Places-backed "near view" disambiguation pass, so very ambiguous
short queries may land on the single best global match rather than the one
nearest your current camera — the accepted trade-off for staying keyless.

## What's left touching Google (by design, not an oversight)

A few *optional* conveniences still call Google Maps Platform APIs
server-side, and every one of them already had a graceful no-key fallback
built into the original codebase (confirmed by reading the middleware in
`vite.config.js`) — none of them will crash or break anything without a key,
they just quietly return an empty result:

- `/api/google/nearby-places` — used to label nearby points for on-screen
  context. Returns `{places: []}` (503) with no key.
- `/api/google/text-search` — same pattern, same graceful empty fallback.
- CCTV Street View fallback thumbnail — only used when a camera feed itself
  is unavailable, as a last-resort placeholder image. No key = no
  placeholder, not a crash.

If you eventually want these too, they need `GOOGLE_MAPS_API_KEY` set — but
they're minor conveniences layered on live data that already works without
them, not core functionality.

## Everything else: same as upstream

Every other API key in `.env.example` (OpenAI voice, FIRMS wildfires,
TomTom traffic, AISStream vessels, OpenSky flights, Cesium ion) was already
optional with a documented keyless fallback in the original project — that
design didn't need to change for this fork. See `.env.example` and the
project's own `README.md` / `DATA_SOURCES.md` for the full key-by-key
breakdown (each one is marked free / free-with-signup / metered there).

## What I could not verify in this environment

I could not run `npm install && npm run dev` end-to-end here — this
sandbox's network proxy intermittently 403's unrelated npm packages
(confirmed on three different, unrelated dependencies across separate
attempts: `yauzl`, `web-worker`, `@mapbox/vector-tile` — a sandbox-specific
registry quirk, not a real problem with any of them). I syntax-checked every
edited file directly (`node --check`) and they all pass, and traced the
logic by reading the actual source rather than guessing. Run
`npm install && npm run dev` on your own machine as the first real
end-to-end test — that network restriction won't exist there.
