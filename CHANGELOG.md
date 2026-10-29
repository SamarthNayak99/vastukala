# Changelog

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
