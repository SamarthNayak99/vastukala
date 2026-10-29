# Connected archive — 29 October 2026

This update implements the three requested exploration features using the existing **30 monuments, seven locations and 59 photographs**. It adds no monuments or architectural categories.

## 1. Why do these buildings look alike?

Open `/compare` and select any two different published monuments. A suggested Halebidu/Somanathapura pair provides a starting example.

The page now includes large paired photographs with credits, a brief explanation of the documented resemblance, shared materials, shared spatial features, architectural details and traditions, and differences accompanied by evidence from each record. Each shared attribute carries the notes and citations for both buildings. Layout narratives remain visible separately with their building-level references.

The backend uses parameterized PostgreSQL `INTERSECT` and `EXCEPT` operations on the material, style and element junction tables. The returned IDs are assembled with the existing building-specific notes and citation relationships. Spatial features are a curated grouping of existing elements such as halls, courtyards, passages, platforms and plan types; no new historical classification is inferred.

An attribute documented only on one record is labelled that way, rather than called absent from the other building. Shared spatial features do not establish identical floor plans. Date-range overlap is reported without implying direct influence.

## 2. Anatomy of a Monument

Open `/anatomy`, select a monument, then choose a photograph and a numbered marker. All 30 existing monuments have at least one annotated photograph; **37 reviewed markers cover 30 photographs**. Other views can remain unmarked rather than receive guessed labels.

A selected marker shows:

- The architectural element and its definition.
- The local building-element notes and an explanation of the visible component.
- Element-specific citations.
- The photograph, credit, licence and larger-image link.
- Other published buildings documenting the same element.
- A link to explore that element across time.

Markers and the corresponding labelled list are keyboard-operable buttons with selected states. Coordinates are percentages of the uncropped photograph, so the point stays aligned as the image resizes. Markers were checked on local overlays and representative full-size views. A marker on an exterior hall volume or entrance is described as an exterior view, not a view of a concealed floor plan.

### Database model

Migration `002_image_hotspots.sql` adds:

- A unique `(building_id, storage_key)` key on images.
- `hotspots`: identity key, building, asset key, element, label, horizontal/vertical percentages and note.
- Composite foreign keys from a hotspot to the same building's image and element occurrence.
- Coordinate bounds of 0–100, nonempty labels, and one point per element per photograph.
- `seed_tasks`, an infrastructure table recording one-time annotation curation runs.

The application additionally requires an element-specific citation for every saved hotspot. Public anatomy queries exclude archived/draft buildings and unapproved photographs, including related-building results.

`research/hotspots.mjs` records the reviewed initial coordinates. `scripts/seed-hotspots.mjs` applies versioned curation once, under a transaction lock. Later administrator edits and deletions survive startup. An upgrade from the first annotation batch only adds the later batch and does not recreate earlier deleted markers.

### Administrator editing

1. Log in and edit an existing building.
2. Open **Photographs**, then **Photograph anatomy** under a prepared image.
3. Add a marker for an element already associated with that building.
4. Select **Place marker**, then click the uncropped preview, or enter percentage coordinates.
5. Write a label and visible-detail note. Ensure the Evidence tab contains a citation targeting that element.
6. Save the building. Invalid coordinates, cross-building elements and uncited markers are rejected.

Normal building saves preserve annotations despite the existing workflow replacing image and relationship rows. The transaction captures prior markers and recreates valid links after the associations are saved. An explicit empty marker list removes those markers; omitting the field in an older client preserves existing compatible annotations. Removing an annotated element or its required citation must be reconciled in the editor before saving.

## 3. Compare Across Time

Open `/across-time`. Choose an existing architectural element and an inclusive CE year window.

The view provides a range axis, expandable building rows with date/feature references, hundred-year overlap bands, and a separate section for records without complete date bounds. The default collection currently has **28 dated records and two without assigned ranges**. Selecting Mandapa yields 13 dated records and two undated records.

The SQL retrieval checks interval overlap: a dated building matches when its start is at or before the window end and its end is at or after the window start. Element filtering uses the building-element junction table. Invalid ranges are rejected. Undated records are not assigned invented positions; they remain in the separate uncertainty section even when the year window changes.

Bars represent the stored building-record chronology, including approximate dates, broad phases and foundation/consecration context. They do **not** independently date each feature, identify the earliest invention, or establish influence. One broad range can count in several overlap bands, so band counts should not be summed as distinct buildings.

## 4. Visual changes

- Three linked editorial entry cards on the home page.
- New Anatomy and Across time navigation links and shared exploration tabs.
- A redesigned comparison page with paired portraits, an olive evidence summary, clearly grouped claims and separate difference panels.
- An image-led anatomy stage with numbered markers, thumbnails and a feature/evidence sidebar.
- A timeline with clay range bars, distinct year markers, an uncertainty legend and a separate undated section.
- Responsive grids, horizontally contained timeline overflow, visible focus styles and reduced-motion support for the new interactions.

The existing warm heritage palette, typography and photograph credits are retained. The changes are implemented in `client/src/Explore.jsx`, `explore.css` and `HotspotFields.jsx` and integrated with the existing catalogue/detail/admin interfaces.

## 5. Backup/date handling

The schema now has **15 domain tables**, plus `sessions`, `schema_migrations` and `seed_tasks` infrastructure. Logical backups include the 15 domain tables and the annotation seed state: 16 tables total. Sessions and migration bookkeeping are recreated separately; image files still need a separate backup.

PostgreSQL `DATE` values are now read as `YYYY-MM-DD` calendar strings. Earlier JSON serialization through JavaScript local-midnight `Date` objects could shift a date on restoration. Backup format `vastukala-logical-v2` records calendar-date encoding explicitly. The existing legacy test copy was repaired using the known original Asia/Kolkata date context before comparison; this did not modify the original database's source dates. Historical v1 backups containing timestamp-shaped DATE values require the original timezone context when restoring them.

## 6. Verification

The suite now has **19 passing integration tests**, including the prior catalogue, administration and integrity checks plus:

- Shared spatial features and per-building comparison citations.
- SQL-backed exclusive features and conservative difference wording.
- Anatomy coverage, image/element ownership, citations and related published buildings.
- Date overlap, feature filters, undated separation and invalid ranges.
- Invalid annotation coordinates, foreign elements and missing evidence.
- Preservation through normal edits and persistent explicit removal after reseeding.
- Public visibility for unapproved images and archived buildings.
- Calendar-date JSON round trips without timezone shifts.

The recovered original database was backed up before migration. All rows in its original 14 domain tables were compared with that snapshot after the feature update and remained unchanged. Only annotation data and curation bookkeeping were added. A subsequent backup/restore verified all rows in the 16 backed-up tables. The production frontend build passed.

Browser review covers marker switching and related records, comparison evidence, timeline filtering and expandable references, and representative responsive layouts. Local screenshots and private backup files are stored under `.local/` and are ignored by Git. These checks are not a claim of exhaustive accessibility or device certification.

## 7. Operational incident and resolution

The original local PostgreSQL process was already rejecting connections in recovery mode. Two clean shutdown attempts failed. A separate preview was prepared from the last verified backup while leaving the original data directory untouched. Its original 14 tables were verified against that backup after normalizing the legacy DATE representation.

Automatic review rejected immediate shutdown. After the user explicitly authorized restarting the original PostgreSQL instance, it was stopped, restarted with recovery logging, backed up and migrated. The original frontend/API ports then returned successful responses for the new features. The isolated preview was used only for development and verification; it was not silently substituted for the original database.

No online publication was performed. Normal local operation remains `npm run dev`, frontend port 5173, API port 3001 and PostgreSQL port 55432.
