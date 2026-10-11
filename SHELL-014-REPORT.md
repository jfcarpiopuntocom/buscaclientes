# BuscaClientes / FindClients / EncontraClientes · Shell 014
**Owner greenlight:** EN **FindClients**, PT **EncontraClientes**, ES **BuscaClientes**. The owner explicitly confirmed these three names and instructed to preserve the existing vector **pixel for pixel**, NOT redraw its icon. This shell uses `brand-i18n.js` to swap only text; the original `brand-globe.svg` remains unchanged.

## Seven changes
1. International wordmark: exact three names, common original SVG; accessible brand label changes with language.
2. Universal educational kit: original ES/EN/PT free downloadable `kit-libre.md`, public `kit-libre.html`, no login/payment/coupon nor list resale; can later optionally mirror on Gumroad after policy review. Free for everyone, including non-subscribers.
3. A **small Help (?) dropdown** expressing «nuevos comienzos», moves, travel, collaboration and «explora globalmente, conecta localmente» in plain honest professional language. Never disclose internal discussions/policies in the product UI.
4. WhatsApp only when an establishment **explicitly publishes** `contact:whatsapp` or `whatsapp` in OSM; sanitized `wa.me` https link, no inference from a phone, no outbound automation, no drafted message; render count based on real records.
5. Conservative public geocoding guard `geo-safe.js`: cache same location for 24h within tab, >=1.6s gap and max six noncached user lookups/hour/browser; no autocompletion. **This DOES NOT prove service-wide 1req/s compliance and is NOT a commercial SLA**; production paid expansion requires approved backend/proxy/cache or licensed provider. Existing globe locations with known coordinates bypass geocoding.
6. Actual scan status adds an honest count of **observed WhatsApp channels**, sites and establishments after data exists, without fake verified people.
7. EN/PT persistence to dashboard and responsive mobile wordmark/keyboard-accessible help, keeping the original high-tech classical palette, globo without clouds, and protected slogan.

## Source investigation — external NOT wired in this shell
**GeoNames:** [official license and limits](https://www.geonames.org/export/) CC BY attribution, explicit commercial usage, 10k credits/day and 1k/hour per username. For city geocoding, not an alternative to actual commercial POI phones/WhatsApp. Needs username and backend caching for production.
**Overture Maps Places:** [places documentation](https://docs.overturemaps.org/guides/places/), [schema](https://docs.overturemaps.org/schema/reference/places/place/), [license matrix](https://docs.overturemaps.org/attribution/). September 2026 places releases under CDLA Permissive 2.0 / Apache 2.0 with websites, phone, email, socials **when present**; schema **changed**: `categories` removed, now `basic_category` and `taxonomy`. It is a dataset for bulk local/cloud indexing, **NOT** an unlimited free live query API. Need dedicated indexing, provenance/attribution, stale checks and consent/privacy before implementing.
**Wikidata WDQS:** [query manual](https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual/es). Observe User-Agent, Retry-After 429, execution limits; avoid unbounded geospatial query on shared service.
**Nominatim public**: absolute 1 req/s aggregate per application, no systematic mass extraction, no autocomplete. This shell merely reduces **individual browser** calls; cannot guarantee aggregate enforcement across all users. Do not claim payment-grade compliance.
**MCP/CDN:** Browser agent interfaces/MCP do not confer data rights; CDNs distribute frontend assets/datasets but don't confer third-party quotas. Consider commercial paid providers only with explicit permitted use and predictable cost, a future design approval.
**OSM explicit WhatsApp**: allow only explicitly published structured tag. Do not generate `wa.me` from generic phone fields.

## Gates
Run inherited five suites (Integrity, Chromium/WebKit, ATLAS, Terminator, mobile UX) + new eight-case `tests/shell-014.test.mjs`. Verify logo file's exact blob SHA unchanged, app/dashboard v014, mobile scroll width <=8, and Spanish/English/Portuguese help and brand. No alteration of CRM, quota, APIs, payments, background services, or other projects. Publish direct only after green gates, no canaries. Payment command center remains **2/8**, PayPal subscription and entitlement still external blocker.

## Release evidence
PR and specific CI SHA / Pages deployment to be recorded upon actual completion, not anticipated.
