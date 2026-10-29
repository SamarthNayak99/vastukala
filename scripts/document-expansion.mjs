// Finalize documentation after check-expansion and the integration suite pass.
import {readFile,writeFile} from 'node:fs/promises';
const update=async(file,edits)=>{let text=await readFile(file,'utf8');for(const[from,to]of edits){if(!text.includes(from))throw new Error(`Expected documentation text missing in ${file}: ${from}`);text=text.replace(from,to);}await writeFile(file,text);};
await update('README.md',[
 ['The first local release contains five researched Karnataka monuments and nine credited, high-resolution photographs.','The local collection contains 30 researched Karnataka monuments across seven locations and 59 credited, high-resolution photographs.'],
 ['downloads credited pilot photographs','downloads credited catalogue photographs'],
 ['imports missing pilot records','imports missing catalogue records'],
 ['- `research/pilot.json`: structured building research and claim references.','- `research/pilot.json` and `research/expansion.mjs`: structured building research and claim references, combined by `research/dataset.mjs`.\n- `research/expansion-notes.md`: identification choices, disputed dates and media workflow.'],
 ['reviewed pilot images','reviewed catalogue images'],
 ['The media script retries interrupted downloads and reuses completed files.','The media script retries interrupted downloads, reuses completed files, spaces new requests, and honours Wikimedia retry periods. A fresh full download can take some time.'],
 ['Import missing pilot records','Import missing catalogue records'],
 ['The first release is a five-record pilot. Expansion to approximately 30 monuments, deeper dossiers, additional element close-ups, final submission formatting, and online deployment follow in later phases.','The collection contains Hampi (8), Pattadakal (7), Badami (6), Aihole (6), Belur (1), Halebidu (1), and Somanathapura (1). The 25 additions each have two reviewed photographs. Deeper dossiers, further element close-ups, final submission formatting, and online deployment remain later work.']
]);
await update('plan.md',[
 ['Status: Five-building local pilot implemented and verified.','Status: 30-building local collection implemented and verified.'],
 ['Candidate allocation (subject to evidence and image availability):','Implemented allocation (five pilot records plus 25 approved additions):'],
 ['This is a research shortlist, not a verified seed dataset. Resolve spelling variants into aliases and document precise record boundaries before import.','This allocation is implemented in the combined research dataset. Spelling variants are aliases and precise record boundaries are documented in research/expansion-notes.md.'],
 ['The initial source register has now been extended into research/pilot.json, with five sourced building records. Nine photographs have been downloaded, credited, visually reviewed, and prepared for local display. Other shortlisted buildings remain research candidates. See research/media-manifest.json and docs/progress.md for the pilot\'s coverage and limitations.','The source register is implemented in research/pilot.json and research/expansion.mjs: 30 sourced building records across seven locations. All 59 photographs have been downloaded, credited, visually reviewed, and prepared for local display. See research/media-manifest.json, research/expansion-notes.md, and docs/progress.md for coverage and remaining research gaps.'],
 ['Nine isolated integration tests pass;','Twelve isolated integration tests pass;'],
 ['### M6 — College submission package','Status: complete for the approved 30-record allocation. Each addition has two reviewed photographs, aliases, cited architectural elements, and the existing catalogue/comparison/admin features. Unknown materials and disputed dates remain explicit. See docs/progress.md for verification and remaining gallery gaps.\n\n### M6 — College submission package']
]);
await update('docs/synopsis.md',[
 ['Vastukala is a proposed web application','Vastukala is a web application'],
 ['Each building record will connect','Each building record connects'],
 ['The application will allow visitors','The application allows visitors'],
 ['An authenticated administrator will add, edit, and publish records.','An authenticated administrator can add, edit, and publish records.'],
 ['PostgreSQL will store','PostgreSQL stores'],
 ['Express and Node.js will provide','Express and Node.js provide'],
 ['React will provide','React provides'],
 ['Development will begin locally, followed by online deployment in a later phase.','The application runs locally, with online deployment planned for a later phase.'],
 ['Requirements analysis will be followed by an ER model, relational mapping, and normalization.','Requirements analysis, an ER model, relational mapping, and normalization guided the implementation.'],
 ['A five-building pilot will validate','A five-building pilot validated'],
 ['Information will be gathered','Information is gathered'],
 ['Photographs will be selected','Photographs are selected'],
 ['validated seed imports will populate','validated seed imports populate'],
 ['API and interface development will proceed in stages, followed by database, functional, and visual verification.','API and interface development proceeded in stages, followed by database, functional, and visual verification.'],
 ['A separate SQL demonstration file will explain','A separate SQL demonstration file explains'],
 ['The initial collection will focus on monuments in Hampi, Belur, Pattadakal, Badami, and Aihole, with additional coverage of Halebidu and Somanathapura.','The local collection contains 30 monuments in Hampi, Belur, Pattadakal, Badami, Aihole, Halebidu, and Somanathapura.'],
 ['The first version targets approximately 30 curated monument records.','The local version contains 30 curated monument records and 59 reviewed photographs.'],
 ['This is a proposal; it does not claim the application has already been implemented.','The local application is implemented; online publication and college-specific document formatting remain later steps.']
]);
await update('docs/progress.md',[
 ['# Implementation progress — 27 October 2026','# Implementation progress — 28 October 2026'],
 ['## Known boundaries of this pilot','## Current boundaries'],
 ['- Five records are present; the approximately 30-record catalogue is the next content milestone.','- The approved catalogue allocation is complete: 30 monuments across seven locations.'],
 ['- One photo is available for Aihole; galleries with 3–5 reviewed views for every building are still a target.','- Durga Temple at Aihole retains one photograph. Each of the 25 additions has two reviewed views; galleries with 3–5 reviewed views for every building are still a target.'],
 ['Expand verified data across the five core clusters, then Halebidu and Somanathapura. Prioritize missing material evidence, exterior/context photographs, and architectural element close-ups.','Review the expanded local collection with the user. Prioritize missing material evidence, deeper architectural descriptions, and further element close-ups.']
]);
await update('docs/database-design.md',[
 ['With five rows, sequential scans are often cheaper;','With 30 rows, sequential scans are often cheaper;']
]);
await writeFile('docs/progress.md',(await readFile('docs/progress.md','utf8'))+`\n## Approved catalogue expansion — 28 October 2026\n\nAdded 25 individually documented monuments: Hampi +7, Pattadakal +6, Badami +5, Aihole +5, Halebidu +1, and Somanathapura +1. The live collection now contains 30 records: Hampi 8, Pattadakal 7, Badami 6, Aihole 6, Belur 1, Halebidu 1, and Somanathapura 1.\n\nFifty additional openly licensed photographs were downloaded and visually reviewed, bringing the collection to 59. Each addition has a cover and a second view, original-resolution metadata, author/licence links, and responsive local copies. Nearby monuments, plans, and ambiguous image identities were excluded. Wikimedia Retry-After periods were respected during preparation.\n\nAll additions use the existing detail galleries, combined filters, comparison, dashboard and administrator forms. Home-page discovery links now follow the published locations. Disputed dates are labelled and cited; material identifications remain unknown where the references do not support them. See research/expansion-notes.md.\n\nVerification: twelve integration tests passed in an isolated PostgreSQL database; the production build passed; the live collection and new detail/gallery were reviewed in the browser. A separate expansion check verified exact location totals, two photographs per addition, supporting citations/elements, and preservation of all existing building records and associations against the pre-import backup.\n`);
await writeFile('research/resources.md',(await readFile('research/resources.md','utf8'))+'\n## Implemented collection\n\nThe original discovery notes above are retained as research history. The selected building references are now recorded in `pilot.json` and `expansion.mjs`, and all 59 selected image sources, licences, dimensions and review decisions are in `media-manifest.json`. See `expansion-notes.md` for the 25 additional monuments and identification decisions. Unselected leads above remain unreviewed.\n');
console.log('Updated collection documentation.');
