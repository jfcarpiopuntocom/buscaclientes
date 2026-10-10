# BuscaClientes — Three complete redesigns + World Intelligence MCP

STATUS: CANDIDATES ONLY. No deployment or merge.

## A. ORBITAL — Discovery
The original three quick tools move into the left hero, while the existing real globe remains the other half. Green/cyan cinematic atmosphere.

## B. ATLAS — Action
The actual functional search form is placed beside the original globe, not copied; the results and CRM remain unchanged. Indigo, steel blue and coral visual language.

## C. NEBULA — Exploration
The existing WebGL globe and original Periscopio are unified into one mission console. Violet/indigo/magenta with no permanent extra boxes.

All share the exact original BuscaClientes HTML and business logic. Separate CSS files change the compositions. Preview with choice-preview.html?choice=a, choice=b or choice=c. The main public app is untouched. The original globe, targeting animation, random search, Periscopio, OSM/Overpass, Contact Scout, Radar, saved CRM, sorting and exports remain.

## World intelligence actually implemented

1. Geographic context uses World Bank country statistics with year, unit and source; the optional Census county comparison service is coded but not yet deployed/configured. Country data never masquerades as city-level evidence.
2. Commercial signals query GDELT for sector/place, displaying unverified source-linked articles only upon deliberate interaction. No automatic outreach.
3. Business dossiers reveal source evidence directly in the existing ownership badge and can research public company-name news only after a specific click. No contact emails or CRM notes are sent.
4. Conservative chain/independent classification preserves explicit uncertainty; it cannot infer legal ownership from a brand alone.

## Genuine World Intelligence MCP code and current limits

- world-intel-bridge/server.mjs is an MCP client using the official JavaScript MCP SDK. It launches the upstream Python world_intel_mcp.server via stdio, discovers and calls ONLY intel_world_bank_indicators and intel_gdelt_search, normalizes sources and years, and returns read-only JSON.
- intelligence.js now prioritizes this MCP gateway when a trusted HTTPS gateway base is configured; otherwise it uses direct World Bank and GDELT APIs. Failed MCP requests degrade to direct sources, never imaginary figures.
- The bridge is NOT installed, running, or deployed anywhere. GitHub Pages is static and cannot host the Python stdio MCP process. It requires a separate secured server, reverse proxy, rate limiting and authorization. No plaintext credentials or keys should be included in public JavaScript.
- The gateway binds localhost by default. Do not connect it to public website users without separately approved HTTPS BFF, WAF/abuse protections and review of data source terms.
- Do not reuse or interfere with n8n, OpenAI tunnel or friendly-123. The bridge does not permit AOI mutations, mail or any write-capable MCP tools.

## Gates

- Automated Node syntax and offline tests plus visual Chromium desktop/mobile screenshots for each A/B/C choice.
- Required before production: actual upstream connectivity, browser CORS, offline failures, saved CRM, contacts, CSV, user approval, Chromium + WebKit and a hosted, security-reviewed MCP endpoint if MCP is to be public.
- Nothing automatically merges into main. The final design choice remains the owner's decision.

References:
https://github.com/marc-shade/world-intel-mcp
https://modelcontextprotocol.io
https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
