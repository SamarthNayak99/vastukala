# Vastukala

Vastukala is an interactive archive of Indian architectural heritage built with **React, Node.js, Express, and PostgreSQL**. It covers **100 monuments at 73 sites across 21 states and union territories**, with 186 credited photographs, 110 reviewed photograph hotspots, and 116 sourced historical events.

See the [40-monument expansion inventory](docs/india-100.md) for the latest additions.

## Explore the archive

| Feature | What you can do |
| --- | --- |
| Display theme | Use light or dark mode. The site follows your device preference until you choose a theme. |
| Catalogue | Search names and aliases. Filter by state, site, type, material, and architectural element. |
| Monument profiles | Read historical descriptions and follow citations for dates, styles, and documented features. |
| Comparison | Select two monuments and inspect their shared and distinct features with supporting evidence. |
| Photograph study | Zoom and pan, open images in full screen, compare photographs, and inspect annotated architectural features. |
| Maps and timelines | Search clustered site markers by map area. Explore approximate construction ranges, BCE dates, and separately sourced historical events. |
| Administration | Manage monument records, references, prepared photographs, hotspots, and events. Review publication status. |
| DBMS Lab | Run guided SQL, explore the live schema, and practise transactions, constraint failures, and indexing with temporary tables. |

## Run locally

**Ask Vastukala** adds a separate architecture chatbot at `/ask`, powered by Groq. It combines relevant public catalogue excerpts and references with general architectural explanations. To connect it, set the server-only `GROQ_API_KEY` in your ignored `.env` and restart the API. Free-plan quotas apply. See [chat setup, evidence and privacy](docs/architecture-chat.md).

Use Node.js 22.12 or newer. From the repository root, install dependencies, fetch the catalogue photographs, and start the application.

```sh
npm ci
npm run media:fetch
npm run dev
```

Open [Vastukala](http://127.0.0.1:5173). The API listens on port 3001. The development command starts or reuses a project-local PostgreSQL instance on port 55432, applies migrations, imports missing records, and creates the first administrator. Seed imports preserve existing administrator edits.

The first photograph download can take time. The media command retries interrupted downloads and reuses completed files. The application serves prepared catalogue photographs and the Natural Earth basemap locally. See [Setup and troubleshooting](docs/setup-and-troubleshooting.md).

### Administration

Open **Administrator** in the footer and sign in with the initial credentials saved in `.local/admin-credentials.txt`. A record needs at least one citation and an approved, prepared cover image before publication. The editor manages metadata for prepared images.

To use an existing PostgreSQL server, copy `.env.example` to `.env` and set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Set `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters before creating the first administrator.

## Try the database features

1. In **The collection**, select **Badami**, **Cave temple**, **Sandstone**, and **Carved pillar** to find Badami Cave 3. Add **Granite** to see how requiring every selected material changes the result.
2. Search for **Lokeshwara** to find the Virupaksha Temple at Pattadakal through its alternate name.
3. Compare two monuments, then open **In numbers** to see statistics calculated from published records.
4. Open [DBMS Lab](http://127.0.0.1:5173/dbms-lab) for 13 lessons, four guided challenges, a 16-table schema explorer, and an indexing experiment with 40,000 synthetic rows. See the [DBMS Lab guide](docs/dbms-lab.md).

## Development and verification

| Command | Purpose |
| --- | --- |
| `npm run db:local` | Run the local PostgreSQL instance separately. |
| `npm run db:migrate` | Apply pending migrations. |
| `npm run db:seed` | Import missing catalogue records. |
| `npm run admin:create` | Create the first administrator. |
| `npm run db:backup -- --verify` | Write a logical snapshot and verify a restore in a disposable database. |
| `npm test` | Run integration tests in a temporary PostgreSQL database. |
| `npm run build` | Build the production frontend. |

Start PostgreSQL before running database commands or tests. Tests require permission to create a database and can target a separate cluster through `TEST_DATABASE_BASE_URL`. To serve the built application locally, run `npm start` after building and open [the local server](http://127.0.0.1:3001).

The recorded verification includes 30 passing integration tests, a successful production build, and a verified logical backup restore. See [Progress and verification](docs/progress.md).

## Project structure

| Path | Contents |
| --- | --- |
| `client/` | React interface and Vite configuration. |
| `server/` | Express API, catalogue queries, authentication, and DBMS Lab. |
| `database/` | PostgreSQL migrations and [demonstration SQL](database/queries/demo.sql). |
| `research/` | Curated monument data, sources, and photograph credits. |
| `scripts/` | Local setup, media preparation, and database maintenance. |
| `docs/` | [Architecture and API](docs/architecture-and-api.md), [database design](docs/database-design.md), and implementation guides. |

## Sources and collection scope

The catalogue documents a curated selection of monuments. Map markers represent approximate site reference points, and historical event coverage varies by monument. The [research register](research/resources.md) records source references. Photograph authors and reuse terms are listed in the [media manifest](research/media-manifest.json) and [third-party notices](THIRD_PARTY_NOTICES.md).

Local credentials, database files, backups, generated media, and academic submission files belong in the local workspace.
