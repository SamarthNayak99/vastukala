# Implementation progress — 28 October 2026

## Connected archive update — 29 October 2026

The three requested exploration features are implemented: evidence-backed comparison explanations/differences, photograph anatomy with 37 reviewed markers across all 30 existing monuments, and feature/date-range timelines with cited evidence and a separate undated section. Administrator photo editing supports marker placement and validation. The original collection and vocabulary remain fixed.

Verification: 19 integration tests pass; the frontend build passes; the original 14 domain tables were preserved across migration; a backup/restore of all 16 backed-up tables (15 domain plus curation seed state) passes. SQL DATE handling was corrected to preserve calendar dates during backup/restore. The original PostgreSQL instance was recovered after an explicitly approved restart. See [Connected archive implementation](connected-archive.md) for the schema, workflow, limitations and recovery details.

The remaining sections record the earlier baseline as of 28 October; their 12-test and 14-domain-table counts are historical.

Current baseline: **30 monuments, seven locations, 59 reviewed photographs, 12 passing integration tests**. The original five records were preserved, the production build passed, and a logical backup/restore across all 14 domain tables was verified. The collection is fixed; further work focuses on the existing website and database.

For the complete Phase 1–5 history, stabilization evidence, limitations and proposed improvements, see [Implementation history and roadmap](project-history-and-roadmap.md). The nine-test result below records the earlier pilot verification; the expanded baseline has twelve passing tests.

## Delivered in the first implementation pass

M1 planning and academic drafts are present. M2's initial five-building pilot is imported into real PostgreSQL. M3's schema/API and M4's first website version are implemented locally.

The pilot contains Vitthala Temple (Hampi), Chennakeshava Temple (Belur), Virupaksha Temple (Pattadakal), Badami Cave 3, and Durga Temple (Aihole). Nine original photographs, approximately 2–14 MB each, have credited metadata and responsive local display copies. Image source identity and display quality were reviewed using a contact sheet and the Pattadakal exterior at a larger size.

Implemented: public catalogue; keyword/alias search; location/type/material/element filters; shareable filters; sorting/pagination; detail pages and galleries; two-building comparison; database statistics; login/logout; draft/published/archived editing; relationship/citation/photo metadata forms; reference/category creation; publication prerequisites; migrations; seeds; and local administrator generation.

The visual direction combines earth tones, large photographs, serif headings, and museum-like captions. Photographs are served locally with original file-page and licence links.

## Verification evidence

- Production React build completed successfully.
- Nine integration tests passed in a newly created temporary PostgreSQL database, which was removed afterwards.
- Test coverage: known positive/negative combined filters; all-selected matching; alias search; literal SQL-like input; pagination; invalid IDs; comparison validation/intersection; statistics without join multiplication; foreign-key/date constraints; atomic rollback; authentication/CSRF; draft visibility; editing; logout; and cross-building image-element rejection.
- Browser review confirmed Badami + sandstone + carved pillar returns Badami Cave 3, selection of two buildings, detail-page references, and comparison rendering.
- Narrow-screen screenshot review led to hiding the persistent comparison tray on comparison/admin pages and resetting scroll on route changes.
- A logical backup of 14 domain tables was restored into a separate temporary database; all restored rows matched the source snapshot.

Local QA images and backup files are stored under `.local/` and are ignored by Git.

## Current boundaries

- The approved catalogue allocation is complete: 30 monuments across seven locations.
- Material fields at Pattadakal's Virupaksha Temple and Aihole's Durga Temple remain unknown in the seed until building-specific evidence is added. Some style fields also remain unknown.
- The broad Vitthala period is an ensemble-level range, not an exact completion date. Belur's 1117 date is labelled as inception with later changes.
- Durga Temple at Aihole retains one photograph. Each of the 25 additions has two reviewed views; galleries with 3–5 reviewed views for every building are still a target.
- New images are prepared through the media script and managed as metadata in the admin form; direct browser file upload is not implemented.
- Site/location creation is currently a seed/database operation. A site-management form and related-building suggestions remain follow-up UI work.
- No online deployment has been performed. Production hosting, provider backups, accessibility review across additional devices, and final college document formatting remain later milestones.

## Next phase

Keep the approved collection fixed. Prioritize the college submission package, reliability, accessibility and evidence quality within the existing records. Proposed major improvements and acceptance criteria are documented in [the roadmap](project-history-and-roadmap.md#10-major-improvement-roadmap--proposals-only).

## Approved catalogue expansion — 28 October 2026

Added 25 individually documented monuments: Hampi +7, Pattadakal +6, Badami +5, Aihole +5, Halebidu +1, and Somanathapura +1. The live collection now contains 30 records: Hampi 8, Pattadakal 7, Badami 6, Aihole 6, Belur 1, Halebidu 1, and Somanathapura 1.

Fifty additional openly licensed photographs were downloaded and visually reviewed, bringing the collection to 59. Each addition has a cover and a second view, original-resolution metadata, author/licence links, and responsive local copies. Nearby monuments, plans, and ambiguous image identities were excluded. Wikimedia Retry-After periods were respected during preparation.

All additions use the existing detail galleries, combined filters, comparison, dashboard and administrator forms. Home-page discovery links now follow the published locations. Disputed dates are labelled and cited; material identifications remain unknown where the references do not support them. See research/expansion-notes.md.

Verification: twelve integration tests passed in an isolated PostgreSQL database; the production build passed; the live collection and new detail/gallery were reviewed in the browser. A separate expansion check verified exact location totals, two photographs per addition, supporting citations/elements, and preservation of all existing building records and associations against the pre-import backup.

## First repository release — 29 October 2026

Version 1.0.0 documents the final local feature set, setup, API, validation, rights and known limitations. See CHANGELOG.md and docs/v1-verification.md. No further monuments were added. Runtime data and secrets remain outside version control.
