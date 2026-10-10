# BuscaClientes — v1.0 shell 005

**Eslogan público:** BuscaClientes: el mundo está lleno de clientes. **Producto:** BuscaClientes; ningún nombre interno de propuesta gráfica debe presentarse como marca comercial.

## Alcance implementado en este shell
- Mantiene la interfaz pública aprobada: globo Three.js, retícula Terminator, Periscopio, formulario, Radar, Contact Scout, filtros de cadenas/independientes, CRM local y exportación CSV.
- Incorpora un resorte de orientación **con convergencia y bloqueo físico finitos** (`gyro-motion.js`). Una nueva búsqueda vuelve a activar el rastreo del globo; después del zeroing in, el planeta se estabiliza exactamente en el destino y la fase de renderizado 3D en reposo **no realiza redraws continuos**. `ResizeObserver`, texturas asíncronas y nuevos destinos permiten un repaint cuando hace falta. Compatible con movimiento reducido.
- Actualiza título/metadata pública con el eslogan. Unifica las etiquetas humanas «contactos» en lugar de «prospectos» en textos visibles, estados del CRM y CSV; los campos e identificadores internos permanecen inalterados.
- Añade una capa editorial sin estructura adicional (`shell-005-editorial.css`) con la paleta aprobada navy, cobalto, carmesí, petróleo y hielo y **naranja vivo provisional** (#FF6900) únicamente para subrayados/acento seleccionados. **No confundir el hex propuesto con el naranja histórico de JFCarpio.com, pendiente de verificar.**
- No modifica el algoritmo de búsqueda, los proveedores OSM/Wikidata/World Bank/GDELT, los campos de CRM, los secretos, los cobros ni la política de almacenamiento. El contador local actual de siete contactos elegidos semanalmente permanece sin backend de protección antifraude; no prometer protección fuerte.

## No implementado: especificación de próximos shells, sin falsos paywalls
- **Personal**: precio propuesto USD 7/mes y hasta 250 contactos por semana todavía por validar con costes reales. Filtros más finos, investigación pública y múltiples ejecutivos por empresa según fuente; dashboard CRM individual y bonus comerciales (plantillas originales, checklists y guías).
- **Enterprise**: precio pendiente entre USD 20, USD 100 y estructura escalable. Dashboard CRM de equipo distinto del personal, permisos, territorios, responsables, análisis agregado, deduplicación, plantillas para equipos e integración —todo ello requiere backend y test real antes de prometerlo.
- **Contactos** es el término visible; leads/prospects/accounts son términos de implementación. Aún está abierto si cada ejecutivo revelado o cada empresa guardada cuenta como un contacto al aplicar límites.
- **Gumroad**: sin producto configurado y sin licencias de pago desplegadas. **Cloudflare**: sin acceso confirmado para despliegues. Proteger servicios de friendly-123; no desplegar allí sin autorización.
- **Futuro bonus editorial**: guías para hallar clientes, estrategias de contacto, emails y WhatsApp de presentación, secuencias de seguimiento, manejo de objeciones y propuestas. Crear contenido original con fuentes y evaluar qué va gratis o incluido en cada tier.
- **Fotografías de establecimientos**: candidato Wikimedia Commons en rama experimental, sin incorporar a este shell por riesgo de imágenes incorrectas, atribución y disponibilidad.

## Controles de calidad
- Tests unitarios de regresión y sintaxis completa del JavaScript inline.
- Nuevos tests `tests/shell-005.test.mjs`: resorte estable, segunda adquisición, dateline, movimiento reducido, canvas sin repaint cuando fijo, copia y exportación intactas.
- `shell-005-browser-qa.cjs`: Playwright Chromium/WebKit en escritorio y móvil, verificar canvas idéntico un tiempo después del bloqueo, eslogan, shell, DOM, ausencia de overflow y excepciones.
- `terminator-browser-qa.cjs`: asegurar rastreo → zero-in → consulta y proveedores externos simulados, sin confundir fixtures con disponibilidad real.
- CI workflow `.github/workflows/shell-005-gate.yml`. **No declarar release completo hasta workflow verde y Pages desplegado con commit exacto.**

## Puntos para inspección personal del dueño
1. Naranja de subrayados versus el color histórico de Publicaciones: [nota de emergencia](https://app.notion.com/p/3f51642b67f381b9a85ae724f333a09e).
2. Legibilidad 390px/1440px, zeroing in y suspensión sin cámara móvil.
3. Definición aprobada de la unidad «contacto» y fórmula que evite abuso de licencias personales sin penalizar exploración.
4. No utilizar etiquetas técnicas para nombrar el producto.

**Notion:** [Decisiones comerciales y lenguaje](https://app.notion.com/p/3f51642b67f38170be98ff17ad507c18). [Biblia de producto](https://app.notion.com/p/3f41642b67f381f1ad3dda1501ce2475).
