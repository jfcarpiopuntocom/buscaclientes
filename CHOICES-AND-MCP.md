# BuscaClientes ATLAS — opción B aprobada e integrada

**Aprobación:** el propietario eligió **B · ATLAS** el 10 de octubre de 2026 y pidió integrar las capacidades de World Intelligence. Esta rama implementa solamente B; las opciones A y C quedan en el PR de exploración #3 para histórico, sin publicarse en esta rama.

## Estado técnico real — distinguir instalado, conectado y desplegado

### En el navegador / sitio estático
- **Layout B activo** en el verdadero `index.html` mediante `atlas-layout.js` y `choice-b.css`; reutiliza el formulario original y lo coloca junto al globo 3D, no crea una segunda búsqueda.
- Se mantienen el escáner, target reticle, globo WebGL, animación de localización aleatoria, Periscopio, Overpass/OSM/Wikidata, Radar, Contact Scout, CRM guardado en este navegador, filtros, ordenamiento y exportaciones. Las versiones B anteriores eran solo previsualizaciones; esta rama convierte B en el único layout aprobado.
- `intelligence.js` integra directamente las consultas públicas del Banco Mundial y GDELT; solo bajo interacción voluntaria. Se muestran valores con fuente/año y noticias como **señales no verificadas**, no como prospectos confirmados. Cuando una fuente falla, aparece «no disponible», sin fingir datos.
- `swiss-ux.js` coloca la inteligencia en el **Periscopio que ya existía**, el detalle de propiedad en la **etiqueta existente de cada tarjeta** y los filtros secundarios en su actual buscador plegable. No hay paneles nuevos. No se reescribe el CRM.
- El comparador Census CBP+ACS por condado y NAICS se implementó en `intelligence-territories-worker.js` pero queda **inactivo** mientras no se autorice desplegar un Worker con `CENSUS_API_KEY`, `ALLOWED_ORIGIN` y controles contra abuso. Los datos agregados jamás identifican negocios.
- La consulta de noticias por nombre de empresa exige acción específica y **no transmite teléfonos, correos ni notas del CRM**. Una coincidencia de nombre no demuestra identidad jurídica.

### MCP auténtico (separado)
- `world-intel-bridge/server.mjs` es un cliente real MCP escrito con el SDK oficial de JavaScript: arranca `world_intel_mcp.server` vía stdio, comprueba herramientas disponibles y permite **solo** `intel_world_bank_indicators` y `intel_gdelt_search`. No permite cambios de AOI, generación automática de ventas ni escritura.
- `intelligence.js` prioriza ese BFF **solo si** existe una base HTTPS confiable en `window.BUSCA_CLIENTES_WORLD_MCP_BASE`. Ante fallos usa directamente las APIs públicas. Por defecto, la base no se configura: no afirmar que GitHub Pages está conectado con Python/MCP.
- El BFF **NO está desplegado todavía**. GitHub Pages ejecuta HTML/JS estático y no puede mantener Python MCP en stdio. Para autenticarlo en línea hace falta una plataforma que ejecute procesos persistentes y un proxy HTTPS con WAF y rate limiting; configurar el endpoint sin esas salvaguardas sería una falla de seguridad.
- No agregar claves ni `INTERNAL_BEARER_TOKEN` al repositorio o código JS público. No dar al servidor acceso a datos personales, listas de contactos o finanzas.
- El túnel MCP de n8n en el computador del usuario es **otro servicio** y debe continuar intacto. No copiarlo, reiniciarlo ni ampliar sus permisos para este trabajo.
- Toda referencia a `world-intel-mcp` se refiere al proyecto fuente [marc-shade/world-intel-mcp](https://github.com/marc-shade/world-intel-mcp). Sus 132 herramientas NO están todas habilitadas ni serían apropiadas para el público.

## Pruebas y aceptación
- `node --test tests/*.test.mjs`, más sintaxis de JS, verifican contratos, privacidad, fallback MCP y confidencialidad de datos.
- `atlas-release-qa.cjs` comprueba **Chromium + WebKit**, escritorio 1440px y móvil 390px, además de globo/retícula, formulario B, búsqueda, Periscopio, filtros, 3 accesos, CRM, pruebas sintéticas de MCP/Census y tarjetas.
- Pruebas del adaptador con fixtures demuestran el recorrido funcional **de código**, no disponibilidad real de servicios externos ni un despliegue MCP en producción.
- Antes de publicar, exigir CI verde para commit exacto y verificar que GitHub Pages termina con éxito. En caso contrario mantener `main` inalterado.
- Las capturas contienen exclusivamente comercios ficticios. No usar muestras como evidencia de clientes reales.

## Próximos pasos de infraestructura (sin bloquear UI legítima)
1. Desplegar por separado el BFF MCP con 2 herramientas read-only, HTTPS y cuotas; probar integridad y credenciales de servicio antes de agregar una URL en `config.js`.
2. Desplegar el Worker Census con secreto y cuotas. Entonces habilitar `BUSCA_CLIENTES_INTEL_BASE` e inspeccionar estadísticas fuente contra fuente.
3. Medir origen/relevancia y falsos positivos de GDELT por ciudad/categoría. No automatizar email sin aprobación.

## Enlaces
- [Repo BuscaClientes](https://github.com/jfcarpiopuntocom/buscaclientes)
- [World Intelligence MCP](https://github.com/marc-shade/world-intel-mcp)
- [World Bank Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392)
- [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- [Census CBP](https://www.census.gov/programs-surveys/cbp.html)

**Regla no negociable:** no se considera «MCP enchufado en producción» hasta una llamada real navegador → BFF HTTPS → MCP Python → fuente → UI, con health, límites y trazabilidad.