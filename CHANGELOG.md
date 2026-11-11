# Changelog

## India catalogue expansion

- Add 40 researched monuments for a total of 100 at 73 sites across 21 states and union territories.
- Add openly licensed photographs, cited anatomy hotspots, mapped locations, and historical events for the new records.
- Feature the Lotus Temple, Ramappa Temple, Mysore Palace, and the Qutb Shahi Tombs in the homepage slideshow.
- Extend the chronology bounds to include Dholavira's occupation range. See [the expansion inventory](docs/india-100.md).

## DBMS Lab — local addition, 1 November 2026

- Optional corner entry and lazily loaded educational route with 13 lessons and four guided challenges.
- Live public-record SQL templates, separate bound parameters, result tables and execution plans.
- Interactive actual-schema explorer for 16 content tables, keys, constraints, indexes and public samples.
- Fictional normalization walkthrough; isolated PostgreSQL temporary-table constraint errors, transaction traces, COMMIT/ROLLBACK demonstrations and synthetic indexing measurements.
- No permanent schema/data changes; private infrastructure excluded. Full suite: 29 tests passing.

## 1.1.0 — local expansion, 1 November 2026

- Add an eight-monument homepage slideshow with image crossfades, matching credits, manual controls, pause/play and reduced-motion support.

- Preserve the original 30 Karnataka monuments and add 30 researched monuments across India: 60 records across 17 states/UTs and 36 sites.
- Add the state/UT dimension and synchronized catalogue/map filtering; use a national map with all records available in selectors.
- Add 33 reviewed licensed photographs, 30 cited anatomy hotspots and 35 sourced life events.
- Extend timeline and event validation to documented BCE dates, rejecting year zero.
- Update national branding, statistics, ER diagram, synopsis, SQL examples and research documentation.
- Verification: 24 integration tests pass; production build passes; original rows preserved exactly; 18-table backup restore verified.
- This milestone is local and has not been pushed or deployed.

## 1.0.0 — 29 October 2026

First private repository version of Vastukala, a local PERN college DBMS project.

### Included

- Fixed catalogue of 30 Karnataka monuments across seven sites, with metadata for 59 licensed photographs.
- Combined SQL filters, alternate-name search, publication controls and statistical summaries.
- Cited two-building comparison using intersections and differences.
- Photograph anatomy with 37 curated hotspots and linked element evidence.
- Building-date timeline with uncertain ranges and separate undated records.
- High-resolution photograph workspace with zoom, pan, full-screen and two-pane study.
- Sourced life events with separate dates and authenticated administrator CRUD.
- Clustered Karnataka map, shared catalogue filters, area search and comparison selection.
- Relational migrations, repeatable seeds, logical backups and integration tests.
- Compact monument-page action row correcting excessive space above the photograph.

### Verification

21 integration tests passed; frontend production build passed; 17-table logical backup restore matched saved rows. Browser checks covered representative catalogue/map/viewer/life-story interactions.

### Known limitations

- Runs locally; hosting and production operations are future work.
- Map uses approximate site reference locations; individual buildings are not surveyed.
- Life events are researched selectively; not every monument has a full event history.
- First checkout requires downloading photographs; originals and generated image files are not stored in Git.
- Administration manages prepared image metadata, not arbitrary image uploads.
- No end-to-end browser automation suite or claim of a complete accessibility audit.
- Vite reports a bundle-size advisory; lazy-loading map/viewer code is a future performance improvement.
