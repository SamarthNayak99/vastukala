# India-wide expansion and historical profiles

The collection contains **150 monuments at 123 heritage locations across 35 states and union territories**. The original 100 monument records are retained. This expansion adds 50 records, 94 reviewed and openly licensed photographs, 50 image hotspots, and 46 separately sourced events.

Lakshadweep remains outside the present collection. This is a curated architectural archive, not an exhaustive national inventory. Chandigarh's Capitol Complex is explicitly identified as a modern heritage exception.

## Coverage of the new batch

| State / UT | Added records |
| --- | --- |
| Himachal Pradesh | Hadimba Devi Temple, Masrur Temples, Tabo Monastery |
| Ladakh | Alchi Monastery, Thiksey Monastery |
| Uttarakhand | Kedarnath, Badrinath, Katarmal Sun Temple |
| Haryana | Sheikh Chilli's Tomb |
| Chandigarh | Capitol Complex |
| Punjab | Gobindgarh Fort |
| Jammu and Kashmir | Pari Mahal, Avantiswami Temple |
| Assam | Kamakhya, Rang Ghar, Charaideo Moidams |
| Meghalaya | Nartiang Durga Temple |
| Manipur | Kangla Fort |
| Tripura | Ujjayanta Palace, Neermahal, Unakoti reliefs |
| Nagaland | Kachari ruins at Dimapur |
| Sikkim | Pemayangtse Monastery, Rabdentse ruins |
| Arunachal Pradesh | Malinithan |
| Mizoram | Sibuta Lung |
| Chhattisgarh | Bhoramdeo, Lakshmana Temple at Sirpur |
| Jharkhand | Maluti temples, Jagannath Temple at Ranchi |
| Bihar | Sher Shah Suri's Tomb |
| West Bengal | Hazarduari Palace |
| Odisha | Mukteshwar Temple at Bhubaneswar |
| Madhya Pradesh | Bhojeshwar Temple, Datia Palace |
| Uttar Pradesh | Dashavatara Temple at Deogarh |
| Gujarat | Adalaj Stepwell, Lothal |
| Maharashtra | Raigad, Daulatabad, Sindhudurg |
| Tamil Nadu | Gingee Fort |
| Kerala | Bekal Fort |
| Andhra Pradesh | Undavalli Caves |
| Telangana | Thousand Pillar Temple |
| Goa | Se Cathedral |
| Rajasthan | Junagarh Fort, Gagron Fort |
| Dadra and Nagar Haveli and Daman and Diu | Diu Fort |
| Puducherry | Sacred Heart Basilica |

## Research and media

`research/india-150.json` contains monument descriptions, sites, classification relationships and references. Source keys resolve to primary institutional sources where available; Wikipedia is explicitly identified when used as a secondary reference. The separate event and hotspot JSON files are imported by the existing evidence seed workflow.

Photographs retain individual Commons source pages, authors and licences in the media manifest. Each has four prepared WebP display sizes, without enlarging the original. Search results depicting the wrong cathedral, a neighbouring temple or unrelated structures were excluded during visual review. Some sites have only one suitable reviewed image; additional views are not fabricated to meet a numerical target. Interpretation-board and interior-sculpture views have explicit captions.

Unknown construction dates remain NULL. A missing event means that no separate dated event is documented here. Legends do not establish a building date. Sibuta Lung uses an explicitly approximate locality reference point on the map; its individual surveyed coordinates remain unknown.

## Empires and historical groupings

The Empires directory contains **57 profiles and 120 sourced monument relationships**. Its labels distinguish empires, dynasties, kingdoms, sultanates, a confederacy, colonial administrations, a civilisation, a chiefdom and a patron family. Indus civilisation is not misrepresented as a known empire. Unakoti's pre-Manikya reliefs remain unassigned to Manikya construction.

Profile dates describe the monument phases represented in the collection, not a dynasty's complete lifespan or claimed territorial extent. A historical-context relationship records a documented period, tradition or political association; it is not proof of a named royal commissioner. Construction, patronage, addition and restoration are separate relationship types.

Migration 008 adds:

- `empires`: historical profiles with nullable, ordered date ranges.
- `empire_sources`: reusable references for each profile, with a composite primary key.
- `building_empires`: a monument–profile junction containing relationship type, evidence, source and optional dates.
- `empire_monument_summary`: a view counting distinct published monuments for each profile.

Five additional foreign keys bring the permanent schema to 23 tables and 27 foreign keys. The new indexes support profile-to-monument lookups and reverse reference lookups. Existing records, administrator edits and deleted curated associations are preserved by seed-task bookkeeping.

## Website integration

- `/empires`: search profiles by name or region and filter by historical grouping.
- `/empires/:slug`: read history, architecture and references; filter connected monuments by state and relationship type.
- Catalogue and map accept the same `empires` filter. Counts refer to distinct published monuments.
- Monument pages display historical connections with the evidence for each claim.
- Statistics include historical groupings. The chatbot retrieves association evidence and source references alongside public monument records.
- Logged-in administrators can create or edit profiles and add, edit or remove cited associations on these pages. Mutations require a session and CSRF token; invalid references, duplicate claims and reversed dates are rejected.
- DBMS Lab includes a guided historical-relationships lesson, samples of all three tables, and a ninth vector ER diagram. The schema explorer grows to fit its 19 public tables.

All collection selectors now request up to 200 records, so the previous 120-record ceiling does not hide the last 30 monuments. Guided SQL remains bounded and read-only; arbitrary SQL is not accepted.

## Import and verification

Apply migrations, fetch prepared media and run `npm run db:seed`. Gallery import precedes hotspot import, because Alchi's reviewed annotation uses its detail photograph. Fresh local clusters use UTF-8, preserving photographers' names correctly.

Regression checks cover all monument detail pages, comparisons, anatomy, timelines, image assets, state filtering, profile counts, association editing, source constraints, CSRF and rollback. Production migration uses an ignored local snapshot and checks that all pre-existing catalogue rows remain unchanged.

Catalogue pages hydrate their selected IDs with a fixed set of eleven queries, rather than issuing a separate set per monument. The regression suite passes all 42 checks after this change.
