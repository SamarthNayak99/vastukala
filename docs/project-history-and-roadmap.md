# Vastukala — Implementation history and improvement roadmap

Historical baseline: the report below records the project as of 28 October 2026. The subsequently authorized comparison, anatomy and timeline work is documented in [Connected archive — 29 October](connected-archive.md), including the current schema and verification counts.

Documented: 28 October 2026  
Scope: Phase 1 through the current local version

## 1. Current position

Vastukala is a locally implemented, photograph-led archive of Karnataka's historic architecture. Visitors can search and filter buildings, read referenced detail pages, compare two records, and view database-generated statistics. An authenticated administrator can maintain records and their relationships.

The collection is fixed at **30 monuments across seven heritage locations, with 59 reviewed photographs**. No further monuments, locations, or architectural-feature categories are being added to this version. The improvements below are proposals for strengthening the existing project; they have not been implemented unless explicitly listed as completed.

The local application has been run and checked at:

| Component | Local address / port |
|---|---|
| React website | `http://127.0.0.1:5173` |
| Express API | `http://127.0.0.1:3001` |
| Project-local PostgreSQL | `55432` |

These addresses describe the local setup. A development process must be running for the website to be available; this is not an online deployment.

## 2. How the phases are recorded

The original plan uses milestones M1–M7. This report calls M1–M5 Phases 1–5 and records the final verification as a stabilization pass after Phase 5. The phases describe the sequence of work, not separate college submissions or invented completion dates.

| Phase | Purpose | Current status |
|---|---|---|
| 1 / M1 | Requirements, plan, synopsis, ER model and research approach | Delivered as Markdown documentation |
| 2 / M2 | Five-monument evidence and photography pilot | Completed |
| 3 / M3 | PostgreSQL database, API and administration logic | Implemented and integration-tested |
| 4 / M4 | Public website and administrator interface | Implemented locally; representative browser review completed |
| 5 / M5 | Approved collection expansion and local review | Completed: 30 monuments, seven locations, 59 photographs |
| Stabilization | Import preservation, integrity checks, build, backup/restore and running-site verification | Completed for the checks described below |
| M6 | Final college submission package | Core drafts exist; final formatting and submission assembly remain |
| M7 | Online publication | Not performed |

## 3. Phase 1 — Definition and planning

The original idea was a structured database of traditional Indian architecture, regional variations, materials and elements. It was narrowed to a feasible college DBMS project covering a curated Karnataka collection, including ancient and medieval architecture. Hampi's later Vijayanagara monuments are included within that historical scope.

The following decisions were established:

- A website with photographs, a building catalogue and detailed records.
- Combined filters for heritage location, building type, material and architectural element.
- Side-by-side comparison of exactly two buildings.
- A small statistics dashboard and administrator forms.
- Free visitor access and one administrator account for local content management.
- Real, reusable photographs with photographer credits and licence links.
- A warm heritage/museum appearance using earth tones, large images and clear layouts.
- Local implementation first, with online publication deferred.

The requested MERN-style stack was adapted to **PERN: PostgreSQL, Express, React and Node.js**. PostgreSQL replaces MongoDB because this project demonstrates relational modelling, joins, constraints, normalization and transactions.

Deliverables created in this phase were [the plan](../plan.md), [the synopsis](synopsis.md), [the ER diagram](er-diagram.md), and [the research/source register](../research/resources.md). The ER diagram was subsequently aligned with the implemented schema, including integer identity keys.

## 4. Phase 2 — Five-monument pilot

The pilot used one record from each initial location:

1. Vitthala Temple — Hampi.
2. Chennakeshava Temple — Belur.
3. Virupaksha Temple — Pattadakal.
4. Badami Cave 3 — Badami.
5. Durga Temple — Aihole.

These records established the research format: canonical name, alternate names, location, type, date range and precision, overview, history, layout, materials, styles, architectural elements, and supporting references. Nine photographs were prepared for the pilot.

The pilot also established an evidence rule: **unknown information remains unknown**. Stone type is not inferred from colour, a missing relationship does not prove a feature is absent, and approximate construction phases are not presented as exact completion dates.

A concrete DBMS demonstration was established: Badami + cave temple + sandstone + carved pillar returns Badami Cave 3. Requiring granite as an additional material produces no match. This tests both a valid combination and the all-selected-material rule.

The pilot data remains in [research/pilot.json](../research/pilot.json). Its existing live records were preserved during the later expansion.

## 5. Phase 3 — Relational database and API

### Database implementation

A real PostgreSQL database was implemented using versioned SQL migrations and the `pg` driver. Local startup can create or reuse a project-local PostgreSQL instance; Docker and a system PostgreSQL installation are not required for this development setup.

The schema has **14 domain tables**, plus session and migration bookkeeping tables:

| Area | Domain tables | Purpose |
|---|---|---|
| Building identity | `sites`, `building_types`, `buildings`, `building_aliases` | Identify each monument and distinguish names from places |
| Shared vocabulary | `styles`, `materials`, `elements` | Store reusable definitions |
| Building relationships | `building_styles`, `building_materials`, `building_elements` | Represent many-to-many relationships and occurrence-specific notes |
| Evidence | `sources`, `citations` | Store references and connect them to building facts or specific assertions |
| Photography | `images` | Store asset keys, attribution, licences, captions, dimensions and approval |
| Administration | `admins` | Store administrator identity and password hashes |

Images are files on disk; their metadata and building/element relationships are stored in PostgreSQL. Historical catalogue data is not stored as a single JSON document in the database. The session library's JSON session field is infrastructure, separate from the architectural model.

### Integrity and transaction rules

The database enforces primary and foreign keys, unique building slugs, unique building/category pairs, valid date order, coordinate ranges, positive image dimensions/byte sizes, allowed statuses, and at most one cover image per building.

Composite foreign keys ensure a citation target or photographed element belongs to the same building as the citation or image. A citation can target at most one linked style, material or element, or remain a building-wide reference.

Saving a building uses a transaction covering the main record, aliases, taxonomy relationships, citations and image metadata. If a related insert fails, the complete operation rolls back. The current edit operation replaces relationship rows, so their internal IDs may change; the building slug provides the public route identity.

**Publication boundary:** the application requires an approved, prepared cover image and a supporting citation before publication. This requirement is not a database trigger; direct SQL can bypass it. Foreign keys and the unique-cover constraint still apply at database level.

### Retrieval logic

- Filter groups combine with AND.
- Multiple locations or building types match any selected value within their group.
- Every selected material and every selected element must be documented on a matching building.
- An empty filter group adds no restriction; an unknown attribute does not satisfy a positive filter.
- Keyword search covers canonical names and aliases, with literal handling of SQL-like search text.
- Pagination and name/period sorting are implemented.
- Public detail, catalogue, comparison and statistics queries use published records only.
- Comparison validates two distinct published IDs and calculates shared styles, materials and elements by their category IDs.
- Statistics count buildings without multiplying totals through citation or image joins.

Parameterized SQL is used for query values. The schema also includes a published-summary view and indexes supporting the main relationships and filters. [The SQL demonstration file](../database/queries/demo.sql) shows joins, relational division, aggregation, intersection, alias retrieval and query-plan inspection.

### API and authentication

Public routes include health, taxonomy, sites, building list/detail, comparison and statistics. Administrator routes support record listing, creation and editing, plus reference and category creation. Authentication includes login, logout and session endpoints.

Implemented protections include password hashing, PostgreSQL-backed sessions, HttpOnly cookies, CSRF checks for mutations, login throttling, input validation, server-side administrator checks, and production-mode secure-cookie settings. These are implemented controls, not a claim that an independent security audit has been completed.

## 6. Phase 4 — Website and administrator interface

| Screen / workflow | Implemented behaviour |
|---|---|
| Home | Heritage hero photograph, introduction, collection counts and location discovery links |
| Catalogue | Photograph cards, search, four filter groups, active chips, reset, sorting, pagination and empty states |
| Building detail | Gallery, larger image link, dates, aliases, history, layout, materials, elements, references and image credits |
| Compare | Two building columns and shared documented attributes |
| Statistics | Published record counts and distributions by location, type, material and element |
| About / credits | Scope, methodology and reference library |
| Administrator | Login/logout, add/edit forms, relationships, citations, photo metadata and publication status |

Records support `draft`, `published` and `archived` states. Archiving removes a record from public access while retaining it in the database. Destructive deletion is not exposed as a normal visitor/admin website action in this version.

The interface uses responsive layouts, serif headings, warm colours and visible photograph credits. The implementation includes focus styles and labelled controls. Representative narrow-screen review led to adjustments to the comparison tray and route-change scrolling; a full accessibility audit remains future work.

Direct browser file uploads, related-building recommendations, an audit-history viewer and a dedicated site-management screen have not been implemented. Administrator image forms manage metadata for prepared assets.

## 7. Phase 5 — Approved collection expansion

The user approved 25 additions to the five-record pilot. The final inventory is:

| Location | Final total | Included records |
|---|---:|---|
| Hampi | 8 | Vitthala, Virupaksha, Achyutaraya, Krishna and Hazara Rama temples; Lotus Mahal; Elephant Stables; Queen's Bath |
| Pattadakal | 7 | Virupaksha, Mallikarjuna, Sangameshvara, Papanatha, Galaganatha, Kadasiddheshvara and Jambulinga temples |
| Badami | 6 | Cave temples 1–4; principal Bhutanatha Temple; Malegitti Shivalaya |
| Aihole | 6 | Durga, Lad Khan and Hucchimalli temples; Meguti Jain Temple; Ravana Phadi Cave; Huchappayya Matha |
| Belur | 1 | Chennakeshava Temple |
| Halebidu | 1 | Hoysaleswara Temple |
| Somanathapura | 1 | Keshava Temple |
| **Total** | **30** | **Seven locations** |

Sites are heritage clusters, while buildings are individually identified records. Hampi is not counted again as an extra monument. The two Virupaksha temples have separate slugs and location relationships. Huchappayya Matha is distinguished from Huchappayya Gudi; Bhutanatha's record concerns the principal lakeside temple rather than counting every shrine in the group.

New research is stored in [research/expansion.mjs](../research/expansion.mjs), combined with the pilot by [research/dataset.mjs](../research/dataset.mjs). Existing building records are skipped by the seed importer so routine startup preserves administrator edits.

### Photography and research curation

Fifty photographs were added, bringing the total to 59. Each of the 25 additions has two reviewed views. The original five retain their galleries; Durga Temple has one photograph. This is not yet a uniform three-to-five-image collection.

The media workflow records the source file page, original URL, photographer, licence/version and link, dimensions, bytes, caption and modification note. It retains originals and prepares WebP copies at target widths of 480, 960, 1600 and 2400 pixels without enlargement. Selected close-ups are linked to documented building elements.

File names and search categories were treated as leads, not sufficient identification. Visual review rejected a soft Cave 1 medallion, a repetitive Cave 2 gallery view and a misleading Lad Khan hillside photograph; clearer, correctly identified replacements were used. Plans, stereoscopic pairs and neighbouring monuments were excluded where inappropriate. Interrupted transfers were retried, completed files reused, and Wikimedia retry periods respected.

Official, institutional and scholarly references support the records. Disputed dates are labelled rather than forced into exact years. Some geological material and style identifications remain undocumented. Further identification decisions are recorded in [expansion-notes.md](../research/expansion-notes.md).

## 8. Stabilization and verification

The following checks were completed for the current version; they are evidence of the tested behaviour rather than a guarantee that every possible device or input has been covered.

### Automated integration verification

**Twelve integration tests passed** against a separately created PostgreSQL database, removed afterwards:

1. All 30 sourced records publish across seven locations with prepared photographs.
2. Combined filters return a known positive match and reject incompatible additional material selections.
3. Aliases, literal SQL-like input, pagination and invalid filter IDs behave as expected.
4. Comparison requires distinct published buildings and identifies shared elements.
5. Statistics count buildings correctly despite multiple associated rows.
6. Invalid foreign keys and reversed date ranges are rejected.
7. A failed relationship update rolls back the main record and associations.
8. Administrator authentication, CSRF, editing, publication, archival, public visibility and logout work through the API.
9. Images cannot target another building's element.
10. Same-named Virupaksha temples remain distinct and comparable.
11. New Pattadakal associations support combined filtering, and Halebidu/Somanathapura compare correctly.
12. Duplicate relationships, multiple cover images and cross-building citation targets are rejected.

The test source is [tests/integration.test.mjs](../tests/integration.test.mjs). No test coverage percentage has been measured or claimed.

### Data preservation, assets and recovery

- A pre-import snapshot was used to verify that the original five building records and their existing aliases, associations, citations and images remained unchanged.
- The expansion check verified the exact seven location totals, two images for each addition, and supporting citations/elements.
- The running API returned 30 records and 59 approved photographs; all 59 checked 1600-pixel asset endpoints returned HTTP 200.
- The production React build completed successfully.
- A logical database backup was restored into a disposable database; saved rows across all 14 domain tables matched the source snapshot.
- Backup files include administrator password hashes and must remain private. Photographs are excluded from the logical database backup and need separate backup handling.

### Browser verification

Representative browser checks confirmed catalogue loading and pagination, combined Pattadakal + sandstone + mandapa filtering, the Halebidu/Somanathapura comparison, detail-page references, and gallery switching with the corresponding caption, author, licence and original dimensions. The application was started locally and a final catalogue screenshot saved under `.local/qa/`.

The project is locally verified. Online hosting, production HTTPS behaviour and exhaustive browser/device coverage have not been validated.

## 9. Current limitations

| Limitation | Practical consequence |
|---|---|
| Some historical/material/style details are unknown | A positive filter will exclude a record lacking that documented relationship |
| Gallery depth varies | Not every record has several exterior, interior and element views |
| Images are prepared outside the browser | The administrator cannot upload a new local file directly through the editor |
| Publication prerequisite is application-enforced | A direct SQL write can create a published record that fails website publication requirements |
| No optimistic edit-conflict check or audit history | A stale editor can overwrite a newer save, and previous versions are not available through a history screen |
| List requests hydrate detailed associated data for each building | More database queries and payload than a minimal card-list response requires |
| Association rows are replaced during edits | Their internal IDs can change; future history/integration features must account for this |
| Slug changes have no redirect mechanism | Existing bookmarked building URLs can stop resolving after a slug edit |
| Backup is a project-specific logical database snapshot | It does not constitute a complete production database-and-media disaster-recovery system |
| Final college format is unspecified | Existing Markdown deliverables still need institution-specific assembly/export |
| Online deployment is pending | The development server is not a permanent hosted service |

## 10. Major improvement roadmap — proposals only

The roadmap improves the fixed collection. It does not authorize adding monuments, locations or new architectural-feature categories.

### A. Complete the college submission package — immediate priority

**Work:** assemble the synopsis, final ER diagram, relational schema, normalization explanation, SQL examples, screenshots, setup guide, test evidence and bibliography into the college's required format. Add student, institution and guide details when supplied. Include a short viva/demo script explaining the actual queries and constraints.

**Benefit:** turns the working application into an assessable DBMS submission.

**Database impact:** documentation and demonstration work; no schema change required.

**Acceptance:** a reviewer can reproduce setup, follow the ER diagram to actual tables, run the SQL demonstrations and understand which integrity rules belong to SQL versus application code.

### B. Strengthen publication and editing integrity — high priority

**Work:** design a database-level publication validation mechanism if publication must remain valid under direct SQL and later relationship changes. Cover removing the last citation, unapproving/removing a cover, and status transitions—not just insertion. Keep physical file existence checks in the application because PostgreSQL alone cannot establish remote/local asset availability reliably.

Add optimistic concurrency checks using a version value or a checked timestamp, and an administrator audit trail recording actor, operation and change history in the same transaction as the edit.

**Benefit:** prevents stale saves from silently overwriting changes and makes edits traceable.

**Database impact:** version/audit schema changes and, if adopted, a carefully tested publication routine or trigger strategy through a new migration.

**Acceptance:** a second save from a stale editor produces a conflict; failed edits create no partial data or misleading audit entry; direct SQL violating the chosen publication rule is rejected. Existing records remain valid after migration.

### C. Expand end-to-end and accessibility verification — high priority

**Work:** automate representative browser journeys for filtering, pagination, comparison, gallery switching, administrator editing and status changes. Review keyboard-only use, focus management, form errors, contrast, loading states, small screens and screen-reader output. Run the existing database suite and build in continuous integration against a disposable PostgreSQL database.

**Benefit:** catches interface regressions that API tests alone cannot detect and improves usability for different users and devices.

**Database impact:** normally none; test fixtures must stay separate from the catalogue database.

**Acceptance:** reproducible browser checks pass, key flows work by keyboard and on narrow screens, and a failed required check prevents a release from being treated as verified.

### D. Improve media administration and recovery — medium priority

**Work:** add a controlled upload/processing workflow for the existing records, validating file type and size, retaining credits/licences, preparing responsive variants, and supporting preview before approval. Coordinate file operations with database updates and define cleanup/recovery for failed processing and unreferenced assets. For deployment, migrate prepared files to durable media storage while retaining stable metadata links.

**Benefit:** reduces dependence on command-line image preparation and avoids broken galleries after migration or recovery.

**Database impact:** may require asset-processing status and storage metadata; audit relationships and publication checks must remain consistent.

**Acceptance:** failed processing cannot publish an unusable cover, missing credits cannot be approved, and a restore recovers both database records and usable media.

### E. Improve catalogue query efficiency and URL stability — medium priority

**Work:** return a compact card-list projection with one approved cover per building, and fetch full narratives, citations and galleries on detail requests. Consider batched relationship queries where needed. Measure query plans, query count, payload size and response time before introducing caches or additional indexes. Add an explicit slug-change policy or redirect history.

**Benefit:** reduces redundant database work and makes shared/bookmarked links more reliable.

**Database impact:** revised queries; possible measured indexes and a slug-history table. Small-table sequential scans are not inherently a performance failure.

**Acceptance:** result counts, all-selected filtering, sort order and pagination remain unchanged; measured query/payload costs decrease; old permitted URLs follow the documented policy.

### F. Improve interpretation of the existing records — medium priority

**Work:** fill evidenced gaps in the current monuments' descriptions and material usage, improve terminology explanations, show relevant linked close-ups more directly, and suggest comparisons between existing records. Any historical correction should retain its evidence and uncertainty. Work stays within the approved collection and feature vocabulary.

**Benefit:** makes the database's relationships more useful to a student or visitor without increasing the monument count.

**Database impact:** primarily reviewed updates to existing records and relationships; no new monuments are required.

**Acceptance:** revised assertions have citations, unknowns remain explicit, and explanations/related-record links are supported by stored relationships rather than invented similarity claims.

### G. Deploy and operate the completed project — later publication milestone

**Work:** configure a production database, application hosting, HTTPS, appropriate proxy trust, secrets, secure sessions, persistent media storage, deployment migrations, health/error monitoring and automated backups. Use a supported production PostgreSQL setup rather than treating the bundled local development instance as a hosted service. Rehearse rollback and database-plus-media restoration.

**Benefit:** makes the existing project accessible online with a repeatable operating and recovery process.

**Database impact:** connection and operational configuration, migrations, backup scheduling and restore procedures; the relational model can remain intact.

**Acceptance:** public and administrator flows work over HTTPS; data and photographs survive redeployment; restored records and image files are usable; secrets are absent from client assets and the repository.

### Suggested order

1. Assemble the college submission package and record any rubric-specific requirements.
2. Address integrity/editing improvements and automate important browser flows.
3. Complete accessibility/usability review, then media and query-efficiency improvements as needed.
4. Deploy only after production configuration and database-plus-media recovery are verified.

Audit history, media uploads and hosting are substantial work items. The current local version should remain the stable baseline while any selected improvement is developed and verified separately.

## 11. Files and operating handover

| File / directory | Role |
|---|---|
| [README.md](../README.md) | Local setup, commands and usage |
| [plan.md](../plan.md) | Original requirements, milestone definitions and scope freeze |
| [synopsis.md](synopsis.md) | College project synopsis draft |
| [er-diagram.md](er-diagram.md) | Implemented domain relationships |
| [database-design.md](database-design.md) | Keys, functional dependencies, normalization and integrity boundaries |
| [progress.md](progress.md) | Short current-status and verification record |
| [database/migrations/001_initial.sql](../database/migrations/001_initial.sql) | Implemented schema, constraints, indexes and view |
| [server/catalogue.mjs](../server/catalogue.mjs) | Catalogue queries, validation and transactional saving |
| [server/app.mjs](../server/app.mjs) | API routes, sessions, authentication and authorization |
| `client/src/` | Public website and administrator interface |
| `research/` | Structured building facts, references, selected media metadata and research decisions |
| [scripts/seed.mjs](../scripts/seed.mjs) | Import missing records while preserving existing building records |
| [scripts/check-expansion.mjs](../scripts/check-expansion.mjs) | Exact collection totals and pre-import preservation verification |
| [scripts/backup.mjs](../scripts/backup.mjs) | Logical backup and optional isolated restore check |
| `.local/` | Ignored local database settings, credentials, backups and QA evidence |
| `media/originals/`, `media/display/` | Ignored originals and generated website images |

From the project directory, `npm run dev` starts the local application and reuses existing data. `npm test` runs the integration suite in a temporary database; `npm run build` builds the frontend; `npm run db:backup -- --verify` creates and verifies a logical database backup. Database-dependent commands require PostgreSQL to be running. Full setup details and fresh-checkout photograph preparation are in the README.

Private administrator credentials and generated connection settings are intentionally not reproduced in this report. Research/discovery/review helper scripts record the curation process; they should not be rerun merely to demonstrate the finished catalogue. In particular, image approval still requires actual visual review.
