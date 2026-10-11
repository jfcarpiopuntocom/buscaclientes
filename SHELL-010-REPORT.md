# BuscaClientes Shell 010 — Elegance, not tricks (2026-10-10)
## Authority and scope
The owner explicitly corrected prior interpretation: **remove the orange underline from the hero HEADLINE**, not just the logo. No orange underline may decorate the wordmark either. Preserve useful orange rules elsewhere but **strictly horizontal**. Visual objective: classy, futuristic, restrained, legible—not teenager/tilted or decorative for its own sake.

## VendorsMap learning — read-only, no copying
Source: https://vendorsmap.com/map · https://vendorsmap.com/blog/how-to-use-vendorsmap · https://vendorsmap.com/faq (consulted 2026-10-10).
VendorsMap is a map-first marketplace of real event **opportunities** for vendors/organizers/shoppers. Documented UX: map pins colored by event type (teal market, blue craft fair, red festival, purple pop-up, green store); marker clustering; search for place/event/store; compact visible active filter chips; dates/fees/deadlines/capacity; profile reused in applications; status tracking in dashboard; external application links clearly distinguished. Product evidence: facts such as booth fees, application deadlines and commission split where available; users can act instead of merely browsing.
**Adaptation roadmap, not implemented in this visual-only shell:** (A) map pin clustering for dense observed OSM sites, with truthful counts; (B) filters as dismissible chips that reflect current query, even on mobile; (C) business card with verifiable source, last checked and clear call to action (website / save CRM); (D) save-to-CRM status with no phantom "apply"; (E) optional spatial search by distance or postal code when actual geocodes exist. Explicitly DON'T copy listings or claim event applications, verified demand/ROI, partner status, mapping API access, proprietary event types.
**Preserve scope:** Users of BuscaClientes find public business records, not event booth assignments. No VendorsMap API/data was ingested.

## Shell 010 actual implementation
1. Remove old rotated orange pseudo-underline from `shell-005-editorial.css` at the origin.
2. Remove orange underlining from dashboard hero.
3. Ensure section rules remain horizontally aligned; 0deg no skew or slanted badges.
4. Restrained hierarchy: typography and contrast, not animation/jitter.
5. Reduce gratuitous neon/glow in search panel/CTA and radar cards; keep effective high-tech accent.
6. Harmonize print-light dashboard versus deep-navy search app; preserve their respective layout roles.
7. Protect mobile, keyboard focus, reduced motion, and UI contracts with new computed-style browser tests.

No changes to current country, city, source fetch, quotas, geocodes, WebGL, user records, atlas, Porter, privacy, payouts or payment processing. `shell-010-elegance.css` is isolated and can be reverted cleanly.

## Supporting handoff
The uploaded **Handoff accionable: cobros de BuscaClientes desde Ecuador** was reviewed, NOT confused with an authorized checkout: Lemon Squeezy provisional first choice for Ecuador/PayPal; seven tasks T1–T7, open questions O1–O8, cost model, future provider adapter. Work items should be tracked in Notion and no premium entitlements created in browser state. Live store, KYC, KYC data, payment keys, payouts and simulated checkout screenshots remain unverified and were not modified here.
## QA/Release
Validate `node --test`, CI existing inherited gates, computed headline styles Chromium/WebKit/mobile/desktop, original CRM and globe lock. Do not claim tested until actual CI result. After green user asks fast live release for this specific app without canaries; publishing authorization follows latest user instructions.
