# BuscaClientes Shell015 — PayPal/Gumroad tonight runbook (internal)
**Do not publish customer checkout until services and entitlements exist.** App is free with a seven-selected-contacts/week browser-local quota. The product doesn't yet have server-side Premium access. This document is internal preparation, not a customer-facing sales promise.

## 1. Two independent tracks
- **PayPal Business recurring charge**: open https://www.paypal.com/ec/cshelp/article/merchant-subscription-faqs-help289?locale.x=en_EC and https://developer.paypal.com/subscriptions/dashboard/use-dashboard. Confirm Business account supports Sales > Subscriptions > Create Plan in this Ecuador account. Do not assume eligible merely because PayPal has country help.
- **Free educational kit**: publish original free resource on Gumroad at $0 / pay-what-you-want. **No premium software entitlement, no email list or leads database bundled.** Never use Gumroad to route a prohibited app sale out to PayPal.

## 2. Approval before any charge
Exact approved service deliverable; monthly price/currency; term; billing frequency; cancellation policy; refund policy; supported countries; source-data usage; terms/privacy review; legitimate standalone Premium feature; backend entitlement check and authorization; PayPal AUP compliance. **Never invent these.**
PayPal Business lets sellers create a plan and generate a web link or copy button code. Use the **native share link** when the account actually provides one. The local validator currently only accepts the documented `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-...` path. Other authentic PayPal link shapes need explicit verification in the tool before adjusting the code; never broaden to `paypal.me` one-time payment or `www.paypal.com/ncp/payment` as proof of a *subscription*.

## 3. Why not just paste the link?
The app cannot tell who paid from a PayPal link. The backend must tie active PayPal Subscription ID + verified buyer authentication to server-side entitlement, enforce paid features on that backend, react to refunds/expiry, and expose cancellation instructions. **No activation based on URL query, cookie, a checkbox, customer-supplied screenshot or client storage.**
Preferred minimum architecture: Cloudflare Worker + durable DB/D1 for subscriber records with external Auth identity; server-to-server PayPal API or signed webhook **verified via PayPal official endpoint** with keys/secrets in Worker bindings (not client). Protect replay/event duplicates and out-of-order delivery, and never delete any local CRM data when a subscription changes. Test Sandbox subscription activation, renew, cancel, refund, retry, and webhook replay.

## 4. Customer page prepared
`planes.html` is EN/ES/PT and accurately shows Free as available and Personal/Teams as *coming soon*. `payment-plan-config.js` defaults to `live=false` and blank links. Display of subscription button requires 3 explicit opt-ins (live, account verified, backend entitlements ready) + authorized accurate recurring price + strong PayPal URL validation. It currently MUST show **no checkout**.

## 5. Gumroad free-product steps
1. Sign in to Gumroad creator account.
2. Create **digital product**, title «Un mundo de posibilidades, una ciudad a la vez | Kit gratuito ES/EN/PT».
3. Choose $0 (PWYW) for everyone; no coupon, no requirement to buy app.
4. Attach final original PDF and optionally source markdown / worksheets. Upload cover from authorized brand icon asset (do not redraw original logo).
5. Description: «Guía educativa gratuita para explorar una ciudad nueva, identificar establecimientos en fuentes públicas, elegir cinco lugares relevantes y acercarte con respeto. Incluye ejercicios y plantillas, en español, inglés y portugués. No contiene listas de contactos, scraping de terceros, promesas de ingresos ni herramientas de envío masivo. No requiere comprar ninguna app.»
6. Settings: public, no misleading earnings promises, respect Gumroad's free-product size limits and prohibited-product policy. Publish only once authenticated and user approves the final listing.
7. Copy actual Gumroad product URL into the site **only after verified**. Current kit download already works independently of Gumroad.

## 6. Tonight test matrix
- The unauthenticated browser cannot see a PayPal checkout button.
- A fake paypal hostname `paypal.com.evil.test`, non-recurring PayPal.Me, sandbox URL, HTTP, embedded credentials, non-subscription payment and malformed plan IDs cannot enable paid buttons.
- Even a valid link cannot show until all three opt-ins + entitlement server ready + approved price are true.
- Language switching and mobile overflow; kit always free and accessible.
- Legacy shell 005–014 and Chromium/WebKit/mobile; maintain icon blob unchanged.
- No external merchant account write until owner provides account access via secure consent/login. Never store API secret in GitHub Pages.
