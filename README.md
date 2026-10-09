# Busca Clientes — Beta 0.3

Explorador glocal ES / EN / PT para descubrir pequeños negocios, con globo 3D, categorías y un pequeño CRM local. Primera etapa: descubrir candidatos para **friendly-123**.

## URL sin dominio propio

Repositorio propuesto: `jfcarpiopuntocom/buscaclientes`. Una vez creado y habilitado **Settings → Pages → GitHub Actions**, la interfaz se publicará en `https://jfcarpiopuntocom.github.io/buscaclientes/`. **Crear el repositorio y activar Pages son acciones todavía pendientes**.

## Pasos

1. Crear un repositorio vacío `buscaclientes` en GitHub (público si se usará GitHub Pages público).
2. Subir **el contenido** de este ZIP a la raíz del repo (no la carpeta contenedora).
3. En Settings → Pages, elegir `GitHub Actions` como fuente. El workflow `.github/workflows/pages.yml` publica la interfaz en cada push a `main`.
4. Para búsqueda real: desplegar por separado `worker.js` con `wrangler deploy`, usando `wrangler.toml`, y pegar la URL completa del Worker (solo el origen, sin `/api`) en `config.js`. Hacer commit y dejar que Pages se republice. No confundir una interfaz publicada con el backend funcionando.
5. Probar `/api/health` en el Worker y luego una búsqueda desde el sitio.

## Estado y limitaciones

- GitHub Pages aloja **solo el frontend estático**. Sin Worker configurado, funciona únicamente **Explorar ejemplo** y el globo; las búsquedas reales mostrarán error.
- Backend OSM mediante Nominatim + Overpass. No promete todos los negocios de una ciudad; depende de la cobertura OSM y políticas de proveedores. Los emails solo aparecen si están publicados en el dataset.
- Prototipo con siete guardados semanales por navegador, **sin autenticación ni protección antifraude**; no se debe vender como un límite real de cuentas.
- Contactos guardados localmente y exportables en CSV; no se sincronizan entre dispositivos.
- Datos OSM © colaboradores de OpenStreetMap, licencia ODbL; respetar sus políticas de uso, atribución y contacto comercial aplicable.
- Antes de abrir al público: auth, rate limiting, proveedor sostenible, CRM durable, controles antiabuso y facturación.

No requiere dominio propio ni Docker.

## Beta 0.3 — 9 octubre 2026

- Búsqueda directa desde GitHub Pages vía Nominatim + Overpass cuando no hay Worker configurado. Requiere conectividad y disponibilidad/CORS de servicios comunitarios; no se garantizan tiempos ni cobertura.
- Búsqueda por ciudad, categoría y palabra clave; OpenStreetMap puede no publicar emails/teléfonos.
- Etiqueta superior «7 contactos gratis a la semana» (con traducciones EN/PT).
- Bloom WebGL más pronunciado (UnrealBloomPass, ACES tone mapping), dependiente de aceleración WebGL.
- El límite de siete contactos sigue siendo local/demostrativo y no seguro frente a abuso; antes de monetizar necesita autenticación y cuotas de servidor.
- La búsqueda en producción todavía requiere validación E2E de resultados reales; no se ha certificado disponibilidad de los proveedores externos.


## v0.331 — catálogo glocal

Selector de país (aprox. 250 países) y sugerencias de ciudades cargadas por demanda desde `srestre/world-countries-cities-db` mediante jsDelivr. El dataset fuente enumera ~156.025 ciudades y localidades globales; no garantiza un censo exhaustivo de cada municipio ni clasifica la población, y puede contener distritos y duplicados. EE. UU. incorpora su listado de localidades (con entrada libre para cualquier ciudad o estado). Al buscar, la geocodificación continúa mediante OpenStreetMap/Nominatim y los comercios por Overpass. Los contactos solo aparecen cuando están publicados en la fuente.

Datos geográficos: [srestre/world-countries-cities-db](https://github.com/srestre/world-countries-cities-db), derivado de [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database), bajo ODbL. La búsqueda libre continúa disponible si el CDN falla.


## v0.4 — Earth Edition (2026-10-09)

- Globo realista: textura terrestre, atmósfera Fresnel, iluminación direccional, capa de nubes y bloom ajustado; Three.js CDN.
- Búsqueda: se muestran primero negocios con email, teléfono o web publicados; los datos siguen provenientes de fuentes OSM y no se inventan.
- Los prospectos ficticios de demostración no consumen créditos ni se exportan al CSV comercial.
- Rendimiento móvil: densidad de píxeles WebGL limitada a 1,65.
- Limitaciones: todavía pendiente test automatizado completo navegador→Nominatim→Overpass→tarjetas y despliegue de cuotas/autenticación del lado servidor; el comportamiento depende de conectividad/CORS y disponibilidad de fuentes públicas.

## v0.5 — Prospecting Fusion & mobile-first UX

- Multi-tag OSM: busca variantes de clasificación para aumentar cobertura en categorías principales.
- Deduplicación por dominio o nombre/dirección y clasificación prioritaria por campos de contacto públicos.
- Enlace externo a Google Maps para comprobar cada negocio; **no** se extraen datos de Google Maps ni se asegura cobertura de Google Business Profile.
- UX: al iniciar una búsqueda, se desplaza inmediatamente al radar de resultados, mostrando su propio indicador de carga; en móvil, los resultados preceden a las tarjetas de créditos.
- No se ha integrado todavía Overture Maps, el enriquecimiento de webs ni fuentes comerciales: requieren backend y pruebas independientes.

## v0.667 — CRM desde el descubrimiento

- Panel «Resultados / Mi cartera» con traducciones ES/EN/PT.
- Prospectos guardados en almacenamiento local persistente sin borrarlos cada lunes; migración inicial desde el conjunto semanal anterior.
- Etapas editables: nuevo, contactado, seguimiento, calificado, ganado y descartado; notas de hasta 1200 caracteres y fecha de modificación.
- CSV incluye etapa y notas. Estado de error de búsqueda dentro del radar, con reintento.
- Importante: es un CRM **local del navegador**, sin sincronización entre equipos, cuentas, respaldo remoto ni protección antifraude para los 7 créditos; no confundir con un CRM cloud listo para producción.
- Fuentes: el motor actual sigue utilizando OSM/Overpass; Google Maps solo se enlaza para comprobación externa. La integración multifuente y el enriquecimiento no están desplegados.

## v0.678 — refinamiento de marca y usabilidad

- Marca unificada **BuscaClientes** con contraste cromático y kerning compacto, sin introducir espacios entre las palabras.
- Mejoras en foco visible de teclado, áreas táctiles y tarjetas móviles; exportación CSV con nombre BuscaClientes.
- Se mantienen cartera CRM, notas, estados y almacenamiento persistente existentes. No hay migración ni borrado de datos.
- QA: sintaxis JavaScript verificada; las pruebas E2E de búsqueda y CRM todavía deben ejecutarse en navegador real.

## Motor de fuentes ligeras (9 oct 2026)

- `fusion.js`: módulo JavaScript sin bibliotecas ni instalación, conecta Wikidata SPARQL de manera suplementaria para ciertas categorías y combina con los resultados de Overpass/OSM.
- Tres endpoints Overpass alternativos ya configurados; el motor inicia la fuente complementaria sin esperar el resultado de Overpass y la puede usar como respaldo.
- Deduplicación básica por web o coordenadas/nombre; prioriza contactos públicos utilizables.
- No son scrapers de Google Maps/Google Business ni técnicas para eludir bloqueos. Google Maps se abre mediante enlace de comprobación manual.
- No exige cuentas de pago ni cuota de TinyFish; los endpoints comunitarios tienen políticas de uso, límites y disponibilidad independientes.
- JS propio añadido: `fusion.js`, pocos KB; los CDN del globo se cargan como antes. No se incorporan paquetes pesados.
- La investigación de un backend para importaciones Overture, enriquecimiento de webs y rate limiting continúa abierta; no afirmar que esas fuentes ya están integradas.
- Limitación: consultas desde browser dependen de CORS y disponibilidad, así que faltan pruebas automatizadas de resultados reales antes de considerarlo producción.
