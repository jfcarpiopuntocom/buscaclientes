# BuscaClientes v1.0 Shell 013 — evidencia verificable y guardado seguro
Fecha 10 octubre 2026. Base publicada Shell 012 `5c22c4c339564d1f1895fc5306880428f384fa23`.

## Siete micromejoras documentadas
1. **Contact Scout: procedencia exigida.** Comparar host normalizado del sitio público del negocio y página de evidencia, bloquear esquemas fuera de HTTP(S), URL con usuario/clave y otros dominios, sin confundir prefijos de nombre de dominio.
2. **Contact Scout: limpieza de datos.** Validación de correos/teléfonos públicos, deduplicación, límites de longitud y cantidad; ninguna dirección de correo ni teléfono se presume verificado por la mera extracción.
3. **Contact Scout: actualización sin pérdida.** Preparar clon del contacto y *snapshot* de cartera; persistir con `persistCRM(next)` antes de mutar objetos de resultados o cartera, y avisar del fallo si no se pudo guardar.
4. **Servicio de enriquecimiento: respuestas defendidas.** Validación estructural de `emails/phones/pages`, origen de páginas del mismo host, rechazo de listados falsos y evidencia externa; no inventar páginas cuando el proveedor no devuelve ninguna.
5. **Servicio de enriquecimiento: transacción.** Misma función de commit-first, preserva notas, etapa, correo anterior y teléfono anterior; error mantiene registros previos intactos.
6. **Servicio externo: plazo y reentrada.** AbortController con máximo 20 segundos, impedir consultas solapadas para una misma ficha y restaurar botón siempre en finally. No se habilitan motores ni APIs nuevas.
7. **Mapa → cartera que funciona.** «Abrir cartera» enlaza a `?view=saved#radar` y la app abre realmente la pestaña de guardados, sin mezclar con los resultados de la última búsqueda; enlaces sin IDs privados en la URL.

## Invariantes
Sin modificaciones del globo cloudless, Ecuador como país, zeroing, lema en globo, blanco/teal/navy sin subrayado del headline, fuentes OSM, API de búsqueda, cuota de siete contactos semanales, datos existentes, dashboard, mapas Porter, idiomas ES/EN/PT, precios o cobros. Se modifica únicamente el código de enriquecimiento y destino de la vista CRM. La app permanece en navegador local; no hay backend premium ni Lemon Squeezy activo.

## Evidencia de verificación
Nuevo módulo `contact-evidence.js` con tests VM y negativos. Se reutilizan gates 005–012 y pruebas Chromium/WebKit de dashboard. **No afirmar CI/producción verde antes de comprobaciones.** Enlace PR y SHA exactos se anexarán luego.
