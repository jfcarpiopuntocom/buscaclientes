# BuscaClientes — PayPal Business: guía humana + runbook técnico

**Estado al 10 oct 2026:** PR #19 aislado, no fusionado, no desplegado, **no acepta dinero**. PayPal Developer muestra una aplicación LIVE llamada BuscaClientes (captura del propietario). Eso NO verifica que su cuenta pueda crear suscripciones en Ecuador ni que exista un webhook público.

## Directriz operativa
- **TinyFish está prohibido**; no usarlo ni volver a pedir autenticación mediante él.
- **Firecrawl** (https://github.com/firecrawl/firecrawl) y **Crawl4AI** (https://github.com/unclecode/crawl4ai) son las herramientas preferidas para scraping y extracción web. **No** son herramientas para operar una cuenta PayPal autenticada.
- Playwright y agent-browser complementan las pruebas de UI con contextos de acceso legítimos. Para PayPal preferir sus herramientas oficiales; nunca pedir contraseñas, tokens o el Client Secret por chat.
- **friendly-123 es sagrado**: no tocar su código, Workers, KV, R2, D1, secretos, rutas ni despliegues. Cloudflare Workers Free comparte cuota diaria a nivel cuenta: un Worker distinto en la MISMA cuenta **no garantiza aislamiento de cuota**. Por seguridad, no desplegar BuscaClientes allí sin evaluar una cuenta Cloudflare completamente separada o un proveedor alternativo.

## Instrucciones PayPal para el propietario (un minuto)
1. La pantalla **PayPal Developer → LIVE → BuscaClientes → API credentials** ya está bien. No hace falta crear otra App ni compartir el Client ID de nuevo.
2. En otra pestaña entra a **PayPal Business normal**, no Developer. Busca **Sales / Ventas → Subscriptions / Suscripciones → Create plan / Crear plan**.
3. **Solo comprueba si aparece esa opción**. No crees un plan ni autorices un cargo mientras falten las condiciones comerciales aprobadas y el backend de acceso premium.
4. Indica si la opción existe. Si no aparece, envía una captura SIN datos privados: algunas funciones dependen de elegibilidad de cuenta y mercado (Ecuador).
5. No pulses aún "Add webhook" en Developer: se necesita primero una URL HTTPS REAL y verificada, que no tenemos. Cuando la tengamos, lo haremos juntos.

Documentos oficiales:
- https://developer.paypal.com/subscriptions/dashboard/use-dashboard
- https://www.paypal.com/ec/cshelp/article/merchant-subscription-faqs-help289?locale.x=en_EC
- https://developer.paypal.com/subscriptions/webhooks/
- https://developer.paypal.com/api/rest/webhooks/rest/

## Código que ya está preparado (PR #19)
- `paypal-worker.js`: receptor HTTPS de eventos de suscripciones con validación de firma usando API oficial PayPal, límites de cuerpo, tiempos máximos en llamadas externas y configuración explícita sandbox/live.
- `paypal-schema.sql`: esquema de **nueva base de datos D1 aislada**, que guarda solo metadatos de eventos, NO cuerpo completo, correos ni nombres.
- `wrangler.paypal.toml`: Worker separado `buscaclientes-paypal`, sin recursos de otros productos ni secretos en el código.
- `tests/paypal-webhook.test.mjs`: tests que no hacen llamadas reales a PayPal ni Cloudflare.
- `.github/workflows/paypal-guards.yml`: CI de aislamiento y seguridad.
- **Rutas inactivas**: `/api/paypal/create-order`, `/api/paypal/capture-order`, `/api/paypal/create-subscription` devuelven 503; no hay cargos ni activaciones.

### Eventos previstos (seleccionar al crear webhook)
- `BILLING.SUBSCRIPTION.CREATED`
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.REFUNDED`
- `PAYMENT.SALE.REVERSED`

**No usar eventos CHECKOUT.ORDER.* o PAYMENT.CAPTURE.* como sustituto del ciclo de suscripciones.**

## Secuencia futura, solo después de acuerdo comercial y staging
1. Aprobar beneficio **real** de Personal y Equipos, precio exacto USD, frecuencia, política de cancelación/devolución y TOS/privacidad.
2. Diseñar identificación de usuario, vinculación demostrable a PayPal subscription ID, permisos y cuotas protegidos en backend independiente; proteger contra eventos fuera de orden.
3. Comprobar elegibilidad PayPal Business para suscripciones de la cuenta ecuatoriana y obtener un plan real, no inventado.
4. Probar Sandbox con credenciales Sandbox reales y cuenta de comprador simulada, sin cargos live.
5. Preparar backend fuera de la cuota/infraestructura vital de friendly-123, con presupuesto y protección antiabuso.
6. Desplegar URL HTTPS propia en infraestructura aislada, cargar secretos **directamente en configuración privada**, crear webhook en PayPal Live, obtener `PAYPAL_WEBHOOK_ID` y verificar firma + persistencia + deduplicación.
7. Probar suscripción/renovación/cancelación/reembolso, recuperación de fallos y reconciliación; solo entonces habilitar link/SDK en `payment-plan-config.js`.

### Variables en el futuro backend seguro
- `PAYPAL_ENV`: texto `sandbox` o `live` según despliegue.
- `PAYPAL_CLIENT_ID`: publicable, pero NO necesario ponerlo en el repositorio.
- `PAYPAL_CLIENT_SECRET`: **solo secreto del servidor**, nunca por chat.
- `PAYPAL_WEBHOOK_ID`: identificador proporcionado por PayPal al registrar URL.
- `PAYPAL_DB`: NUEVA base exclusiva de BuscaClientes, sin reutilizar friendly-123.

**La página de planes y su kit gratuito continúan intactos.** Ningún evento firmado activa permisos premium por sí solo. Este PR **solo asegura recepción y registro de eventos**, no un sistema completo de suscripciones.
