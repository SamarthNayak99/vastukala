# India-wide archive — 31 October 2026

The expansion preserves the original 30 Karnataka monuments and adds exactly 30 historic monuments. The resulting selective archive covers 60 monuments, 36 heritage locations and 17 states/union territories. It is not a complete inventory of Indian architecture.

## Geographic coverage

- Karnataka: original 30 records, retained with their identifiers, sources, photographs and annotations.
- Uttar Pradesh: Taj Mahal, Agra Fort, Fatehpur Sikri.
- Delhi (UT): Qutb Minar, Humayun’s Tomb, Red Fort.
- Madhya Pradesh: Great Stupa at Sanchi, Kandariya Mahadeva Temple.
- Maharashtra: Ajanta Cave 1, Kailasa Temple at Ellora, Elephanta Cave 1.
- Odisha: Sun Temple at Konark.
- Tamil Nadu: Brihadisvara, Airavatesvara, Shore Temple, Meenakshi Sundareswarar complex.
- Gujarat: Rani-ki-Vav, Modhera Sun Temple.
- Rajasthan: Amber Fort, Hawa Mahal, Jaisalmer Fort.
- Bihar: Mahabodhi Temple, Nalanda Mahavihara.
- Telangana: Charminar.
- Goa: Basilica of Bom Jesus.
- Punjab: Harmandir Sahib / Golden Temple.
- West Bengal: Victoria Memorial.
- Assam: Shiva Dol, Sivasagar.
- Jammu and Kashmir (UT): Martand Sun Temple.
- Kerala: Sree Padmanabhaswamy Temple.

Ancient, medieval, early-modern and selected colonial-era monuments are intentionally included. A complex is identified as a complex, and a specific cave is not represented by a photograph of a different cave.

## Features and data model

The national records use the same detail pages, credited galleries, material/style/element associations, cited comparisons, anatomy, temporal queries, life-event editor and photograph workspace as Karnataka. Data resides in `research/india.json`; separate files hold sourced life events and reviewed image hotspots. Import tasks are idempotent and do not overwrite prior administrator edits.

Migrations 005–006 add date-integrity checks and the `states` dimension. Migration 005 adds the `states` dimension and a foreign key from the existing site state field. Catalogue and map share `states` query parameters; multiple state names can be comma-separated through the API. The state selector includes all 36 states/UTs with record counts. Zero means no record in this collection. State selection narrows the available heritage-location choices. All-record selectors use the revised bounded API limit, so the map and comparison selector include the full collection.

The map is centered on India and clusters the existing approximate site reference positions. Coordinates are discovery aids, not surveyed navigation points or legal boundary data. Basemap tiles need Internet access. Karnataka remains available through `?states=Karnataka`.

## Evidence and uncertainty

Official UNESCO, archaeological, government tourism/district and monument-management references support the dossiers. Each linked material or element has a reference association. Unverified material identifications remain empty. Archaeological groups and individual monuments are distinguished in the notes. Approximate periods are deliberately broader than a single purported founding year.

Sanchi requires BCE-aware storage and presentation. Negative years denote BCE, positive years CE; there is no year zero. The default feature timeline now covers 500 BCE to 2000 CE. These are building-phase ranges, not dates of invention of an element.

Source metadata is committed with the research. Downloaded HTML used during research is an ignored local cache, not redistributed source text. Photograph author, licence, source page, resolution and modification details remain in the media manifest. Wikimedia Commons and independently hosted Flickr originals provide licensed photographs; Flickr licences and original dimensions are checked directly. Real photographs are reviewed before approval; no generated monument imagery is used.

## Research boundaries

The photograph viewer does not fabricate additional detail. Exact influence claims, unverified restorations and complete histories are not implied. Living religious monuments can have ancient foundations and much later surviving fabric. Source-linked life events distinguish principal phases from later additions or recognition where the evidence supports that distinction.

Earlier phase documentation and the v1.0.0 Git tag are historical Karnataka-only snapshots. This expansion is local work and is not automatically pushed or deployed.

## Verification — 1 November 2026

The local database has 60 published monuments, 36 sites, 17 represented states/UTs, 92 approved photographs, 67 reviewed hotspots and 57 sourced life events. The India import contributes 33 photographs, 30 hotspots and 35 events. All original rows in the earlier 17 tables match the saved pre-expansion snapshot, including record IDs and administrator data. Repeated startup preserves all 60 records.

All 24 isolated PostgreSQL integration tests pass, covering state filters, SQL validation, published photographs, all 30 new annotations and event histories, cited cross-state comparison and BCE chronology. The production frontend builds successfully. A full logical backup was restored into an isolated database and all rows in 18 tables matched. Browser review confirmed Delhi filtering and synchronized map parameters, national map coverage of all 60 records, and representative monument pages.

Further work: online deployment and media hosting; deeper source-linked conservation histories; more element close-ups; individual surveyed monument coordinates; and college-template document exports. Photograph uploads and editorial review tools remain separate future work.
