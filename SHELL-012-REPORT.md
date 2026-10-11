# BuscaClientes · v1.0 Shell 012 · Ecuador country targeting & CRM data-integrity
**Base:** Shell 011 (main SHA `270f05ea3d9d40ea76fec944e39720137cdccc00`). **Policy:** direct live release *only after* 5 CI gates pass; no canaries. Seven fixes with user-requested geographic precision. Scoped exclusively to BuscaClientes.

## Root cause — Ecuador vs equator
Previously choosing EC only cleared the city field. The globe had no verified country focal point, and typing «Ecuador» was naively expanded to «Ecuador, Ecuador» and submitted as a city, with a 9km Overpass query centered on the first returned geographic location. Geocoding results were accepted without verifying their country or disallowing a named equatorial line. This allowed a misleading focus and false coverage statement. An Ecuador country focus is NOT city or nationwide business-search coverage.

## Seven shipped code improvements
1. **Country focus instead of latitude-zero.** Choosing Ecuador immediately gives the globe a labelled, approximate interior Ecuador anchor **-1.8312°, -78.1834°**. The country HUD distinctly says «PAÍS: Ecuador» and displays real lat/lon. Other countries use a debounced, country-restricted Nominatim country geometry; when unavailable, show pending rather than fake equator focus. This coordinate is a representative anchor, not an official centroid/survey.
2. **Country-only text recognized separately.** Typing «Ecuador» / «Equador» or similar focuses the country; hitting Explore asks to choose a city instead of inventing a 9km national search or modifying a source.
3. **ISO-scoped city geocoding.** Search geocoder and city blur now request candidate matches with `countrycodes=XX` and `addressdetails=1`, rejecting wrong-country, impossible, equator-line, and uncertain results. Stale responses cannot re-focus changed country.
4. **Demo exclusion end-to-end.** Three Austin fictitious records are tagged `demo:true`. App → dashboard excludes demo even when selected. Historic unflagged `example-1…3` are quarantined in opportunity-matrix normalization (without destructive deletion of CRM); no KPIs or map positions from illustrative rows.
5. **Transactional save of a chosen contact.** Quota and durable CRM are staged with snapshots; on quota/storage error, rollback attempted, no optimistic «guardado» or in-memory contact appended. Legacy weekly cache is best-effort only after durable authority succeeded.
6. **Transactional CRM stage and note edits.** The UI computes a replacement snapshot, commits it and only then adopts the new in-memory state; errors are visible and original notes/stage remain.
7. **Cluster pagination.** Groups with more than 15 real places now show an accessible «Mostrar 15 más» control, with correct remaining counts and mobile/keyboard styling. No disappearing 16th contact.

## Gates and evidence
New `geo-scope.js`, `crm-transaction.js`, `tests/shell-012.test.mjs` (13 deterministic checks), Browser QA additions for Ecuador target, country-only search, demo isolation, >15 group; regression test version guards retained. Run 5 GitHub Actions suites (Chromium, WebKit, ATLAS, Terminator, integrity) before publication. Fail closed on red CI.

## Invariants / not attempted
Preserve cloudless 3D Earth, Terminator zero-in, original slogan INSIDE globe, quiet UI, fixed/no diagonal underline, city selection truth Shell008, OSM source attribution, local CRM authority, 7 chosen free contacts/week, independent/chains research, dashboard/atlas evidence caution, safe CSV. No remote sync, user login, subscriptions, Lemon Squeezy checkout, or data erasure. No new paid vendor service. Existing sample-density ≠ demand/profit.
