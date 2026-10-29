# Database design and normalization

The migrations in `database/migrations/` are the source of truth: `001_initial.sql` defines the base archive and `002_image_hotspots.sql` adds photograph annotations. The database has 15 domain tables plus session, migration and curation-seed bookkeeping tables.

| Table | Key and principal dependencies |
|---|---|
| sites | id -> name, slug, locality, district, state, overview; slug/name unique |
| building_types | id -> name, description; name unique |
| buildings | id -> site_id, type_id, name, slug, narratives, date fields, coordinates, status, timestamps; slug unique |
| building_aliases | id -> building_id, alias; (building_id, alias) unique |
| styles | id -> name, description; name unique |
| materials | id -> name, description; name unique |
| elements | id -> name, description, function; name unique |
| building_styles | id -> building_id, style_id, notes; pair unique |
| building_materials | id -> building_id, material_id, usage_notes; pair unique |
| building_elements | id -> building_id, element_id, description, location_notes; pair unique |
| sources | id -> title, author_or_publisher, url, publication_year, accessed_on; URL unique |
| citations | id -> building_id, source_id, claim_topic, locator, note, optional assertion target |
| images | id -> building_id, optional building_element_id, file paths, attribution, licence, caption, dimensions, approval, order, cover flag |
| admins | id -> email, password_hash; email unique |
| hotspots | id -> building_id, storage_key, element_id, label, x, y, note; (building_id, storage_key, element_id) unique |
| seed_tasks | name -> applied_at; one-time curation infrastructure |
| sessions | sid -> sess, expire; application infrastructure |
| schema_migrations | name -> applied_at; migration infrastructure |

All IDs are generated integer identity keys except session and migration identifiers. Narrative and descriptive fields are text, dates use DATE, record timestamps use TIMESTAMPTZ, image byte size uses BIGINT, flags use BOOLEAN, and coordinates use NUMERIC. Nullable historical fields represent unknown facts.

`seed_tasks` also uses a text name key. SQL DATE values are serialized as calendar strings, not JavaScript timestamps, to avoid timezone changes during JSON backup/restore. Hotspot coordinates are percentages constrained to 0–100. Composite foreign keys reference the same building's `(building_id, storage_key)` image and `(building_id, element_id)` occurrence. Annotations therefore survive image/association row replacement using stable building/asset/category keys; the save transaction preserves or explicitly replaces them. The application requires an element-specific citation for a marker.

## Normalization rationale

1NF: every relational attribute contains one value. Multiple materials, elements, sources, images, or aliases are separate rows. The session table's JSON is infrastructure owned by the session library, not an alternative store for architecture data.

2NF: relationship-specific notes depend on the complete building/category pair. For example, material usage belongs to `(building_id, material_id)`, not to a material globally.

3NF: site details, category definitions, and source publication details are kept outside building rows. Building rows reference their site and type; citations reference sources rather than repeat publication metadata. Descriptions on building-element links explain a local occurrence rather than redefine the general element.

The V1 `sites` table treats locality/district/state as descriptive labels and does not model an administrative-region hierarchy. If administrative regions become first-class searchable entities, split them into location tables and revise the dependency analysis. Avoid claiming that adding identity keys alone proves 3NF.

## Cardinalities and integrity

One site and one primary type classify each building. Styles/materials/elements are many-to-many. Sources can support many buildings, and a building can have many citations. A citation can target at most one style/material/element assertion or remain building-wide. Composite foreign keys prevent cross-building citation targets and image-element links.

The database enforces required references, unique slugs, unique category pairs, valid date order, coordinate ranges, positive image sizes, allowed statuses, and at most one cover photograph. The application validates publication prerequisites and confirms prepared images exist. Direct SQL writes can bypass the application-level publishing check; document this boundary during the viva.

## Indexes and query behaviour

Indexes cover common filter columns, reverse taxonomy links, source/citation relationships, sessions, and media lookup. The catalogue uses parameterized SQL and `EXISTS`/`NOT EXISTS` to express AND across filter groups and all-selected material/element matching. With 30 rows, sequential scans are often cheaper; use EXPLAIN ANALYZE to discuss this honestly.

## Transaction boundary

Saving a building starts a transaction, updates the building, replaces its aliases and associations, reconstructs citations and media links, and commits only after all writes succeed. Any failure rolls back the complete change. Association IDs are internal and may change on edits; stable public building slugs identify routes. Renaming a slug currently changes its URL without creating a redirect.

## Version 1 additions (migrations 003–004)

`building_events` records one building, one source, an event kind, title, description, start/end CE years, precision and source locator. Building deletion cascades to events; deleting an in-use source is restricted. Checks enforce years 1–2100 and start <= end. A composite chronology index supports per-building ordering. The application validates text limits and scopes event update/delete to the chosen building.

`sites.map_latitude`, `map_longitude` and `map_source_url` hold approximate discovery reference points; latitude/longitude range checks apply. Existing building latitude/longitude columns remain distinct and unpopulated until researched.

The final domain diagram contains 15 content entities; `admins`, `sessions`, `schema_migrations` and `seed_tasks` serve authentication/runtime/migration/curation roles. The logical backup saves 17 tables (content plus admin accounts and seed tasks; sessions and migration history are reconstructed rather than copied).
