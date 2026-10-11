# Shell 016 — Pricing / GUTSY decision update (2026-10-11)
**Supersedes the provisional 250/week AND 1000/cycle Personal double-cap in the earlier Shell 016 research.**
Owner wants to maximize **perceived value**, launch **Free + Personal** without Enterprise obligation, and stop forcing hands-on setup.

## Current recommendation: Personal $7/month pilot, one generous quota
- **Free:** discover cities/categories and keep 7 *new* public-business contacts/week as currently offered; prior CRM history and exports remain accessible.
- **Personal candidate:** **up to 1,000 DISTINCT newly saved public business records per PayPal billing cycle**. ONE clearly named limit. Not 250/week + 1000/month, no surprise weekly second gate. Unlimited *editing, viewing and re-exporting existing records* (subject to ordinary fair use and storage constraints).
- CRM archive is never deleted on downgrade/cancellation. On expiration, old records remain inspectable/exportable; only new Personal saves stop and revert to Free if that Free entitlement is active.
- Any displayed number refers to **unique save actions, not guaranteed new verified email addresses, leads who replied, or 1,000 newly discovered results**. Real source coverage varies by city.
- This is a **commercial pilot hypothesis**, not an empirically proven optimal price/cap. Run measured cohorts after launch; don't falsely claim GUTSY supplied data we don't have.

## Benchmark research (official sources)
- **Hunter** https://hunter.io/pricing : Free 50 email-finding/verification credits/month; Starter USD 34/mo billed annually. Hunter sells verified B2B contact information, not directly comparable to our public business observations.
- **Bardeen** https://www.bardeen.ai/pricing : Basic from USD 10/mo for 100 credits, Premium USD 50/mo for 1000 credits; row credits include scraper/enrichment logic beyond this product.
- **folk CRM** https://help.folk.app/en/articles/6600210-pricing-plans : Standard USD 30/member monthly includes unlimited contacts, 500 contact enrichments/month; thus putting an *arbitrary maximum on total stored CRM rows* is anti-competitive. Meter only NEW acquisitions, not accumulated CRM.
- **PayPal Ecuador official fees** https://www.paypal.com/ec/business/paypal-business-fees : standard domestic commercial receiving 5.40% + USD 0.30 fixed for USD. Approximate merchant net for USD 7 is USD 6.322 **before** taxes, international factors, currency conversion, refunds, support, operations. Not a guarantee of any specific customer transaction.
- **OSM Nominatim policy** https://operations.osmfoundation.org/policies/nominatim/ : max 1 request/s across entire website; no systematic grid downloading/POI harvesting. Do not sell unlimited bulk source calls or use scraping to bypass terms.

## Six-framework re-score
1. **JTBD**: sell an organized, portable local prospecting notebook, not a contact quota alone.
2. **Value proposition**: clear "From a new city to an organized list of opportunities". Data is public/unverified; empower human-led outreach.
3. **Competitive pricing**: low entry fee is plausible; differentiation is accessible workflow and enormous save headroom, not verified email data.
4. **Behavioral economics / value equation**: one round 1000/cycle beats nested weekly thresholds in clarity, flexibility and perceived autonomy. Unlimited historical CRM and repeat exports increases value without a scraping obligation.
5. **Unit economics**: 1000 saves at $7 means a theoretical $0.007 gross revenue per new save at full utilization. PayPal fee can be >9.6% of $7. Primary variable costs are upstream provider APIs, fraud and support; these **must be measured**.
6. **FMEA/STRIDE**: fraud control requires identity, PayPal subscription verified server-side, idempotent atomic D1 quota, origin safety, external rate budgets. No browser-set premium flag, no paid checkout until end-to-end verified.

## Offer copy ES (launch candidate)
**Pasa de una ciudad desconocida a una cartera de oportunidades organizada.**
Explora negocios con datos públicos, guarda hasta **1.000 negocios nuevos por ciclo** en Personal, anota tus próximos pasos, consulta el dashboard y conserva tu historial. **USD 7 al mes. Cancela cuando quieras: tu cartera y tus exportaciones siguen siendo tuyas.**
Footnote: Los registros proceden de fuentes públicas que pueden ser incompletas; no son correos verificados ni promesas de ventas.

EN: **Go from an unfamiliar city to an organized opportunity pipeline.** Save up to 1,000 new publicly listed businesses per billing cycle, organize follow-ups, view your dashboard, and keep your history. Candidate $7/month. No verified-email or sales guarantees.
PT: **De uma cidade desconhecida para uma carteira organizada de oportunidades.** Até 1.000 novos estabelecimentos públicos guardados por ciclo, histórico preservado, gestão e exportação. Candidato USD 7/mês.

## Launch status
- Cloudflare OAuth confirms the new independent account; D1 migration for identity, subscription, cycle and quota structures **was actually applied 2026-10-11** via Cloudflare API. No real customer records, PayPal secrets or active paid subscriptions. 
- Cloudflare worker `buscaclientes-paypal` still sandbox, checkout disabled. A separate `buscaclientes-shell016` staging Worker was deployed to workers.dev as a GITHUB-BRANCH ASSET PROXY. It does not prove private migration and has not been independently fetched from this assistant environment.
- Cloudflare Access organization created on same account with domain `billowing-glitter-f757.cloudflareaccess.com`; subsequent MCP reads were blocked by safety checks, so **IDP/policies and customer authentication are not yet configured or tested**.
- PayPal account sandbox/live secret credentials and plan ID **are not available to this assistant**. Never claim to have enabled LIVE billing.
- Critical before launch: secure end-to-end identity, PayPal webhook/reconciliation and atomic quota, sources policy and data migration/backups. Do not charge prematurely.
