# Busca Clientes — Beta 0.1

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