# Shell 015 — Release-ready commercial pathways without fictitious paid service

## Owner mission, Saturday night October 10, 2026
7 micromejoras, launch subscriptions with PayPal Business (or PayPal API if necessary) this evening **only if legally/account enabled** and publish universally free original educational kit on Gumroad. User will take materials to Gamma or other tools. The free kit must remain available to everyone, including never-paying visitors. EN FindClients, PT EncontraClientes, ES BuscaClientes (identical SVG).

## Seven delivery features
1. **Prominent but restrained Plans link** in app header and footer, ES/EN/PT.
2. **Independent honest plan comparison** at `planes.html`: Free is functional; Personal/Teams displayed as 'in preparation' rather than a fictional premium product; mobile/keyboard accessible.
3. **Strict PayPal recurring URL validator** in `payment-launch.js`. Reject one-time/paypal.me, sandbox, HTTP, credentialed URLs, plan ID mismatch, extra params, lookalike host. No generic HTML to copy that might charge twice.
4. **Fail-closed plan config**: public defaults `live=false`, verified account false, entitlements backend ready false, no price or links. Button ONLY after merchant-approved price, a genuinely verified PayPal Live recurring link and a deployed back-end that will honor paid rights.
5. **Free kit discovery** from pricing and homepage, with 0 payment obligations. Gumroad listing materials prepared separately for user/Gamma; no claim of Gumroad upload until sign-in.
6. **Human cancellation language** on pricing page, and product truthfulness: 7/week browser-local, data may be incomplete, subscription functions not yet enabled. No earnings guarantees.
7. **ES/EN/PT QA and launch operational runbook** with PayPal Business no-code dashboard + alternative subscription REST API, Sandbox/live, permission and refund, webhook signature/idempotency, service account and paid enforcement. CI new shell015 unit negative cases and Chromium/WebKit mobile.

## Independent external evidence
PayPal Ecuador [Merchant Subscription FAQ](https://www.paypal.com/ec/cshelp/article/merchant-subscription-faqs-help289?locale.x=en_EC): Sales > Subscriptions > Create Plan, can generate shareable link, but feature market/account availability varies. [Official dashboard flow](https://developer.paypal.com/subscriptions/dashboard/use-dashboard) revised Oct 1, 2026. [PayPal lifecycle webhooks](https://developer.paypal.com/subscriptions/webhooks/): ACTIVATED, CANCELLED, EXPIRED, SUSPENDED, payment sale complete/refund/reverse.
Gumroad [free products](https://gumroad.com/help/article/133-pay-what-you-want-pricing): amount $0 and PWYW, no fee for free download. [Prohibited goods](https://gumroad.com/prohibited): bulk marketing lists/services and spam tools are restricted. Public original educational kit is distinct from PayPal app subscription, not a disguise.

## Not yet done
- No PayPal Business account / recurring subscription Live link access confirmed in this chat.
- No seller Gumroad signed-in browser context; can't post product without owner's sign-in.
- No user-approved paid tier price and deliverables, no entitlements, no backend or verified billings; no real customer charged.
- No data source scaling guarantees Nominatim; paid traffic needs global quota/compliant vendor.
- User-created Gamma material and PDF to share as sandbox file, not revenue entitlement.
- Launch War Room for subscriptions remains 2/8 verified, unchanged by adding preparatory front end.

## Protected invariants
Preserve source OSM laws and ToS; no sending messages, no inventing phone/WhatsApp, no cloud repaint; Ecuador within Ecuador; globe & zero-in quiet; slogan within globe; no orange underline headlines, original SVG blob, CRM never erased, 7/week free local, no changes to unrelated systems. No canaries for BuscaClientes; don't release a bad candidate before all 5 CI checks green.
