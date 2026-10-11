# Shell 016 — GUTSY research y evaluación de lanzamiento Personal
**Fecha de decisión:** 10 octubre 2026 · **alcance:** BuscaClientes / FindClients / EncontraClientes, Free y Personal únicamente. **Enterprise NO es compromiso de lanzamiento.**  
**Estado de este informe:** investigación y propuesta técnica; no equivale a aprobación final del precio ni a cobros activados. Repositorio: https://github.com/jfcarpiopuntocom/buscaclientes · Shell 015 publicado · este Shell 016 en branch aislada.

## Hallazgo ejecutivo: GO para preparar; NO-GO para cobrar sin entitlement probado
El actual Shell 015 proporciona buscador de establecimientos con canales públicos de contacto, CRM local, exportación CSV y dashboard de informes existentes. NO proporciona identidad de usuario, suscripciones conciliadas, cuotas de servidor ni una función Premium realmente desbloqueada. El encabezado "Personal" actualmente dice «En preparación», correctamente. Para lanzar un plan que se cobre cada mes, esas carencias deben resolverse antes del primer cargo real. **No basta con añadir enlace a PayPal ni redirigir a dashboard.html.**

## Marco 1 — Jobs To Be Done (JTBD) y Value Proposition Canvas
**Trabajo:** «Soy un profesional independiente, recién llegado a una ciudad o pequeño negocio: quiero descubrir negocios, seleccionar contactos pertinentes, guardar contexto y organizar mi seguimiento sin una plataforma B2B cara o invasiva».
**Ganancia buscada:** convertir exploración en cartera gestionable y exportable, mapa territorial, etapas de CRM y cifras honestas, no «leads verificados».
**Dolores:** interfaz compleja, datos dudosos, gastos mensuales de decenas de USD, obligación de automatizar spam, exportación restringida, pérdida de contactos por caducidad de plan.
**Fit existente:** buscador trilingüe + 7 contactos semanales gratis + guardado duradero en navegador + CSV + dashboard y mapa existentes.
**Falta diferencial pagado:** cuota realmente mayor, dashboard privado con acceso controlado y refinamiento que funcione; el dashboard público actual no puede venderse como función exclusiva si sigue accesible gratis. Lo pagado DEBE ser un servicio nuevo comprobable: límites de selección de contactos ampliados **en servidor**, historial/controles adicionales, y acceso por suscripción comprobada. Investigación avanzada de decisores y sincronización NO deben prometerse antes de estar implementadas.

## Marco 2 — Análisis comparativo de valor/precio (benchmarking, no equivalencia falsa)
Fuentes oficiales revisadas el 10 oct 2026:
- Apollo: https://www.apollo.io/pricing — Free 900 créditos/año por asiento (repartidos mensualmente); Basic USD 49/mes por asiento facturado anualmente, ofrece datos y funciones de venta que NO tenemos.
- Hunter: https://hunter.io/pricing — Free 50 créditos/mes; Starter USD 34/mes facturado anualmente con búsqueda/verificación y herramientas de outreach distintas.
- Lusha: https://www.lusha.com/pricing/ — Free 40 créditos mensuales, Starter desde USD 37.45/mes facturado anualmente en configuración publicada, incluye acceso a datos verificados.
**Razonamiento:** USD 7/mes podría representar entrada económica atractiva, pero los 250 contactos de BuscaClientes son **establecimientos seleccionados a partir de fuentes públicas, a menudo sin teléfono/email ni datos verificados**. No decir «más barato que Apollo por contacto equivalente», «email verificado» ni ingresos garantizados. Competimos en claridad, experiencia, CRM y precio, no en datos premium.

**Oferta piloto recomendada:** Free = 7 contactos nuevos guardados por semana, búsquedas exploratorias disponibles sin cobro. Personal = USD 7/mes *provisional*, 250 nuevos contactos únicos guardados por semana, con **máximo de 1.000 altas únicas por ciclo de facturación**. Reexportar y editar contactos ya guardados es ilimitado. No se pierden contactos al cancelar. No añadir Enterprise ahora. Precio debe ser aprobado expresamente y verificado en PayPal LIVE con su moneda y ciclo reales.

## Marco 3 — Economía unitaria, sensibilidad de uso y capacidad operativa
Con 250/semana el techo **sin máximo mensual** sería ~1.083 selecciones por mes promedio (52 semanas/12 meses), y meses que solapan cinco semanas permiten 1.250; la propuesta de 1.000 altas **por ciclo** reduce ambigüedad y limita abuso. La cuota es de **registros únicos guardados**, NO de búsquedas, visualizaciones, descargas repetidas ni exportaciones. Un mismo registro no puede consumir cuota dos veces por diferencias triviales o reintentos.
**Escenarios ilustrativos, no previsión de ventas:** 10 suscriptores x USD 7 = USD 70 brutos/mes; 100 = 700; 500 = 3.500; falta descontar comisiones PayPal, cambios, impuestos, reembolsos, fraude, scraping legítimo y soporte. A máxima cuota, 100 usuarios generarían hasta 100.000 altas por ciclo; costos de almacenamiento D1 de esas filas suelen ser manejables si las consultas se indexan, pero **el costo y la licitud de obtener resultados** es el factor limitante.
Cloudflare Workers Free: 100.000 solicitudes/día por cuenta, 10 ms CPU/invocación, según https://developers.cloudflare.com/workers/platform/limits/ . D1 Free: 5M filas leídas/día, 100.000 filas escritas/día y 5 GB de almacenamiento total según https://developers.cloudflare.com/d1/platform/pricing/ . Un error SQL o bucle puede agotar la cuota. Mantener otra cuenta Cloudflare separada de friendly-123.
**Prohibición crítica OSM:** https://operations.osmfoundation.org/policies/nominatim/ restringe el API público a máximo 1 solicitud/segundo PARA TODA la aplicación y prohíbe consultas sistemáticas/descarga masiva de POI. El permiso de datos ODbL NO da derecho ilimitado a consumir su infraestructura. Para Personal escalar con caché, presupuesto global, backoff, fuentes permitidas y, si se usa investigación pagada, proveedor autorizado con coste máximo conocido. No construir escáner de extracción masiva de Nominatim.

## Marco 4 — AARRR (piratería ética / funnel de producto)
**Acquisition:** el globo y ciudades permiten descubrir utilidad sin pago. Nada de listas descargables no consentidas.
**Activation:** buscar una ciudad, guardar primer contacto verificado visualmente, añadir una nota y abrir el dashboard.
**Retention:** 7/semana incentiva volver; el usuario no pierde su CRM cuando pausa. En Personal la semana y el ciclo muestran contador claro.
**Revenue:** USD 7 sólo con identidad, plan y vinculación de suscripción validada por API. Sin activar cuenta por URL de retorno, querystring, captura de pantalla o toggle local.
**Referral:** el kit de nuevos comienzos permanece universalmente gratuito. No convertirlo en requisito de compra.
**Métricas mínimas:** usuarios que guardan primer contacto, activación de dashboard, exportación opt-in, contactos conservados, conversiones reales sin fingir datos, fallos de búsqueda y tasa de éxito de fuentes. Privacidad por defecto, sin exponer datos personales de terceros.

## Marco 5 — STRIDE/OWASP + integridad y control de cuotas
**Spoofing:** Hoy `bc-credits-YYYY-MM-DD` y `bc-crm-durable-v1` viven en localStorage; modificar JS/almacenamiento puede simular Premium. No sirve como prueba de pago. Implementar autenticación e identidad servidor, sesión segura, y PayPal subscription ID vinculado a sujeto estable.
**Tampering:** la cuota 7/semana se verifica en index.html, variable `used` cliente; Personal no puede desbloquearse con un simple `isPremium=true`. Servidor debe autorizar cada alta única idempotente, cobrar crédito una sola vez y denegar exceso.
**Repudiation:** guardar `usage_events` con `operation_id` y periodos; no guardar más PII que la necesaria, no recopilar nombres/emails de terceros sin base legal.
**Information disclosure:** un usuario no puede consultar historial o membresía de otro; HTTPS, CORS limitado a nuestro origen real, sin secretos en repositorio, URL, logs, GitHub Pages ni el chat.
**Denial of service:** rate limit, payloads máximos, límites de proveedor, debounce, cuotas por usuario, respuesta 429 para abusos y 503 ante indisponibilidad. No asumir que 100k/día es garantía de capacidad.
**Elevation of privilege:** el dashboard público `dashboard.html` hoy muestra datos locales y exporta CSV sin permiso premium. El nuevo portal NO confiere autorización por ubicación URL; rutas de API obligatoriamente validan sesión y entitlement. Ingreso PayPal y cancelación deben reconciliarse frente a API oficial, más idempotencia y eventos fuera de orden.
**Integridad universal:** cancelar NO borra CRM ni lo bloquea por completo; se limita sólo la incorporación de nuevos contactos; todo historial sigue visible y exportable, preferiblemente incluso para clientes vencidos.

## Marco 6 — FMEA + Stage-gate de lanzamiento
| Riesgo / hallazgo | Severidad | Prueba actual | Acción previa a LIVE |
|---|---|---|---|
| PayPal LIVE no acredita identidad ni membresía | Crítica | Receptor aislado registra webhooks firmados, NO activa acceso | Auth, asociación buyer/subscription + reconciliación GET oficial |
| Quota sólo local puede falsificarse | Alta | index.html: `used.length>=7` | Ledger servidor + transacción atómica + rate limit |
| Dashboard oculta registros sobre 250 | Alta | dashboard-bridge.js `unique(arr,250)`; dashboard.js `filtered.slice(0,250)` | Eliminar truncamiento de datos en visor y paginar renderizado |
| Datos privados / checkout falsas promesas | Crítica | Planes correctamente bloqueados | Pruebas end-to-end sandbox y políticas de refund |
| Capacidad / cumplimiento fuentes OSM | Alta | Buscador público sin control de costo por usuario premium | Gate de proveedor y límites de infraestructura |
| Riesgo de pérdida de CRM al cambiar plan | Crítica | CRM persistente actual es fuente local | No borrar, preservar rollback, back-up y exportación previa |
| Identidad misma carpeta / URL | Media | GitHub Pages `/buscaclientes/` | Nuevo portal `/buscaclientes/personal/` en **mismo origen**; no cambiar a jfcarpio.com sin migración de datos |

### Gates de salida (con pruebas, no estética)
**G0** Shell 015 intacto y marca SVG sin cambios; Free mantiene 7/semana.  
**G1** Presentación Personal `/buscaclientes/personal/` accesible, trilingüe, sin dar acceso sin auth.  
**G2** Core de cuotas: 250/semana **y** 1000/ciclo, dedupe, rollover UTC, exportación no consume, cancelación no borra. Tests.  
**G3** Auth real + asociación PayPal por usuario + webhook firmado y reconciliación oficial.  
**G4** Backend de consumo atómico, protección contra sesiones paralelas, spam/bots y orígenes.  
**G5** Dashboard para Personal con todos los registros (paginación), acceso real y CRM integrado dentro del mismo origen.  
**G6** Sandbox E2E: alta, pago, acceso, 250º/251º contacto, 1000º/1001º ciclo, refund, cancelación, fallos, idempotencia, 2 navegadores, 5 semanas de calendario.  
**G7** Precio/términos aprobados, costes y límites medidos, consentimiento explícito del titular antes de publicar o activar LIVE.

**Estado**: G0 documentado, G1/G2 preparables en este PR, G3–G7 **NO superados**. No confundir CI de webhook aislado con compra y desbloqueo premium.

## GUTSY — decisión valiente pero reversible
**G — Go-to-market:** 2 opciones, **Free y Personal**; sin Enterprise hipotética, sin prometer datos que no existen.  
**U — User value:** precio de entrada candidato USD 7 por 250 altas/semana y máximo 1000/ciclo, CRM conservado y exportable.  
**T — Tradeoffs:** abundancia sin saltarse fuentes ni vender emails verificados; la precisión supera el volumen.
**S — Safety:** pagos realmente vinculados a cuenta, backend de cuotas, fuentes legales, sin pérdida de datos, ninguna dependencia con friendly-123.  
**Y — Yield:** lanzar el mismo día en que los siete gates observables estén verdes. Se puede preparar la web y la prueba piloto esta noche; **no es responsable cobrar esta noche si entitlements no está funcionando**.

## Arquitectura recomendada (hexagonal, simple)
**Página pública**: `/buscaclientes/` Free y `planes.html` para precios.  
**Portal Personal**: `/buscaclientes/personal/` dentro de GitHub Pages, mismo origen que CRM local para preservar localStorage. No validar la compra en el frontend.
**API privada independiente**: `https://buscaclientes-paypal.buscaclientes.workers.dev` actualmente SOLO webhook sandbox. Después de autorización, rutas `/api/personal/me`, `/api/personal/reserve-contact`, `/api/personal/usage` con identidad probada y transacciones D1.
**Datos**: cartera con copia local y exportación preservada; entitlements/ledger en D1; jamás sincronización de datos privados implícita. Un recurso puede incluir nombre y canal público, pero no inferir email de una persona.
**Usuario sin acceso**: puede visualizar landing Personal con mensaje honesto y volver a Free; no hay bypass con ?premium=1 o key de localStorage.
**Compatibilidad**: no modificar `dashboard-bridge.js` hasta diseñar paginación y pruebas de 1.001 registros; el visor actual pierde filas después de 250 en su vista, aunque el CSV principal puede seguir exportando todas.

### Referencias de implementación
https://developer.paypal.com/subscriptions/webhooks/ · https://developer.paypal.com/api/subscriptions/v1/subscriptions-get/ · https://developers.cloudflare.com/d1/platform/pricing/ · https://operations.osmfoundation.org/policies/nominatim/ .

**Decisiones pendientes del propietario**: precio USD 7/mes definitivo; tope propuesto 250 por semana / 1000 por ciclo, prioridad de CRM local vs remoto, alcance exacto que Personal debe tener antes de venta. No habilitar pago sin aprobarlas y cumplir G3–G7.
