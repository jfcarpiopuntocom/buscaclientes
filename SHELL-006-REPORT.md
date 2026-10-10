# BuscaClientes · v1.0 shell 006 — Dashboard conectado y laboratorio de Porter invertida

## Origen y alcance aprobado
Pedido del propietario: continuar exactamente desde **v1.0 shell 005**, crear un dashboard de BuscaClientes inspirado en su dashboard real de **friendly-123** (propiedad del usuario); conectarlo directamente con la app; preparar futura entrada por contraseña sin fingir autenticación; incorporar una matriz de Porter invertida y un mapa de zonas locales donde **puedan existir** ventajas competitivas no satisfechas, usando fuentes multidimensionales; mantener todos los shells previos sin regresión. El propietario decide la fórmula final de su matriz y las condiciones comerciales. No tocar friendly-123 ni cambiar Cloudflare.

## Fuentes auditadas
- [friendly-123 — dashboard real de 233 KB](https://github.com/jfcarpiopuntocom/friendly-123/blob/master/docs/dashboard.html): reutilizamos **patrones** de cabecera, pulso de conexión, tarjetas KPI, múltiples vistas, CSV, impresión, degradación sin CDN. No copiamos su sistema de PIN, negocios, dinero, estructura de ventas ni claves.
- [Notas de inteligencia mundial en Notion](https://app.notion.com/p/3f51642b67f38137841de948d31fd92a): distinción entre datos nominales de negocios, agregados macroeconómicos y contexto, con fuentes y límites.
- [PBIU pública en JFCarpio.com](https://jfcarpio.com/): Pacific Basin Intelligence Unit produce investigaciones macro/sectoriales para Chile, Ecuador, Perú y Colombia. No contiene en la página accesible un contrato cuantitativo reproducible de la matriz de Porter invertida.
- [Harvard — Five Forces](https://www.isc.hbs.edu/strategy/business-strategy/Pages/the-five-forces.aspx): rivalidad, poder de compradores, poder de proveedores, entrantes y sustitutos son cinco dimensiones conceptuales distintas. Una búsqueda OSM no proporciona indicadores suficientes para las últimas cuatro.
- Búsquedas dirigidas en Notion, Google Drive y Gmail por «Porter invertida», Porter, PBIU, matriz y oportunidades: **no se localizó una fórmula explícita y verificable del propietario**. No atribuir una fórmula construida por la IA a JF Carpio ni declarar probado el high yield.

## Implementado, con origen de datos trazable
- `dashboard.html`, `dashboard.css`, `dashboard.js`: dashboard autónomo responsive, visualmente inspirado en friendly-123 pero dedicado a BuscaClientes. Tiene cuatro KPIs reales, distribución de categorías, estados CRM, mapa SVG de posiciones, zonas 3×3 de cobertura digital observada, cinco fuerzas con estado «sin datos» cuando corresponde, tabla filtrable, exportación CSV segura frente a fórmulas y modo imprimir.
- `opportunity-matrix.js`: normaliza y deduplica contactos, excluye demos, valida coordenadas y URLs, calcula únicamente señales observables. Ninguna afirmación automática de demanda, satisfacción, margen o rentabilidad. Ausencia de website en una ficha OSM significa «sitio no publicado en muestra», **no** prueba de que la empresa carezca de sitio.
- `dashboard-bridge.js`: puente **BroadcastChannel del mismo origen** con snapshot de lectura de la app y respaldo de CRM ya guardado en `localStorage`. Una pestaña original abierta responde a `bc:hello` con datos de `saved` y `lastResults`; el dashboard **nunca escribe** en el CRM, cuotas o API; no hay backend ni transferencia a friendly-123.
- `index.html`: acceso visible al dashboard, proveedor de snapshot y señales en el render/persistencia existentes, incremento público a shell 006.
- Seguridad: el dashboard es **local en el mismo navegador**, sin contraseña ni acceso protegido entre dispositivos. Se advierte en pantalla. **Prohibido publicitar login privado implementado o sincronización remota**. Un control real requerirá identidad, contraseñas verificadas y sesiones/servidor, sin usar PIN cosmético en JavaScript público.

## Qué NO afirmamos
- No se implementa el mapa de «alto rendimiento» como clasificación probada: hacen falta encuestas/datos de demanda, precios, proveedores, sustitutos, costos y evidencias comparables con fecha y fuente; los datos de OSM ofrecen observaciones incompletas.
- No se implementan filtros ejecutivos/empresariales, múltiples personas reales por compañía ni remuneración. No hay nuevo paywall, Gumroad ni modificación de las siete selecciones gratuitas semanales.
- No se toca la base de datos de friendly-123 ni los Workers/credenciales de Cloudflare.

## Roadmap de oportunidades (solo hipótesis para el proceso aprobado)
**A. Porter invertida con evidencias por cada fuerza.** Cuando existan fuentes compatibles, registrar potencia de compradores/proveedores, nuevas empresas, sustitutos, rivalidad y señales de insatisfacción con trazabilidad.
**B. Densidad territorial sectorial ajustada por demanda y precios.** Requiere población/empleo/actividad, oferta completa y normalización geográfica; si faltan no hay índice de high yield.
**C. Investigación individual de empresas con varias personas ejecutivas.** Enriquecimiento público verificable y presupuesto de proveedor distinto de OSM, sin contactos personales inventados.
**D. Dashboards Personal y Enterprise diferenciados.** El actual es base común sin control de suscripción; Personal priorizará seguimiento individual y recursos comerciales; Enterprise, carteras compartidas, usuarios, roles, sincronización y permisos verificados; no prometerlos hasta construir backend.

**Hardrule:** investigación verificable → propuestas gutsy → elección del propietario → opinión final del asistente → implementación solamente de lo aprobado. Todos los precios, límites, naming y protección son decisiones del propietario.

## Regresión y despliegue
Nueva suite `tests/shell-006.test.mjs` y browser `shell-006-browser-qa.cjs` (Chromium/WebKit; 1440px y 390px; vacío, datos controlados, mapa y Live BroadcastChannel). Mantener íntegros los tests de los 5 shells anteriores y la CI de Terminator. Ver [workflow Shell 006](https://github.com/jfcarpiopuntocom/buscaclientes/actions/workflows/shell-006-gate.yml).

**Estado del documento:** candidato hasta resultados verificables de CI y, si procede, merge/Pages; no declarar publicación solo por guardar estos archivos.
