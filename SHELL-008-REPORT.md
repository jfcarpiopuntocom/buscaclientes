# BuscaClientes v1.0 shell 008 — coherencia absoluta de la ciudad
Fecha: 2026-10-10. Base inmutable de trabajo: shell 007, commit `fb344c31fc7fd5619df3a270c4d80a78d614ea32`.

## Alcance y causa raíz
El formulario empezaba por defecto en «Austin, Texas, USA» pero el Periscopio elegía aleatoriamente otra ciudad y orientaba el globo hacia ella. La búsqueda manual y los resultados recuperados del caché tampoco imponían la misma verdad geográfica a la interfaz. El usuario exigió corregirlo y otras doce inconsistencias previsibles **sin introducir productos nuevos, cambios de diseño, alteraciones del CRM, tarifas, fuentes o lógica comercial**.

## Doce guardas preventivas implementadas
1. Al seleccionar una ciudad aleatoria, el formulario visible recibe exactamente ese destino.
2. La categoría y el término de búsqueda del formulario se sincronizan con la consulta aleatoria; no se presenta una categoría anterior como si hubiese sido consultada.
3. El país visible se alinea con el sufijo explícito del destino, cuando es reconocible, sin imponer otro país ficticio.
4. Una ciudad seleccionada desde caché debe pertenecer al catálogo y coincidir exactamente con su categoría; se rechaza caché incoherente.
5. Se rechaza un timestamp futuro o expirado antes de restaurar ubicaciones del caché.
6. Al editar manualmente una ciudad, el globo deja de fingir que sigue enfocado en la ciudad anterior: muestra «SIN UBICAR» hasta tener geocodificación comprobada.
7. Cambiar el país limpia el destino anterior; no se deja una marca geográfica inconsistente.
8. Al cambiar la categoría, los resultados del Periscopio anterior se marcan como obsoletos sin alterar los contactos guardados.
9. Seleccionar una ciudad manualmente y salir del campo inicia un intento de ubicarla **sin exigir pulsar Explorar**. Una búsqueda manual también reorienta el globo con coordenadas verificadas; si el backend no trae coordenadas, no se inventan.
10. Los escaneos y las respuestas asíncronas obsoletas no pueden sobrescribir la ciudad escrita posteriormente; una señal de cancelación protege el zero-in y la renderización.
11. El modo de muestra ficticia se ancla explícitamente a Austin y conserva su naturaleza de demostración.
12. El dashboard no presenta resultados de otra ciudad bajo el nombre de la ciudad recién seleccionada; conserva inalterada la cartera persistente.

**Guardas extra:** latitud/longitud finitas y dentro de rango antes del foco; normalización inocua de nombres; ruta de error de la textura de nubes reparada (`clouds.visible=false;needsPaint=true`); retrocompatibilidad de los tests de shells 005, 006 y 007.

## Diseño preservado
Globo 3D, Terminator/zeroing-in, animación, randomizador y su historial, tarjetas y Periscopio, formulario, radar, CRM, 7 contactos semanales, exportación, dashboard atlas, mapas de muestra, roles comerciales futuros. **No se toca friendly-123.** Sin backend nuevo, login ficticio, pago ni IA externalizada.

## Pruebas
`tests/shell-008.test.mjs` añade 18 tests deterministas: selección, validez, cancelación, caché, país, ejemplo, fuente del dashboard y legado. Las aserciones E2E para Chromium y WebKit se integran al gate existente `shell-006-browser-qa.cjs`: ciudad aleatoria, recuperación de Port Townsend del caché, edición de Austin, estado sin coordenadas, geocodificación controlada realista y coincidencia entre selector, globo y país. Otras gates heredadas mantienen protección sobre ATLAS, Terminator, gyro, interacción, exportación y CRM.

## Estados honestos
Candidato hasta comprobar PR, 5 gates y despliegue Pages para SHA idéntico de main. Publicación no equivale a resultados reales de proveedores de mapas (en navegador se prueban fixtures aisladas); no afirmar validación de cada proveedor externo.
