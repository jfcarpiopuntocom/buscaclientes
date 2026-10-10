# BuscaClientes · v1.0 shell 007 — Atlas territorial verificable

## Alcance aprobado
Continuación aditiva del shell 006. **Único producto modificado: BuscaClientes.** El dashboard de friendly-123 es una referencia de UX, no una integración de datos. Se preservan globo, Terminator, búsqueda, periscopio, CRM local, dashboard base, CSV, QA y catálogo de servicios heredados.

## Qué se implementó
- Atlas de **nueve cuadrantes territoriales comparables** cuya extensión se mantiene fija al filtrar sectores, usando exclusivamente las coordenadas existentes de la muestra de BuscaClientes.
- Selector dinámico de sector, cuadrantes táctiles accesibles, nombres y fuente de cada negocio observado, disponibilidad de canal público y aviso de geocódigos faltantes.
- Superposición opcional en el mapa SVG que representa **densidad de la muestra**, nunca rendimiento financiero, potencial de demanda ni prueba de ventaja competitiva.
- Vista de las cinco preguntas de Porter invertida; se distingue rivalidad observada de demanda, compradores, proveedores, sustitutos y barreras todavía no medidos. No se inventa la fórmula propietaria del autor.
- Exportación CSV del atlas con neutralización de fórmulas de hojas de cálculo. No guarda datos, no genera credenciales ni altera CRM.
- Actualización por el mismo puente ya existente de la aplicación local. No habilita acceso remoto, contraseña ni multiusuario; siguen pendientes del servidor y autorización.

## Límites científicos y de privacidad
La ausencia de web en un registro OSM no implica ausencia real de web; celdas vacías no demuestran mercados desatendidos. La rentabilidad no puede pronosticarse con una muestra de establecimientos. Para validar una tesis high yield hacen falta demanda local, precios, costos, barreras de entrada, sustitutos, calidad de muestra, fecha y fuente.

## Pruebas y publicación
Tests unitarios `tests/shell-007.test.mjs`, browser CI `shell-007-browser-qa.cjs` en Chromium/WebKit (390 y 1440 px), regresiones de shells 005/006 y Terminator. La creación del workflow nuevo fue bloqueada por las comprobaciones de seguridad del conector. Se añadieron las aserciones 007 al browser QA 006 existente para que el gate heredado las ejecute en las propuestas a main. Script 007 separado disponible para futuras suites.

Estado: **candidato** hasta verificar CI, revisión, merge y Pages con SHA exacto.
