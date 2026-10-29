# Vastukala — v1.0.0

A PostgreSQL-backed architecture archive for a college DBMS project. The local collection contains 30 researched Karnataka monuments across seven locations and 59 credited, high-resolution photographs. Built with React, Express, Node.js and PostgreSQL.

## Run locally

Use Node.js 22.12 or newer. From this project directory:

```powershell
npm ci
npm run media:fetch  # First checkout only; downloads credited catalogue photographs
npm run dev
```

Open http://127.0.0.1:5173. The API uses port 3001. The startup command creates or reuses a project-local PostgreSQL instance on port 55432, runs migrations, imports missing catalogue records, and creates one administrator. Docker and a system PostgreSQL installation are not required.

The native database and its generated local connection settings live in `.local/`, which is ignored by Git. Administrator credentials are in `.local/admin-credentials.txt`; this file is generated once and is also ignored. Use the **Administrator** link in the footer to log in. Existing database records are preserved on startup, including admin edits.

Stop the development command with Ctrl+C. If you separately started `npm run db:local`, stop that command too. PostgreSQL data remains on disk.

## Try the database features

The connected archive adds **[cited comparisons, photograph anatomy and feature timelines](docs/connected-archive.md)**. Open `/compare`, `/anatomy` or `/across-time`. There are 37 reviewed hotspots across the existing 30 monuments. Administrators can place and edit markers within the Photographs editor; every marker needs a cited building element.

1. Open **The collection**.
2. Select **Badami**, **Cave temple**, **Sandstone**, and **Carved pillar**. Badami Cave 3 matches.
3. Add **Granite** as a second material. No record matches, because every selected material is required.
4. Reset filters and search **Lokeshwara**. The alternate-name relationship finds Virupaksha Temple at Pattadakal.
5. Add two buildings to comparison, then open **Compare buildings**.
6. Open **In numbers** for statistics computed from published database records.
7. Log in as administrator to add/edit records, associate materials/elements/styles, cite references, manage photograph metadata, and change draft/published/archived status.

Publishing requires an approved prepared cover image and at least one citation. Unknown materials stay unknown. Draft and archived buildings are excluded from public search, detail pages, comparison, and statistics.

## Research and photographs

- `research/pilot.json` and `research/expansion.mjs`: structured building research and claim references, combined by `research/dataset.mjs`.
- `research/expansion-notes.md`: identification choices, disputed dates and media workflow.
- `research/media-candidates.json`: selected Wikimedia file titles.
- `research/media-manifest.json`: author, licence, source URL, original dimensions/bytes and review status.
- `media/originals/`: downloaded originals, ignored by Git.
- `media/display/`: responsive WebP copies, ignored by Git.

On a fresh checkout, fetch photographs **before** the first seed:

```powershell
npm run media:fetch
```

Newly fetched records default to unapproved; the committed manifest preserves approval of the reviewed catalogue images. The media script retries interrupted downloads, reuses completed files, spaces new requests, and honours Wikimedia retry periods. A fresh full download can take some time. Network access is needed for dependency/media installation, OpenStreetMap basemap tiles and optional Google Fonts; system font fallbacks are provided. Catalogue photographs are served locally.

For additional photographs, add a candidate, run the media command, inspect the actual image, record its approval, then add its metadata in the admin editor. The prepared asset key identifies the local files. The UI does not currently upload arbitrary files. Source and category creation forms are available below the admin table; site creation is currently a database/seed operation.

## Database commands

```powershell
npm run db:local       # Optional: run PostgreSQL separately
npm run db:migrate     # Apply unapplied SQL migrations
npm run db:seed        # Import missing catalogue records; preserve existing ones
npm run admin:create   # Create the first administrator if none exists
npm run db:backup -- --verify # Logical backup and isolated restore check
npm test              # Integration tests in an isolated temporary database
npm run build         # Production frontend build
```

The database must be running before migration, seed, administrator, or test commands. Tests create and remove their own uniquely named database; they do not alter catalogue data. This requires database-creation permissions on the local test cluster. Set `TEST_DATABASE_BASE_URL` to select a different test cluster.

The backup command writes a project-specific JSON logical snapshot in `.local/backups/`. With `--verify`, it restores into a disposable database and compares every saved row. It includes administrator password hashes, so keep it private; photograph files must be backed up separately. This is a local project backup format, not a replacement for a deployment provider's PostgreSQL backup service.

To use an installed PostgreSQL instance, copy `.env.example` to `.env` and set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) before initial administrator creation. Startup does not overwrite an existing account.

For a local built version, keep PostgreSQL running, run `npm run build`, then `npm start` and open http://127.0.0.1:3001. Online deployment is a later milestone; secure cookies and a trusted proxy are enabled with `NODE_ENV=production`.

## Version 1 features

- Catalogue: 30 monuments, seven sites, combined filters and alternate-name search.
- Cited comparison: shared and distinct materials, layouts, styles and elements.
- Anatomy: 37 curated photograph hotspots, definitions, citations and related monuments.
- Across time: approximate building-date ranges, feature filtering and undated records.
- Photograph study: zoom, pan, full-screen and independent two-photo comparison with attribution.
- Life stories: separately sourced events, uncertainty, chronological display and admin event CRUD.
- Karnataka map: clustered site reference markers, catalogue filters, map-area search and comparison selection.
- Administration: session login, CSRF protection, validated record editing and publishing.

Map positions currently represent approximate **site reference points**, not surveyed individual buildings. Event coverage varies; missing records are not evidence that no event occurred. No online deployment is included in this release.

## Academic and implementation documentation

- [Version 1 release notes](CHANGELOG.md)
- [Architecture and API](docs/architecture-and-api.md)
- [Setup and troubleshooting](docs/setup-and-troubleshooting.md)
- [Verification and demonstration](docs/v1-verification.md)
- [Image study, map and life stories](docs/image-map-life-stories.md)
- [Connected archive implementation and verification](docs/connected-archive.md)
- [Phase-by-phase implementation history and major improvement roadmap](docs/project-history-and-roadmap.md)
- [Plan and milestones](plan.md)
- [Project synopsis](docs/synopsis.md)
- [ER diagram](docs/er-diagram.md)
- [Data dictionary and normalization](docs/database-design.md)
- [Demonstration SQL](database/queries/demo.sql)
- [Progress and verification](docs/progress.md)
- [Research sources](research/resources.md)

The collection contains Hampi (8), Pattadakal (7), Badami (6), Aihole (6), Belur (1), Halebidu (1), and Somanathapura (1). The 25 additions each have two reviewed photographs. Deeper dossiers, further element close-ups, final submission formatting, and online deployment remain later work.


New local features: [photo study](http://127.0.0.1:5173/photographs), [life stories](http://127.0.0.1:5173/life-stories), and [heritage map](http://127.0.0.1:5173/map). See [implementation details](docs/image-map-life-stories.md), including source coverage and approximate site-coordinate limitations.

## Repository contents and rights

Local credentials, PostgreSQL data, session secrets, backups, downloaded originals, generated WebP images, dependencies and build output are excluded from Git. Recreate the catalogue through migrations, curated research data and the documented media-fetch step. Database edits made only through the administrator are local data and are not automatically exported to Git.

Photograph metadata retains individual source, author and licence information in `research/media-manifest.json`; private repository visibility does not replace those licence obligations. No general open-source licence is granted for project code in this first private release. See [third-party notices](THIRD_PARTY_NOTICES.md).
