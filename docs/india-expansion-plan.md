# India expansion — implementation plan (31 October 2026)

Keep all 30 existing Karnataka records and their identifiers, edits, images and hotspots. Add exactly 30 curated historic monuments across 16 additional states/UTs. This is a representative national collection, not exhaustive coverage of Indian architecture.

1. Research: official UNESCO, ASI, government tourism/district and monument-management sources. Record dates and uncertainty, original summaries, layouts, styles, materials where documented and element-specific evidence.
2. Media: select reusable Commons and Flickr photographs, retain full attribution/licence metadata, download high-resolution originals, prepare existing responsive variants and visually review the actual images before approval.
3. Database: add a normalized state/UT dimension; preserve site/building keys. Add idempotent India imports and seed curated source-linked dates, events and image annotations without overwriting earlier records.
4. API/UI: state/UT filter with synchronized catalogue and India map, correct state labels everywhere, national branding, complete map/selector coverage beyond the old 48-record API page cap. Preserve Karnataka as a first-class filter.
5. Chronology: support documented BCE dates honestly, rather than dropping Sanchi from temporal views or relabelling BCE as CE.
6. Verify: original-record preservation, 60 unique monuments, all state assignments, public visibility, attribution, referenced hotspots, combined filters, national comparison, state map coverage, API validation, backup restore and production build. Update documentation with limitations and sources.

No GitHub push or online deployment is part of this change unless requested.

## Completion — 1 November 2026

All six steps are complete locally. The database contains 60 monuments, 36 sites, 17 represented states/UTs, 92 photographs, 67 hotspots and 57 sourced life events. All 24 isolated integration tests and the production build pass. Original rows across the 17 earlier tables match the pre-expansion snapshot exactly. An 18-table logical backup was restored and compared successfully.
