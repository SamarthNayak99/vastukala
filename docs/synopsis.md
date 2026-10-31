# Project Synopsis

## Title

Vastukala: A Database-Driven Archive of India's Historic Architecture

## Abstract

Vastukala is a web application for organizing and exploring documented examples of India's historic architecture. The collection retains 30 Karnataka monuments and adds 30 monuments across 16 additional states and union territories. Each building record connects photographs and historical descriptions with its location, building type, architectural styles, construction materials, architectural elements, and references.

The application allows visitors to browse without registration, combine search filters, compare two buildings, and view statistical summaries of the curated collection. An authenticated administrator can add, edit, and publish records. PostgreSQL stores the relational data, Express and Node.js provide the application API, and React provides the user interface. The application runs locally, with online deployment planned for a later phase.

## Problem statement

Information about historic monuments is often presented as separate descriptions and image collections. The proposed system addresses the need to organize selected architectural facts into consistent, related records so that users can retrieve and compare buildings by their documented attributes. The project also provides a practical demonstration of relational database design and query processing.

## Objectives

1. Design a normalized relational database for buildings, locations, materials, styles, elements, images, and sources.
2. Create a photograph-led catalogue with detailed, referenced building pages.
3. Support combined filters and side-by-side comparisons using SQL queries.
4. Generate accurate summaries of the records in the database.
5. Provide controlled administration and maintain referential integrity.
6. Preserve uncertainty in historical data and attribution for reused photographs.

## Scope and modules

The national version contains 60 curated monument records, with source-linked photographs and architectural evidence. Modules include catalogue/search, building details and gallery, cited comparison, photograph anatomy, building-date timelines, two-photo study, separately sourced life events, a clustered heritage map, statistics, administration, and reference/credit management. The collection includes ancient and medieval architecture; it does not claim complete documentation of all Karnataka monuments.

## Methodology

Requirements analysis, an ER model, relational mapping, and normalization guided the implementation. A five-building pilot validated the schema and research process. Information is gathered from official and scholarly sources, with claim-specific citations. Photographs are selected from reusable collections after checking their identity, resolution, author, and licence. Versioned migrations and validated seed imports populate PostgreSQL. API and interface development proceeded in stages, followed by database, functional, and visual verification.

## Database concepts demonstrated

Primary and foreign keys, one-to-many and many-to-many relationships, normalization, integrity constraints, joins, nested queries, aggregation, views, transactions, and indexing. A separate SQL demonstration file explains the queries supporting the user-facing features.

## Expected outcome

A locally working, responsive website with a persistent PostgreSQL database, a sourced photographic catalogue, combined filtering, two-building comparison, collection statistics, and authenticated administration. Academic deliverables include an ER diagram, data dictionary, normalization explanation, synopsis, and SQL examples. Online publication will follow local validation.

## Starting references

- [UNESCO: Group of Monuments at Hampi](https://whc.unesco.org/en/list/241)
- [UNESCO: Group of Monuments at Pattadakal](https://whc.unesco.org/en/list/239)
- [UNESCO: Sacred Ensembles of the Hoysalas](https://whc.unesco.org/en/list/1670)
- [UNESCO tentative-list submission: Aihole–Badami–Pattadakal](https://whc.unesco.org/en/tentativelists/5972)
- [Research and image source register](../research/resources.md)

Submission details such as student names, institution, guide, and required formatting will be added when available. The local application is implemented; online publication and college-specific document formatting remain later steps.

## Version 1 implementation status — 29 October 2026

The local application includes 37 reviewed hotspots and 59 approved photographs across the fixed 30 monuments. Life events are stored independently of construction dates and require a source. Approximate site reference positions support map discovery without claiming surveyed building locations. Twenty-one integration tests and a 17-table logical backup restore have passed. Online deployment, exhaustive event research and surveyed monument coordinates remain future work.

## National expansion — 31 October / 1 November 2026

A state/UT dimension, state-based retrieval and a clustered India map extend the catalogue across 17 states/UTs. BCE-aware chronology accommodates early Buddhist monuments without mislabelling their dates. Existing Karnataka identifiers and records are retained, with imports designed to preserve administrator edits. Coverage is selective, not exhaustive.

## Educational extension: DBMS Lab

An optional learning route connects relational theory to the implemented archive through 13 lessons, a live 16-table schema explorer, guided parameterized SQL and four challenges. Fictional normalization examples, actual PostgreSQL constraint errors, transaction traces and rollback, and a separate synthetic indexing experiment support classroom demonstrations. Permanent catalogue tables are never written by practice exercises; temporary tables are connection-local and destroyed after each run. See [DBMS Lab guide](dbms-lab.md).
