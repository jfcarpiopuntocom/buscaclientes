# BuscaClientes — World Intelligence: isolated candidate

**Status:** feature branch only. Nothing deployed, no production workflows touched. World Intelligence MCP is a research input, **not installed in BuscaClientes**.

## Four delivered workstreams

1. **Territorial context:** intelligence.js queries World Bank growth, CPI inflation and population at country level with year, source and unit. Optional intelligence-territories-worker.js compares U.S. counties using Census CBP 2023 establishment counts and ACS 2023 population, within a single NAICS 2-digit class. Census now requires a key; this server adapter is **not deployed** and the client reports unavailable until it is configured and approved. An aggregate county ranking is not a ranking of prospect companies and country macro statistics must never masquerade as city data.
2. **Commercial signals:** GDELT DOC on-demand lookup of sector + place, source-linked news candidates, explicit unverified status. A story never automatically triggers email or outreach.
3. **Corporate evidence:** source-backed OSM record, website and brand Wikidata references in the context panel. A further explicit click initiates a public-business-name GDELT lookup; no email, phone or CRM notes go to outside providers, and a matching name is not proof of company identity. SEC EDGAR research must wait for an entity with an actually verified SEC CIK/ticker rather than fabricate a corporate match.
4. **Chain/independent:** conservative classification using explicit franchise/branch/known chain/operator signals. Brand tags alone are insufficient; conflicts become unknown. Original CRM saved objects are not migrated or edited.

## What changes in the interface

Only **one closed-by-default disclosure** beneath existing Radar tabs; no query fires on page load. The existing globe, hero, Periscopio Vivo, filters, lead cards, CSV and local CRM remain. The new evidence section supports ES/EN/PT and contains source links and explicit errors instead of invented values. Business-specific news requires a separate click.

## Source and security constraints

- The World Bank Indicators API allows keyless requests; Census CBP uses a secret API key held **server-side only** by the optional worker.
- Do not deploy the optional worker without explicit approval, a strict allowed origin, abuse rate limiting, budget/quotas and 403/429/503 handling.
- GDELT and World Bank calls from browsers may encounter CORS, outages and quotas. Their current live behavior is **not validated**, and failure must display unavailable.
- The optional Census layer compares county aggregates at a broad two-digit NAICS level; Census CBP represents establishments with paid employees, not all self-employed operators.
- Never reuse the Cloudflare deployment that protects friendly-123. Never add secrets to config.js, GitHub Pages or public JavaScript.
- Intelligence components never write to localStorage or send mail. The existing bc-crm-durable-v1 data remains unchanged.
- A source URL demonstrates provenance, not legal ownership. Uncertainty is an accepted result; never manufacture a lead score.
- Social/news sources contain untrusted text. Escape before displaying; no prompt/tool execution driven by web content.

## Files and acceptance

intelligence.js: standalone client analytic and HTTP adapters.
intelligence-ui.js: progressive-disclosure user interface.
intelligence-territories-worker.js: optional Census intermediary (not deployed).
index.html: only three integration seams; original logic remains.
tests/intelligence.test.mjs: offline contract tests.
.github/workflows/intelligence-ci.yml: CI syntax checks and offline tests.
Original tests/prebeta.test.mjs: preserved.

Acceptance gates: run Node syntax + full offline suite; verify real browser worldbank and GDELT results with valid source dates; simulate upstream failure; inspect desktop/mobile layout in ES/EN/PT; test CRM persistence, notes, sorting, CSV and downloads. **A passing offline suite does not prove end-to-end network access.**

## Three optional UI refinement directions (NOT applied)

**A. Context lens:** retain the current closed disclosure, adding one tiny source-count indicator only after opening. One click exposes evidence; the radar stays visually intact.

**B. Evidence drawer:** show the same information in a slim right-hand drawer on desktop and a bottom sheet on mobile. The original lead list remains primary; do not add another permanent column.

**C. Compare territories:** a compact Compare markets chip beside the location selector; compare only two regions with complete, matched Census year/NAICS/population provenance. Never map invented county opportunity scores.

These alternatives are proposals only. Do not select one without the product owner's decision.

## References

- World Intelligence MCP: https://github.com/marc-shade/world-intel-mcp
- World Bank Indicators API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
- Census CBP 2023 API: https://api.census.gov/data/2023/cbp/examples.html
- GDELT DOC 2.0: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
- OSM attribution: https://www.openstreetmap.org/copyright
- Existing product canon: https://app.notion.com/p/3f41642b67f381f1ad3dda1501ce2475

**Release status:** code in feature branch, no merge and no production deployment.