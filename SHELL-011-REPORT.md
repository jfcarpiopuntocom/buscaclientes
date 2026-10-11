# BuscaClientes v1.0 Shell 011 — Mapa de contactos observados y acciones verificables
**Estado inicial:** candidato aislado desde Shell 010, no otros sistemas. Del hilo reciente se preservan: VendorsMap UX read-only, elegante sin subrayados inclinados, globo sin nubes, lema EN el globo, selector/globo misma ciudad, datos OSM autorizados, CRM y cuota de 7 contactos elegidos, Lemon Squeezy como prioridad comercial provisional.

## Siete mejoras implementadas
1. Marcadores agrupados automáticamente cuando negocios OBSERVADOS coinciden en una zona del mapa SVG; el número cuenta establecimientos de la muestra, no potencial de mercado.
2. Marcadores accesibles mediante clic, Enter o espacio y estado de selección con contraste visible.
3. Panel de fichas de los establecimientos seleccionados, con sector, dirección y origen de datos; nunca inferir que ausencia de contacto es ausencia de negocio.
4. Filtros clicables con totales honestos por web publicada, email publicado, teléfono publicado, ninguno y todos, con selección visible.
5. Geografía constante al filtrar: el marco espacial se calcula una sola vez sobre todas las coordenadas válidas, evitando saltos falsos.
6. Acciones adecuadas: abrir sitio y fuente solo cuando haya URLs HTTPS/HTTP plausibles; abrir la cartera en la app solo para contactos ya guardados. Ninguna edición inventada ni navegación externa obligatoria.
7. Comportamiento móvil/escritorio, teclado, estados vacíos y conservación de todos los workflows y datos de los shells anteriores.

## Fuente de inspiración, sin copiar datos
VendorsMap: https://vendorsmap.com/map y https://vendorsmap.com/blog/how-to-use-vendorsmap . Su map-first explorer utiliza clustering, filtros y ficha→acción; adaptamos solo principios de diseño. No se extrajo ningún dato de VendorsMap, ni se implementaron solicitudes a ferias ni mensajería automática.

## Comercial — NO simular lo que falta
Se estudió el archivo entregado por el propietario **Handoff accionable: cobros de BuscaClientes desde Ecuador** (10 oct 2026). Lemon Squeezy como opción preferente por experiencia de checkout y PayPal, pero falta evidencia de tienda activada, elegibilidad y cumplimiento, firmas webhook, cartera de licencias y créditos server-side. Tareas T1–T7 y O1–O8 están en Notion; nada conecta cobros en este shell.

## Garantías
- No se toca la escena del globo, texturas, zero-in, ni sus coordenadas.
- Ninguna mutación de CRM, contactos, datos personales ni cuota (dashboard es un visor).
- Sin API nueva, scraper nuevo, cuota nueva, checkout nuevo o proveedor de pagos.
- Densidad de muestra ≠ demanda ≠ rentabilidad. Mapas SVG sin proveedor externo.
- Sin subrayados naranjas en titulares ni decoraciones inclinadas.
- Cada cambio está en módulo separado; aserciones puras, de integración y Chromium/WebKit con casos de muestra.
