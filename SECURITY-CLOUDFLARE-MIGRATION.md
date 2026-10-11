# Shell 016 · Código público → Cloudflare privado · Plan de seguridad y migración

**Autorización del propietario:** desplazar BuscaClientes fuera de hospedaje GitHub Pages de código fuente público, reducir clonabilidad, separar código propietario y usar Cloudflare (Plan B: localhost). No fusionar a main, ni privatizar el repositorio actual antes del despliegue alternativo probado.

## Estado verificado (10–11 oct 2026)

- Repositorio actual [jfcarpiopuntocom/buscaclientes](https://github.com/jfcarpiopuntocom/buscaclientes): `visibility=public`, `default_branch=main`. Por ello **se puede clonar hoy**; hacer privado más adelante NO elimina forks/copias previas.
- Hospedaje web actual: `https://jfcarpiopuntocom.github.io/buscaclientes/` en GitHub Pages. CRM duradero en navegador local bajo origen `https://jfcarpiopuntocom.github.io`; un cambio a Cloudflare `pages.dev` cambia el origen y NO transporta `localStorage` automáticamente.
- Cuenta Cloudflare nueva/exclusiva: `5c15f6eacab9538c6f4cccbe750758d0`, SIN tocar friendly-123.
- Pages proyecto `buscaclientes-secure-preview` creado vía MCP Cloudflare con HTTP 200 y dominio reservado `buscaclientes-secure-preview.pages.dev`, pero **SIN DEPLOY funcional**.
- PayPal Worker separado `buscaclientes-paypal` ya en Sandbox; no hay entitlement ni pago LIVE.
- Rama evaluación Free+Personal [PR #20](https://github.com/jfcarpiopuntocom/buscaclientes/pull/20): no merge.

## Modelo de amenazas: qué SÍ protege y qué NO

1. **Privatizar el repositorio** restringe futuras clonaciones desde GitHub, pero no borra copias ya obtenidas ni oculta HTML/JS/CSS que descarga el navegador.
2. **Ofuscar/minificar frontend** dificulta lectura superficial, pero NO equivale a secreto ni DRM. Nunca poner `PAYPAL_CLIENT_SECRET`, tokens, algoritmos de cuota/autorización o reglas de fraude sólo en ese JS.
3. **Privatizar backend Cloudflare Workers**: lógica ejecutada en edge no se entrega al cliente. Mantener autorización y cuota en D1 y confirmar cada transacción desde servidor.
4. **Aplicación híbrida instalada**: también reversible o inspeccionable; la seguridad de Free vs Personal debe seguir siendo servidor-authoritative. Desktop local solo para QA o como contingencia, NO un servidor doméstico de pagos público sin TLS, operación 24/7, guardias y backups.
5. **Política de fuentes:** no utilizar scrapers para eludir límites de Nominatim/OpenStreetMap; Firecrawl + Crawl4AI sólo donde haya permiso, cuotas globales y trazabilidad.
6. **ProofShot** (https://github.com/AmElmo/proofshot) para evidencia visual (video, screenshots, logs de navegador y servidor). No sustituye pentesting ni pruebas de pagos.

## Orden de migración sin perder contactos (no correr en paralelo por intuición)

**Fase 0 — Congelar:** mantener GitHub Pages main intacto; registrar fecha, SHA y copia funcional. Auditar contenido público; si aparece algún secreto real, revocarlo y rotarlo inmediatamente (no solo borrarlo de GitHub, también del historial cuando sea necesario).

**Fase 1 — Public assets only:** construir copia Cloudflare Pages a partir de assets estáticos mínimos HTML/CSS/JS/SVG/kit. Excluir del artefacto los `*.sql`, Worker privado, pruebas, notas y runbooks; validar HTTP, móvil, ES/EN/PT, CSV y origen. El proyecto Cloudflare Pages es Direct Upload, que permite build de GitHub Actions con Wrangler en el futuro.

**Fase 2 — Exportación/transferencia:** ofrecer en origen GitHub Pages una exportación verificable completa del CRM (`bc-crm-durable-v1`, etapas, notas, evidencia, idiomas) e importación validada en Cloudflare. Reconciliar conteos, hashes y muestras; rollback si no coinciden. Nunca eliminar almacenamiento local en origen ni trasladar silenciosamente contactos a la nube. El usuario decide mover cada cartera; las exportaciones CSV existentes son un mínimo, no sustituyen backup/restauración de todos los metadatos del CRM.

**Fase 3 — Backend seguro:** introducir autenticación, firma de sesiones, subscription ID verificada en PayPal, autorización en Worker, contabilidad D1 por identidad con índice único y deduplicación transaccional. Ningún `?paid=true` ni almacenamiento local concederá Personal.

**Fase 4 — QA de verdad:** QA visual ProofShot (Chrome + WebKit/Playwright), tests de 7º/8º en Free y 250º/251º en Personal, 1000º/1001º ciclo, concurrencia, cancelación/reembolso, pago LIVE bloqueado en Sandbox, restauración/importación, y 404/500/429. No alterar SVG original y conservar mismas identidades ES/EN/PT.

**Fase 5 — Privatizar:** cuando Cloudflare Pages sirva la nueva versión íntegra y haya copia/restore verificados de CRM, cambiar repo a PRIVATE desde cuenta propietaria, O crear nuevo repo privado conservando el público sólo como archivo desactualizado/despublicado, según el plan GitHub y el tratamiento deseado de forks. En GitHub Free un GitHub Pages desde repo privado puede dejar de publicarse. En el futuro, preferir GitHub repo privado + Cloudflare Direct Upload por GitHub Actions con token mínimo. Retener rollback.

## Controles de seguridad recuperados de Notion

Fuente: [Prompt de backend checklist — 02 Resources](https://app.notion.com/p/3ef1642b67f380558299d2973ed9adfe). Lista original:
- Validar entradas. SQL parametrizado; nunca concatenado. Hash de contraseñas, o preferiblemente usar proveedor de identidad gestionado.
- Secretos fuera de repo. Rate limit login. Timeouts externos. Solo reintentos transitorios.
- Pagos idempotentes. Transacciones multiescritura. Índices de filtros. Evitar N+1. Pools cuando aplique (no forzar pools inaplicables en D1).
- Versionar migraciones, no borrar columnas en mismo deploy. Logs con request ID redactados. Health conectado a DB pero sin información sensible.
- Devolver 429 bajo saturación (no 500); backups consistentes y restauración probada.
Evidencia adicional: [La Empresa de Una Persona](https://app.notion.com/p/3f41642b67f38168b43bd3ef242bd028) describe SQLite con cuotas atómicas, backups/restore, separación de credenciales y trazas. No trasladar credenciales de n8n ni su infraestructura a BuscaClientes.

## Protección adicional prioritaria

- CSP estricta, referrer-policy, MIME sniffing off, frame-ancestors, restricciones CORS por origen, controles CSRF según tipo de autenticación, cookies HttpOnly Secure SameSite.
- Prohibición de .map públicos; generar CI que inspeccione secretos, URLs de credenciales y archivos excluidos. No guardar screenshots ProofShot con contraseñas o PII.
- Limitar consumo global de datos de terceros con rate limiting **por cuenta y proveedor**, circuit breaker y métricas de cache hit.
- Revisar trazas/errores sin revelar email o números de teléfono de terceras personas.
- Permisos mínimos para GitHub CI→Cloudflare; no usar token de una cuenta que tenga recursos friendly-123.

## Regla de lanzamiento

**No privado/No LIVE por marketing.** Marcar como completada cada fase exclusivamente con links de deployment, pruebas reales y conteos de datos. No cerrar GitHub Pages viejo hasta validar el transporte de CRM y el dominio definitivo. La web puede ser pública, pero el código propietario debe estar en repositorio privado y/o Workers privados.
