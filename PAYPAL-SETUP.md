## Global tooling override — 2026-10-10
Owner instruction: **Do not use TinyFish again** for this or any other project. Do not initiate TinyFish profile or login flows. Prior references are superseded. **Primary approved scraping/research alternatives: Firecrawl** (https://github.com/firecrawl/firecrawl; hosted free tier has credit limits, self-hosted differs in features) **and Crawl4AI** (https://github.com/unclecode/crawl4ai; free self-hosted/local, optional paid cloud). Playwright + agent-browser remain useful for deterministic interactive QA, not a replacement for business-account authorization. The prior guessed name "PhotoShot" was incorrect. For PayPal, use authenticated authorized tools and never claim an authenticated session can be controlled without confirming real tool access. Neither crawling tool grants PayPal credentials or authenticated control. Never touch friendly-123 Cloudflare resources.

# BuscaClientes — PayPal isolation & setup checklist

**Status:** isolated code on a review branch only. NOT deployed, NOT accepting money, NOT granting premium access.

## Safety rules
- Never modify or deploy friendly-123, or reuse its Cloudflare Workers, D1, KV, R2, routes, domains, tokens or service bindings.
- Never place the PayPal Client Secret in GitHub, conversations, logs, frontend JavaScript or a Wrangler `[vars]` block.
- Cloudflare secret variables belong to the new Worker ONLY: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`.
- Create a separate D1 database named `buscaclientes-paypal-ledger` and bind as `PAYPAL_DB`. Run `paypal-schema.sql` on that database alone.
- Set Cloudflare Worker name `buscaclientes-paypal` and verify the available `*.workers.dev` hostname, not an assumed one.
- Dashboard > PayPal Developer > Apps & Credentials > Live > your app > Webhooks > Add webhook. Use actual Worker origin + `/api/paypal/webhook`. Register supported event names declared in `paypal-worker.js`. Copy resulting Webhook ID to Cloudflare secret.
- **Important:** New worker currently responds 503 for create-order and capture-order. It DOES verify and durably store PayPal webhook events when configured. It deliberately does **not** activate accounts, call orders, or capture payment. This prevents taking money without an entitlement and refund workflow.
- Before enabling purchases: decide product prices, create independent accounts/auth and entitlements schema, server-side price validation, approval/capture implementation, correct order-customer association, durable payment-state machine, duplicate order/capture handling, refunds/reversals, rate limits, tests, and real sandbox E2E checks. Then add Live gate.
- PayPal Live API origin is https://api-m.paypal.com. Use sandbox API with sandbox credentials in a separate staging deployment, never mix modes.
- Confirm Cloudflare costs/limits and isolate usage to this Worker before deploying, avoiding contention with friendly-123.

## Beginner PayPal checklist
1. Open https://developer.paypal.com/dashboard/applications/live and sign in to your PayPal Business account.
2. Select your BuscaClientes app (or create a Merchant app).
3. Locate Client ID and Client Secret. Keep Secret private; paste it ONLY into new Worker's Cloudflare Secrets interface.
4. AFTER deploying the isolated webhook receiver, register its verified public URL in PayPal Live Webhooks.
5. Select checkout/order and capture events; PayPal gives you an ID beginning `WH-`; store it as `PAYPAL_WEBHOOK_ID` in the same Worker.
6. Test with PayPal's webhook test tools, then check D1 persistence and replay/idempotency. Do not make a real charge while the create/capture endpoints are intentionally disabled.

## Current code limits
- Stores verified webhook payloads including any fields supplied by PayPal. Restrict database access and define retention rules before live use.
- No billing frontend integration or account privileges yet.
- Do not merge without code review and tests.
