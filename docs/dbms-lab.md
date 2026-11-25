# Optional DBMS Lab — 1 November 2026

Open `/dbms-lab`, or use the bottom-right DBMS Lab link on the public heritage pages. The lab is a separate, lazily loaded learning route; it is not part of the primary architecture navigation. No permanent database tables or migrations are introduced by this feature.

## Learning content

The **Start here** tab opens with three ready-to-run questions. Filter Gujarat by sandstone and curving shrine towers, compare the documented features of Gol Gumbaz and the Qutb Shahi Tombs, or search the date range of Dholavira. Each example runs against the current published catalogue. Results appear first, with the first ten rows shown by default. Open **Show SQL and parameters** to inspect the executed query and its inputs.

Thirteen lessons cover relationships, INNER/LEFT JOIN, filtering and bound parameters, relational division, intersections/differences, aggregation and counting traps, normalization, constraints, transactions, indexes, temporal overlap, SQL views, and CTE/window-function ranking.

Each lesson explains the concept, identifies the implementation in this project, names relevant source files, and links the involved tables to the schema explorer. Executable lessons show the exact SQL sent to PostgreSQL, parameter values separately, elapsed query time, column names and result rows. The relationships lesson also displays its three contributing relations. Empty results and NULL values are explicit.

The labels distinguish:

- **Used in Vastukala:** a concept used by the existing archive. A lab query may still be a teaching adaptation; its result labels identify this.
- **Simplified explanation:** a readable teaching query or fictional normalization walkthrough.
- **Practice exercise:** temporary constraint/transaction tables, a synthetic indexing experiment, or an additional teaching query over public records.
- **Future concepts:** audit triggers, revision history, stored publishing functions, database-role separation, concurrent-edit protection and PostGIS remain unimplemented.

The view exercise queries the actual `published_building_summary` view. Other query templates adapt real relationships for teaching and are not presented as verbatim catalogue endpoint implementations.

## Interactive schema

The **ER diagrams** tab (`/dbms-lab?section=er-diagrams`) provides eight vector diagrams: the content overview, catalogue geography and primary type, material/style/element junctions, citation evidence, photographs and hotspots, sourced life events, operational tables, and temporary practice tables. Each diagram includes a plain-language explanation, key/cardinality legend, table inspection links, zoom controls and a full-size SVG link. Relationship registers identify all 22 declared foreign keys, including composite references. Operations are structure-only; administrator/session records remain excluded. Temporary relationships are explicitly separate from the permanent model.

The diagram assets in `client/public/er-diagrams/` and their structural reference in `client/src/er-diagrams.json` represent migrations 001–007. Update both when changing the schema. The existing Schema explorer reads live public schema metadata; diagram connectors run parent-to-child, while its arrows run child-to-parent.

`GET /api/lab/schema` reads current PostgreSQL column, constraint and index metadata for 16 explicitly allowed content tables. Authentication, sessions, migrations and seed bookkeeping are excluded. Foreign-key arrows point from the referencing table to the referenced parent. Keyboard-operable nodes and table buttons select a table; the current lesson's tables are highlighted.

`GET /api/lab/tables/:name` returns at most eight sample rows using a server-owned column projection. Samples include published monuments and related public associations only; image rows must also be approved. All 36 controlled state/UT names are public. Unknown table names, including `admins` and `sessions`, are rejected.

## Guided queries and challenges

Hosted TEMP-table exercises require a physical database session across statements and transactions. Set the server-only `LAB_DATABASE_URL` to the provider's **direct** PostgreSQL URL when `DATABASE_URL` uses a transaction pooler (such as Neon's `-pooler` endpoint). Practice and indexing create a dedicated client and close it after each request. Local development uses the normal local database URL. Catalogue and read-only Lab queries continue using the main application pool. See [Neon's pooling limitations](https://neon.com/docs/connect/connection-pooling).

`POST /api/lab/query` accepts `{template, params}`. Templates are `state`, `relationships`, `joins`, `filters`, `division`, `sets`, `aggregation`, `temporal`, `views`, `ranking` and `indexes`. Visitor input never supplies executable SQL, identifiers, a sort expression or a table name outside a fixed allowlist. Strict Zod objects reject additional SQL fields. Values are bound with PostgreSQL parameters.

Every query runs within `BEGIN READ ONLY`, with a three-second statement timeout and a maximum of 120 result rows. The SQL view already restricts publication status; other templates explicitly restrict published buildings. The index template accepts a **site ID**, exposed through a site selector, even though the shared request parameter is named `building`. Its EXPLAIN output is from `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` on the same fixed SELECT.

Four challenges ask learners to filter Rajasthan, match both Dome and Garden, count monuments despite join multiplication, and compare two element sets. Challenges grade the chosen template configuration, not arbitrary SQL text. Hints, a solution approach and loadable solution inputs are provided. Running those solution inputs reveals expected rows from the current catalogue; results are not hard-coded.

## Temporary practice

`POST /api/lab/practice` accepts one of `duplicate`, `foreign`, `dates`, `transaction-success` or `transaction-failure`. Each request creates fresh PostgreSQL TEMP tables with fictional rows on its own checked-out connection. The catalogue's content tables are never written. These are connection-local tables in the existing database session, not a separate persistent practice database.

The setup DDL is visible. Each exercise executes real statements; successful steps record an interim snapshot. PostgreSQL supplies real SQLSTATE/constraint errors. The response shows before state, statement trace, and after COMMIT or ROLLBACK. The success case commits only temporary-table changes; closing the connection then removes those tables. The failure case rolls back the earlier name edit as well as the failed association. Connections are destroyed in `finally`, including on setup errors, so temporary objects and session settings cannot leak into another exercise.

`POST /api/lab/performance` creates 40,000 synthetic rows in a TEMP table, analyzes it, measures a selective query before and after adding a temporary index, and returns actual plans and measured execution times. It does not disable sequential scans or fabricate speedups. Cache effects, selectivity and machine load affect measurements; a small real catalogue can legitimately use a sequential scan. The connection closes and removes the experiment after every run.

All lab requests are limited to 90/minute per IP. Practice/performance share an additional 15/minute limit. Practice statements have a five-second timeout; the scale experiment has eight seconds. The public lab endpoints do not require an administrator session because permanent catalogue mutations and arbitrary SQL execution are not available. Existing authenticated administrative endpoints retain their authorization and CSRF requirements.

## Validation

The isolated PostgreSQL suite contains 30 passing tests. It checks all three starter queries and covers the schema explorer, guided queries, constraint exercises, transactions, and index plans. The collection audit checks every monument's detail, coordinates, gallery, cited anatomy, life-story route, and participation in a comparison. It also checks the four prepared WebP sizes for every approved image.

The production frontend builds successfully. Browser review exercises the corner entry, live relationship query and source-table results, real rollback error/before-after state, interactive schema and challenge controls. The diagram/table panels scroll within their own regions on narrow screens.

## Demonstration sequence

1. Open a monument detail page, then open the DBMS Lab corner link.
2. In Relationships, run the Taj Mahal material query and trace the IDs through all three source tables.
3. Switch JOINs from LEFT to INNER and inspect the unmatched state rows.
4. Use Intersections to compare Taj Mahal and Humayun's Tomb.
5. Compare COUNT(*) with COUNT(DISTINCT b.id) in the aggregation lesson.
6. Run the failed transaction and observe the interim name edit disappear after ROLLBACK.
7. Inspect a composite hotspot foreign key in the schema explorer.
8. Finish a guided challenge, then run the separate synthetic indexing experiment.
