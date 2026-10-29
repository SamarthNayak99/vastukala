# Vastukala — Version 1 Plan

Date: 27 October 2026
Status: 30-building local collection implemented and verified. See docs/progress.md for current milestone status.

Scope freeze (28 October 2026): retain the current 30 monuments across seven locations. Further work focuses on reliability, database integrity, and the existing website; no additional monuments or architectural-feature categories are planned.

The completed phase history, current limitations and proposed major improvements are documented in [Implementation history and roadmap](docs/project-history-and-roadmap.md).

Authorized extension, 29 October 2026: implement cited comparison explanations, photograph anatomy and feature timelines within the fixed monument collection. See [Connected archive](docs/connected-archive.md) for the delivered features and validation. This does not expand the monument list or architectural vocabulary.

## 1. Project definition

Vastukala is a photographic, searchable architecture archive of Karnataka's historic monuments. Visitors explore individual buildings, understand their materials and architectural elements, compare two buildings, and view statistics generated from a PostgreSQL database. One administrator maintains the records.

The historical scope includes ancient and medieval architecture, including the later Vijayanagara period represented at Hampi. The first release provides detailed coverage of a curated selection, not a claim to document every monument in Karnataka.

## 2. Confirmed decisions

- Geography: Karnataka, prioritizing Hampi, Belur, Pattadakal, Badami, and Aihole; extend to Halebidu and Somanathapura.
- Product: responsive website with catalogue, photographs, detailed records, combined filters, two-building comparison, statistics, and admin forms.
- Access: visitors browse without accounts; one authenticated administrator manages content.
- Stack: PostgreSQL, Express, React, and Node.js (PERN, the PostgreSQL counterpart of MERN). PostgreSQL is the primary database.
- Delivery: get a complete local version working, iterate, then publish online in a later phase.
- Appearance: warm heritage colours combined with the clarity and restraint of a museum archive.
- Media: real photographs, high-resolution originals, architectural close-ups where available, and visible credits.
- College deliverables: synopsis, ER diagram, relational schema, normalization explanation, and demonstrable SQL queries.

Deadline, team details, and the college's synopsis format remain unspecified. Use milestone-based planning and an editable Markdown synopsis until a submission template is provided.

## 3. Dataset scope and record boundaries

Target approximately 30 individually documented monuments, introduced through a five-record pilot. A place such as Hampi is a site/heritage cluster; Vitthala Temple is a building record within it. Do not count the cluster as another building. Cave temples and surviving historic structures can be building records even when they are not enclosed freestanding buildings.

Implemented allocation (five pilot records plus 25 approved additions):

| Cluster | Target | Candidate records |
|---|---:|---|
| Hampi | 8 | Virupaksha Temple, Vitthala Temple, Achyutaraya Temple, Krishna Temple, Hazara Rama Temple, Lotus Mahal, Elephant Stables, Queen's Bath |
| Pattadakal | 7 | Virupaksha, Mallikarjuna, Sangameshvara, Papanatha, Galaganatha, Kadasiddheshvara, Jambulinga temples |
| Badami | 6 | Cave temples 1–4 as distinct records, Bhutanatha Temple, Malegitti Shivalaya |
| Aihole | 6 | Durga Temple, Lad Khan Temple, Meguti Jain Temple, Ravana Phadi Cave, Hucchimalli Temple, Huchappayya Matha |
| Belur | 1 | Chennakeshava Temple |
| Halebidu | 1 | Hoysaleswara Temple |
| Somanathapura | 1 | Keshava Temple |

This allocation is implemented in the combined research dataset. Spelling variants are aliases and precise record boundaries are documented in research/expansion-notes.md. In particular, Virupaksha Temple at Hampi and Virupaksha Temple at Pattadakal must have separate IDs and slugs.

The current monument selection is final for this version.

## 4. Search behaviour and demonstration scenarios

The earlier residential/timber/courtyard example becomes a general combined-filter capability. The Karnataka pilot will use combinations supported by its actual records rather than invent residential examples.

Proposed demonstrations, contingent on documented seed facts:

1. Select Pattadakal, temple, sandstone, and mandapa; return only buildings meeting every selected criterion.
2. Select Badami and cave temple; explore distinct cave records.
3. Select an architectural element such as a pillared hall; find buildings across different clusters.
4. Compare Chennakeshava Temple at Belur with Virupaksha Temple at Pattadakal, showing sourced similarities and differences.
5. Compare two identically named buildings without confusing their locations.

Filters: heritage cluster/location (labelled clearly as region/site), building type, material, and architectural element. Optional secondary filters: style and approximate period. Keyword search covers canonical names and aliases.

Rules: AND between filter groups; OR between selected locations/types; require all selected materials and all selected elements. Explain multi-select behaviour beside the controls. Empty selection means no restriction. Unknown attributes do not match a positive filter. Show a helpful empty state, active filter chips, result count, reset control, pagination, and shareable query parameters. This is structured filtering; natural-language search is deferred.

## 5. Screens

| Screen | Required content |
|---|---|
| Home | Large credited heritage photograph, project introduction, entry points into the main clusters |
| Catalogue | Responsive image cards, name/location/type, filters, sorting, pagination, compare selection |
| Building detail | Hero and gallery, location, approximate period, history, styles, materials and uses, elements and functions, source references, related buildings |
| Compare | Exactly two buildings; photos, locations, types, dates, styles, materials, elements, shared features, differences, and unknown values |
| Statistics | Published building count; counts by cluster/type; material and element frequency; dataset coverage note |
| Admin login | Login/logout, validation and clear errors |
| Admin catalogue/editor | Add/edit, draft/publish/archive, relationship selection, source notes, photo metadata and order, preview |
| About and credits | Methodology, scope, terminology, bibliography, photograph attribution |

Detailed records should contain an overview, historical context, layout description, materials and construction notes, noteworthy elements, and citations. Each section can say information is not yet documented rather than fabricate completeness.

## 6. Visual and image requirements

- Palette: sandstone/off-white backgrounds, deep brown text, muted terracotta accents, restrained brass details.
- Typography: readable serif headings and clear sans-serif body text; generous spacing and museum-style captions.
- Prioritize photography and architectural detail; preserve uncropped views in the gallery.
- Keyboard-accessible controls, descriptive alt text, adequate contrast, responsive layouts, and a usable mobile comparison view.
- Aim for 3–5 photographs per building: exterior, alternate/context view, and 1–3 element close-ups, where available. Publication minimum: one approved photograph; disclose gallery gaps.
- Prefer originals at least 3000 pixels on the long edge; hero candidates ideally at least 2400 pixels wide. Check actual sharpness, subject identity, exposure, and composition at useful display sizes.
- Multi-megabyte originals are welcome; file size is not a quality threshold. Preserve original dimensions, byte size, source page, author, and licence metadata.
- Generate responsive display copies (roughly 480/960/1600/2400 pixels as appropriate, never upscale), lazy-load galleries, and offer larger detail views. Originals must not all download on page load.
- Use real documentary images. Do not substitute generated architecture or invented visual details.
- Store paths/URLs and metadata in PostgreSQL; store image files on disk locally, with a later object-storage migration path.

## 7. Research and sourcing workflow

Use the starter references and media collections in [research/resources.md](research/resources.md).

1. Research one pilot building from each of the five requested clusters.
2. Record canonical name, aliases, site, building type, approximate construction range, history, and architecture notes.
3. Use UNESCO, ASI publications, government sources, and scholarly/institutional references. Tourism pages help discovery but should not settle disputed specialist claims alone.
4. Record the source and page/section for material, element, date, and style assertions. Seek a second independent source for uncertain or conflicting claims; record disagreements explicitly.
5. Keep dynasty/patronage in sourced historical notes for V1; do not treat dynasty and architectural style as interchangeable.
6. Find photographs through Wikimedia Commons monument categories and other explicitly reusable collections. Check the individual file page, author, licence/version, dimensions, and depicted monument.
7. Preserve credit and licence links and note cropping or other modifications. A government or UNESCO reference page does not automatically license its photographs for reuse.
8. Review the photograph visually and match it to its exact building and optional element. Category membership alone is insufficient identification.
9. Prepare structured staging JSON plus a media manifest; validate and import into PostgreSQL transactionally.
10. Expand from the pilot to the full shortlist only after the schema, filters, and photo workflow work correctly.

The source register is implemented in research/pilot.json and research/expansion.mjs: 30 sourced building records across seven locations. All 59 photographs have been downloaded, credited, visually reviewed, and prepared for local display. See research/media-manifest.json, research/expansion-notes.md, and docs/progress.md for coverage and remaining research gaps.

## 8. Database design

See [docs/er-diagram.md](docs/er-diagram.md) for the initial relational ER diagram.

| Table | Main fields and purpose |
|---|---|
| sites | id, name, slug, locality, district, state, overview; named heritage clusters |
| building_types | id, name, description |
| buildings | id, site_id, type_id, name, slug, summary, history, layout_notes, year_from, year_to, date_label, date_precision, latitude, longitude, status, timestamps |
| building_aliases | id, building_id, alias; spelling and alternate names |
| styles | id, name, description |
| materials | id, name, description |
| elements | id, name, description, function |
| building_styles | id, building_id, style_id, notes |
| building_materials | id, building_id, material_id, usage_notes |
| building_elements | id, building_id, element_id, description, location_notes |
| sources | id, title, author_or_publisher, url, publication_year, accessed_on |
| citations | id, building_id, source_id, claim_topic, locator, note, optional building_style_id/material_id/element_id |
| images | id, building_id, optional building_element_id, storage_key, source_page_url, original_url, author, licence_code, licence_url, caption, alt_text, width, height, byte_size, modification_note, sort_order, is_cover |
| admins | id, email, password_hash |

Core relational data uses normal tables and junction tables rather than comma-separated tags or JSON blobs. Target 3NF and explain functional dependencies in the final report. Repeated source details and category definitions live in their own tables.

Integrity requirements:

- Primary/foreign keys; unique slugs; unique building/category pairs; deduplicated aliases per building.
- Optional dates for uncertainty; require year_from <= year_to when both exist. Display approximate labels rather than fabricated exact years.
- Latitude/longitude range checks; positive image dimensions and byte sizes.
- Citation target check: at most one optional relationship target, or none for a building-wide assertion. Composite foreign keys ensure the target relationship belongs to the cited building.
- Image element linkage must belong to the same building, enforced with a composite foreign key.
- At most one cover image per building using a partial unique index. Publishing requires at least one approved cover and a supporting reference, enforced by the publication workflow.
- Archive records rather than expose destructive deletion in V1. Restrict deletion of referenced taxonomy/source records.
- Index foreign keys and common filters; inspect representative search queries with EXPLAIN ANALYZE.

## 9. Application architecture

React client -> Express REST API -> PostgreSQL.

Use JavaScript, React with Vite, Node.js/Express, and the pg driver with parameterized SQL and versioned SQL migrations. Keep SQL visible for the DBMS viva. Pin supported package versions when implementation begins.

Suggested layout: client/, server/, database/migrations/, database/seeds/, database/queries/, research/, docs/, media/. Keep secrets and original large media out of Git; provide .env.example and documented setup.

Public endpoints: GET /api/buildings, /api/buildings/:slug, /api/sites, /api/taxonomy, /api/compare?ids=..., /api/statistics. Public reads return published records only.

Admin endpoints: login/logout/session; create and update buildings; manage linked taxonomy, citations, and media; publish/archive. Use password hashing, server-side sessions persisted in PostgreSQL, HttpOnly cookies, CSRF protection for mutations, input validation, login throttling, and server-side authorization. Session persistence introduces an infrastructure session table beyond the domain ER diagram.

Use transactions for a building and its related materials, elements, styles, and citations. Validate uploaded media type and size. Accept curated media files and metadata; avoid an unrestricted server endpoint that fetches arbitrary remote URLs.

## 10. DBMS demonstrations

- ER diagram, cardinalities, relational mapping, and normalization to 3NF.
- JOIN query for a detailed building view.
- EXISTS queries for combined material/element filters without duplicate buildings.
- GROUP BY/HAVING or equivalent relational-division query for all selected elements.
- Aggregate counts using distinct building IDs where joins multiply rows.
- Comparison using intersection and difference of linked categories.
- View exposing published building summaries.
- Transaction rollback when a related insert fails.
- Constraints rejecting duplicate links and invalid date ranges.
- Index rationale with an execution plan.
- If the rubric later mandates stored routines or triggers, add a purposeful publication routine or audit trigger and document it.

## 11. Milestones and acceptance criteria

### M1 — Planning and academic foundation

Deliver this plan, draft synopsis, initial ER diagram, and source register. Status: delivered in this planning pass.

### M2 — Five-building evidence pilot

One sourced record per priority cluster, with verified material/element tags, citations, and approved photographs. At least one meaningful combined filter must have a known positive result and a known negative result.

Status: complete for the initial pilot. The verified demonstration uses Badami + cave temple + sandstone + carved pillar. Adding granite produces no match. Some records retain unknown material/style fields pending specialist references.

### M3 — Database and API

Migrations, seed import, public queries, admin authentication, validated writes, and transaction handling. Fresh local setup must work from documented commands.

Status: implemented and tested with native local PostgreSQL. Twelve isolated integration tests pass; a logical backup was restored and all saved rows matched.

### M4 — Website

Catalogue, detail pages, comparison, statistics, and admin editor connected to real PostgreSQL data; responsive heritage/museum styling and photograph credits.

Status: initial local version implemented. Browser review covered search, details, comparison, and narrow-screen layout. Related-building suggestions, direct image upload, and a dedicated site-management form remain follow-up improvements.

### M5 — Dataset expansion and local review

Aim for 30 documented records across seven clusters. Every published record has a source and approved image. Review image clarity, factual tags, aliases, empty states, mobile layouts, and keyboard operation. Any shortfall is reported rather than filled with invented data.

Status: complete for the approved 30-record allocation. Each addition has two reviewed photographs, aliases, cited architectural elements, and the existing catalogue/comparison/admin features. Unknown materials and disputed dates remain explicit. See docs/progress.md for verification and remaining gallery gaps.

### M6 — College submission package

Update ER diagram to match actual migrations, supply data dictionary, normalization explanation, SQL demonstration file, final synopsis, setup guide, and demonstration screenshots. Export document formats according to the college template when supplied.

### M7 — Later online publication

Select hosting, deploy frontend/API/database, configure HTTPS and secure cookies, migrate media, establish backups, and test restore and live flows. Hosting provider/cost is a later decision; the current deliverable is local operation.

## 12. Verification

Use a separate test database. Check combined/all-selected filters, alias search, duplicate-name locations, unknown values, pagination, published-only access, comparison, and aggregate accuracy. Test unauthorized mutation rejection, invalid relationships, SQL injection inputs, session expiry/logout, and transaction rollback. Confirm image attribution and correct subject identity manually. Verify a clean migration/seed run and backup/restore before final delivery.

## 13. Deferred scope

AI chat/natural-language search, 3D reconstruction, visitor accounts, crowdsourced edits, travel booking, conservation workflows, interactive maps, and exhaustive statewide coverage are future extensions. The schema should support growth without adding these workflows to V1.

## Photograph study, life stories and map — 29 October 2026

Implemented locally: photograph zoom/pan/full-screen and two-photo comparison; sourced chronological life events with independent administrator CRUD; clustered Karnataka map using the catalogue filters and comparison selection. See [implementation and limitations](docs/image-map-life-stories.md). Existing collection remains 30 monuments. Map currently uses explicitly approximate site reference locations. Validation: 21 passing integration tests and verified 17-table backup restore.
