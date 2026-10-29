# Version 1 verification and demonstration

## Automated verification

The first release has 21 integration tests in `tests/integration.test.mjs`. Tests run against a uniquely named temporary PostgreSQL database, seeded from committed research; they do not mutate the user catalogue.

Coverage includes: fixed 30-monument collection, filters and alternate names, SQL intersections/differences, statistics without join inflation, foreign keys and date bounds, transactional rollback, login/CSRF/publication visibility, image-element scoping, cited hotspots and their preservation, undated timeline records, SQL calendar-date serialization, map coordinate coverage and sourced life-event CRUD/security.

The production frontend build passed. A logical backup/restore matched every row in all 17 backed-up tables. Browser verification covered map filter counts and popup contents, paired-photo selection and independent zoom, life-story chronology and citations, and the corrected detail-page action spacing. This does not represent exhaustive device, accessibility or browser compatibility testing.

## Suggested college demonstration

1. Open the catalogue: explain sites, types, materials, elements and junction tables.
2. Filter Badami + Cave temple + Sandstone + Carved pillar; then add a conflicting material to demonstrate all-selected semantics.
3. Search Lokeshwara to demonstrate alternate names.
4. Compare two monuments; open the references behind common and distinct features.
5. Open Anatomy; click a hotspot and follow the same element to another monument.
6. Open Across time; filter a feature and explain approximate building dates versus evidence of feature origin.
7. Open Photo study; choose two detail photographs, zoom independently, drag and reset.
8. Open Life stories for Chennakeshava Temple at Belur; distinguish inception, recognition and conservation reporting-year ranges.
9. Open the map; filter a site, inspect the approximate-location note and choose two records for comparison.
10. Log in privately as administrator; demonstrate the separate event editor and source requirement. Use a disposable local test record if demonstrating destructive actions.
11. Run the integration suite and explain foreign-key/check failures and transaction rollback using the SQL demonstration file.

## Scope to state accurately

30 monuments; seven sites; 59 approved photographs; 37 curated hotspots. The archive is selective. Missing attributes are unknown, not confirmed absent. Map coordinates are approximate site references. Life events have uneven research coverage. Online hosting is a later milestone.
