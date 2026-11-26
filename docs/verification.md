# Correctness and performance review

Reviewed on 26 November 2026 against the 150-monument collection.

## Findings and fixes

| Finding | Corrected behaviour | Verification |
| --- | --- | --- |
| Historical profile links omitted selected state or relationship filters | Catalogue and map links retain both filters. The profile and relationship must match the same junction row. | API regression cases, a cross-profile false-match case, and browser navigation to the filtered Sindhudurg result. |
| Timeline hydrated every monument separately | Timeline reuses the batched catalogue loader; query count stays bounded as records increase. | All 150 records remain present; a regression check enforces at most 12 queries. |
| Life-event lookup hydrated photographs and architectural relationships unnecessarily | Lookup selects only the published building ID before reading events. | At most two queries, with a draft-visibility regression case. |
| Historical connection editor retained edit mode and stale rows | Save resets the connection form; edit can be cancelled; removal refreshes the list; profile slug changes navigate to the new URL. | Disposable local administrator browser checks covering edit, cancel, save, removal and slug changes. No production content was edited. |
| Map dependencies were included on every page | Leaflet and its map component load when the map route opens. | Production entry JavaScript decreased from 536.31 KB to 346.59 KB, before compression; map still renders the synchronized filters and markers. |
| Installed image processor appeared in npm security advisories | Updated sharp to the patched 0.35.5 release. | npm audit reports zero known vulnerabilities; JPEG, PNG, WebP, EXIF rotation and SVG rendering checks pass. |
| Test setup required a pre-running database and could retain process handles | Added an isolated test command that discovers all test files, closes its database, removes its checked temporary directory and exits with the test result. | The command completes with exit code zero and 47 passing tests. |

## Checks

`npm run test:isolated` runs the chatbot, integration and image-processing suites. All **47 tests pass**. The suite includes authentication and CSRF checks, foreign keys, publication visibility, duplicate prevention, transaction rollback, all 150 monument integrations, all historical profiles and the new filter and performance regressions.

`npm run build` succeeds without the previous large-entry-chunk warning. Bundle size is a build measurement, not a claim that every page becomes 35% faster; network and database latency also affect loading.

The patched image processor is documented in the [maintainer's security advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). A clean dependency audit describes the advisory database at review time, not a guarantee about future vulnerabilities.

Historical interpretation and photograph identification still require source review. Automated tests check stored relationships and application behaviour; they do not independently establish historical facts.
