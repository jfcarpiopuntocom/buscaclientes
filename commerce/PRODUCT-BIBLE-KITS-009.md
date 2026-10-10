# BuscaClientes · Shell 009 · Arquitectura comercial Personal y Enterprise (preparación)
**Estado: propuesta de contenido, no oferta publicada.** Base: Shell 008 `7e6296ad`. No se modificaron las aplicaciones ni los cobros.

## Decisión del propietario
Crear dos kits de ventas auténticos, **Personal** y **Enterprise**, destinados a personas y equipos que buscan clientes y necesitan convertir el descubrimiento en conversaciones y ventas. Desde el punto de vista comercial, el kit es el objeto principal de contenidos originales; la app BuscaClientes aparece como herramienta incluida. Dentro de la app, las guías y plantillas aparecen como materiales complementarios. Ambas descripciones son compatibles siempre que revelen exactamente los mismos componentes, restricciones y condiciones económicas.

**Condición de cumplimiento:** La estrategia NO pretende ocultar software que Gumroad pudiera prohibir. Describir expresamente la existencia y función de la aplicación; solicitar confirmación a Gumroad para esta oferta específica antes de conectar cobros. Si la deniega, mantener los kits independientes en Gumroad solo si su equipo confirma que son admisibles y vender/licenciar la app mediante otro procesador compatible. Prohibido inferir aprobación de un cambio cosmético de categoría.

## Tres niveles de valor, sin sobrepromesas
| Área | Gratuito | Kit Personal | Kit Enterprise |
|---|---|---|---|
| Propósito | Descubrir negocios | De contacto elegido a conversación | Operación comercial territorial de equipo |
| App incluida | Shell público actual | Acceso premium **solo cuando esté construido y validado** | Capacidades de equipo **solo cuando estén construidas y validadas** |
| Contactos | 7 contactos elegidos/semana, medidos de forma local y provisional | Hipótesis 250/semana, sin backend ni licencias todavía | Por definir |
| Guías | Ninguna obligación | Investigación de encaje, primer contacto, seguimiento, embudo individual | Matriz territorial, asignación, revisión y control de calidad |
| Equipo | Sin multicuenta | Uso individual | No prometer sincronización ni asientos antes de implementar |
| Precio | Gratis | **Candidato** USD 7/mes, pendiente de aprobación final | USD 20, USD 100, cotización u otras: SIN DECIDIR |

Nota: las cantidades propuestas en Notion no son una prestación contractual. Las búsquedas exploratorias no deben costar créditos. Nunca eliminar ni secuestrar una cartera anterior para imponer pago; proteger exportaciones.

## Entregables de contenido realmente creados en este shell
- `kits/personal/README.md`: inventario verificable y método de uso.
- `kits/personal/GUIA-DE-CAMPO.md`: selección, verificación, primeros mensajes originales, seguimiento responsable, decisiones de próxima acción.
- `kits/enterprise/README.md`: inventario honesto y proceso de equipo en ausencia de sincronización en la app.
- `kits/enterprise/MATRIZ-DE-OPORTUNIDADES.md`: plantilla operativa de investigación territorial con trazabilidad y riesgos de inferencia.

Los materiales están en Markdown editable y necesitan revisión editorial, eventual maquetación/PDF, portada, identidad visual y prueba con compradores antes de publicar. Talorys sirve para **ayudar a producir y mantener estos materiales**, no para inventar fuentes, reemplazar procesos comerciales ni procesar datos de contactos sin criterio.

## Reglas para el copy de Gumroad
1. Nombre y finalidad del kit en portada; contenido detallado con número y naturaleza de archivos **ya entregables**.
2. «Incluye acceso a BuscaClientes» solo una vez exista método real de activación; hasta entonces, únicamente «acceso gratuito público disponible en [BuscaClientes](https://jfcarpiopuntocom.github.io/buscaclientes/)».
3. Describir la app como explorador de negocios públicos, filtros y CRM local, no como lista de correos, envío masivo ni garantía de ventas.
4. Mostrar fuentes de los datos, cobertura incompleta y límites; no prometer datos de contacto que no estén publicados.
5. Mostrar plazo, cancelación, reembolso, acceso posterior y privacidad después de elegir el modelo de facturación.
6. No atribuir a Gumroad una certificación, asociación o aval inexistente.
7. Si Talorys se ofreciera alguna vez como software adicional: aplicar licencia MIT, entregar avisos, informar que requiere cuenta Cloudflare propia y **no incluirlo por defecto en los kits**.
8. No anunciar acceso Enterprise multiusuario, SSO, API, dashboards de equipo completos ni SLA mientras no existan.

## Acoplamiento técnico y seguridad
`Gumroad` → webhook/token verificado por servidor → registro inmutable de orden y estado de suscripción → **entitlements** (personal/enterprise) → medidor atómico/idempotente → BuscaClientes.
**Prohibido** autorizar planes desde localStorage, querystrings sin firma, captura de checkout, o suscripciones simplemente declaradas por la página. Los reembolsos y cancelaciones deben modificar derechos posteriores sin borrar contactos ya adquiridos.

El backend no está desplegado. `config.js` tiene `BUSCA_CLIENTES_API_BASE = ''`; el CRM continúa local, sin sesiones verificadas. No tocar las cuentas ni Workers de friendly-123; separar cuenta o al menos recursos y presupuestos expresamente aprobados.

## Hitos
A. Aprobar contenido del kit; probar su utilidad real sin pagos.
B. Solicitar respuesta escrita de Gumroad incluyendo app, fuentes, CRM, exportaciones y posibles capacidades futuras.
C. Resolver precios, definición de contacto, límite por persona/empresa, accesos tras cancelación y costos de datos.
D. Construir servidor de licencias con pruebas negativas e idempotencia en **otro** PR.
E. Activar checkout únicamente tras autorización, implementación y prueba de cancelación/reembolso.
