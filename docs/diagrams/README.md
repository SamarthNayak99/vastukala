# ER diagram sources

Snapshot: 1 November 2026. PostgreSQL migrations 001-006, 20 permanent tables, 119 columns and 22 foreign keys.

SVGs are scalable diagrams. DOT files are editable Graphviz sources. PK means primary key; FK means a participating foreign-key column; UQ marks a single-column UNIQUE constraint; ? means nullable. Parent ends show 1 or 0..1, child ends 0..*. R-numbers map to the PDF foreign-key register. Composite uniqueness and partial indexes are detailed in the PDF. Dashed FK lines represent optional references; dashed view-lineage connectors in PDF page 7 represent derivation, not FKs.

01: full content overview. 02: catalogue and geography. 03: taxonomies and junctions. 04: sources/citations. 05: photographs/hotspots. 06: life events. 07: independent operational tables. 08: connection-local DBMS Lab practice tables.

The JSON snapshot is schema metadata only. No private row values are exported. The PDF adds a visual SQL-view lineage panel, an exact foreign-key register and integrity notes. Regeneration scripts: scripts/render-er-graphs.mjs and scripts/build-er-pdf.py.
