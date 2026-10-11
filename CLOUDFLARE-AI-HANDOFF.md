# Handoff to Cloudflare Dashboard Assistant — BuscaClientes PayPal

**Scope:** new independent Cloudflare account ONLY. Read-only checks first. Do NOT connect or change the Cloudflare account, application, zones, Workers, D1, KV, R2, secrets, bindings or billing plan used by friendly-123.

## Source of truth
- Repo: https://github.com/jfcarpiopuntocom/buscaclientes
- Draft PR: https://github.com/jfcarpiopuntocom/buscaclientes/pull/19
- Branch: `feature/paypal-isolated-checkout`
- Files: `paypal-worker.js`, `wrangler.paypal.toml`, `paypal-schema.sql`, `tests/paypal-webhook.test.mjs`, `.github/workflows/paypal-guards.yml`, `PAYPAL-SETUP.md`.
- Public website uses GitHub Pages and must not be migrated now. Existing free CRM data and the original SVG must not be modified.
- Never merge the PR or enable PayPal payments as part of this preflight.

## Objectives / permitted actions
1. Check and report which Cloudflare account and plan this session controls, and the Workers and D1 limits. Confirm no existing resources in this account must be touched.
2. Determine whether you can actually create and configure Workers and D1 resources, or if you can only give guidance. Never claim success without verified resource IDs/URLs.
3. If available without upgrading/billing or requesting private credentials, create **one NEW D1 database** `buscaclientes-paypal-ledger` for BuscaClientes only. Initialize it using the exact SQL from `paypal-schema.sql`. Report its binding information without exposing tokens.
4. If you can read the reviewed GitHub branch code or the owner supplies it safely, create **one NEW sandbox-only Worker** `buscaclientes-paypal` with only the separate `PAYPAL_DB` binding. `PAYPAL_ENV=sandbox`. Do not use Live secrets or create subscription plans. The Worker contains a webhook receiver but **checkout and entitlement grants are explicitly disabled**.
5. For initial health check, GET `/api/paypal/health` should return `ok:true`, `checkoutEnabled:false`, `webhookConfigured:false` before secrets are installed. Confirm actual HTTPS `workers.dev` URL and only make a tiny number of health requests. Do NOT register a PayPal Live webhook yet.
6. Run or report unit-test status from GitHub Actions and review minimum privilege, resource bindings, size, request quotas and error handling. If actions are unsupported, return a precise checklist rather than fabricating successful deployments.
7. Do not configure rate-intensive polling, scraping, cron jobs, Workers AI inference, scheduled load tests, analytics exports, extra paid services, or automatic upgrades. Hard stop and seek explicit approval for any change that could charge money.

## Payment boundaries
- No PayPal Client Secret, password, API token or credential may be exposed to chat or committed to GitHub; later secrets must be added via the dedicated Worker's encrypted settings by the authenticated owner.
- No production merchant requests, paid checkout buttons, account entitlements or real charges.
- Paid subscriptions cannot be enabled until product/pricing approved, identity/auth, entitlement backend, cancellation/refund handling, Sandbox end-to-end tests and a verified PayPal Live webhook are complete.
- No deletion of contacts, files or other customer data.
- TinyFish is prohibited; Firecrawl/Crawl4AI are approved only for public research/scraping, not PayPal login.

## Reply format (concise)
A. Actual Cloudflare account identified (confirm it is the new one).
B. Actions actually completed and exact resource IDs/URLs (no secrets).
C. Tests: pass/fail and visible evidence.
D. Free-plan costs/limits and operational risks.
E. Actions blocked, required manual clicks (maximum 1-3), next safe milestone.
