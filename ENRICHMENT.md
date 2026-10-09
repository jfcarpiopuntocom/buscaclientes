# Contact Enrichment — BuscaClientes

The enrichment engine lives in `enrich-worker.js`, is dependency-free and is intentionally **not deployed automatically**.

## What it does
1. User clicks **Find contacts** on a real business with its own website.
2. Server checks valid public HTTP(S) hostname, robots.txt, same-origin restrictions, content type and size.
3. Fetches the homepage and at most two permitted contact/about pages (three total).
4. Extracts published business emails and phone numbers, returning visited URLs as evidence.
5. The client merges these details into the existing prospect / CRM; unverified contacts are labeled as not verified.

## Deployment checklist
- Deploy using Cloudflare Wrangler with `wrangler -c wrangler.enrich.toml deploy`.
- Configure KV (binding CACHE) for at least a 24h cache, and production-grade rate limiting/WAF rules. Do not leave an unrestricted public endpoint.
- Verify robots edge cases, SSRF protection, redirects, text size, timeout, no personal-domain harvesting.
- Set `window.BUSCA_CLIENTES_ENRICH_BASE` in `config.js` to the actual deployed URL (never put secrets there).
- Validate from production domain using tests on websites that have consented or permit automated access.
- No Cloudflare account credentials or deployed Worker URL were available in this session; the frontend button will report that the connector is not yet configured until those steps are complete.

## Constraints
Do not bypass login, CAPTCHA, blocks, robots rules or website rate limits. The tool must not harvest private personal information, crawl unbounded links or bulk scrape directories. This is **source-linked business-contact discovery**, not Google Maps scraping. It can fail harmlessly or yield no contact info when a business blocks automated access.
