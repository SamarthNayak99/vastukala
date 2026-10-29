# Image study, life stories and heritage map

Implemented 29 October 2026. Local project remains at http://127.0.0.1:5173. No monuments added: 30 monuments, seven sites and 59 photographs.

## Photograph workspace

`/photographs` loads the approved catalogue photographs for independent two-pane study. Monument pages also open the viewer at the selected photograph. Zoom ranges from 100% to 600%; mouse wheel and buttons zoom, pointer dragging pans, reset restores fit, full-screen uses the browser Fullscreen API. Narrow screens stack the two panes. Original photographer/source/licence links remain visible. Escape closes the modal and focus returns to its trigger. Uses prepared 2400-pixel variants; no new photographs or artificial detail are generated.

## Life events

`/life-stories` selects a monument and shows sourced events in chronological order. Every monument detail also has a life-story section, and Across time links to Life stories. The original feature/building-date timeline retains its existing meaning.

Migration 003 adds building_events with a building FK, source FK, allowed event type, title, description, date bounds, precision and source locator. Construction, addition, alteration, restoration, use and recognition are supported independently. Invalid bounds and missing sources are rejected. Events survive normal building edits because they reference stable building/source IDs. Public routes exclude unpublished buildings. Authenticated event create/update/delete routes require CSRF; updates and deletes are scoped to the selected building.

Admin: open an existing building and use the separate life-event form above the normal editor. Life events save independently, which is stated in the interface. New buildings must first be saved. Sources can be created using the existing reference management form.

The initial research includes Belur inception (1117), Pattadakal Virupaksha commissioning (approximately 740), property-level World Heritage recognition, and separately dated conservation work at Belur (financial year 2023–24) and Papanatha (2022–23). Recognition is explicitly property-level, not a building alteration. Gaps remain explicit; unsupported additions/restorations are not invented. Conservation date ranges represent reporting years, not exact completion dates.

Sources:
- https://whc.unesco.org/en/list/1670/
- https://whc.unesco.org/en/list/239/
- https://whc.unesco.org/en/list/241/
- https://sansad.in/getFile/annex/269/AU1295_U71V44.pdf?source=pqars (Annexure I, items cited per event)

## Heritage map

`/map` uses Leaflet, OpenStreetMap tiles and marker clustering. It reuses the exact published-building filter API and query parameters for location, type, material, element and name. Catalogue and map links carry filters in both directions. The map supports zoom/pan, clustered record counts, site popups, two-monument comparison selection, and a Search this map area action. A linked record list offers an alternative to marker interaction.

All existing individual monument coordinates were null. Migration 004 therefore adds separate, sourced reference coordinates to sites rather than inserting invented building coordinates. Each of the 30 monuments is shown at its approximate site reference point. Popups and page copy explicitly explain this limitation. Dense sites share a marker; nearby sites cluster and separate with zoom. This map is for discovery, not walking directions. Individually surveyed building coordinates can later override the fallback. Sources include UNESCO property maps, Ministry of Culture and the linked Badami/Aihole reference pages. Basemap tiles require an internet connection; the catalogue and record list remain usable if tiles fail.

## Verification

Production build passed. All 21 integration tests passed, including source/date validation, authentication/CSRF, event CRUD, cross-building scoping, map data coverage and existing comparison/hotspot integrity tests. A logical backup and full restore matched all 17 backed-up tables, including building_events and seed_tasks. Browser checks verified map filters/counts, marker popup contents, paired photo selections and independent zoom. Responsive viewer panes stack at narrow widths.

Further research can enrich the life stories and replace site reference coordinates with verified individual monument coordinates without adding monuments.
