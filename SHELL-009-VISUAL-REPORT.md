# BuscaClientes Shell 009 — visual candidate (2026-10-10)
**Approval:** user explicitly authorized next shell with seven improvements. **NOT approved to merge/deploy** under current greenlight protocol. Base SHA `7e6296ad0c9e494dc9fd20932c9a0c94a258b8f7`.
## Two approved directions: identity + real cloudless geography
The icon `brand-globe.svg` is a custom SVG **derivative inspired by** the temporarily approved globe-with-contacts concept, NOT a byte-exact replacement of the raster logo. The custom icon is used for favicon and both headers, preserving the existing text wordmark. Source raster assets remain intact outside GitHub. Treat visual identity as **candidate pending owner's eyes**, particularly fidelity to originally approved icon and favicon at 16px.
Cloud mesh and cloud texture request removed from live Three.js. Original Earth surface remains and optional normal map adds relief (fallback on load failure); renderer/gyro/scanner unchanged. Keep the globe slogan inside the actual DOM in ES/EN/PT as instructed.
## Seven additional guards
1. Protected globe slogan present in all three languages.
2. No orange line under the product name; orange accents elsewhere retained.
3. Same SVG favicon/header symbol in home and dashboard.
4. Cloud-free geographic surface at actual 3D render level (not screenshot substitution).
5. Optional bump relief with graceful failure rather than blank globe.
6. Fallback art remains when WebGL cannot start, disappearing after real render.
7. Mobile layout, small screen wordmark, reduced motion and E2E inherited regressions.
## Nonnegotiables
Keep exactly the previous contact DB, quota, search, URLs, 3D coordinate acquisition, radar, dashboard, 9-cell atlas, Terminator, and ES/EN/PT selector. No payment integration or commerce toggles.
## Remaining QA 
Existing 5 CI gates plus unit shell009 and browser screenshot comparison. No release until visual approval and separate greenlight to publish.
