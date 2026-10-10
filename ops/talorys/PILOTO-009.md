# Talorys para la empresa de una persona · PILOTO LOCAL, AISLADO
Fuente examinada: https://github.com/rociiu/talorys, código open-source **MIT**. Diseñado por sus autores como agente **single-owner**; no es un CRM SaaS multiinquilino, ni verificador Gumroad, ni plugin de BuscaClientes. Los avisos de licencia MIT deben acompañar cualquier distribución modificada de Talorys.

## Uso elegido
**Asistente editorial y operativo privado** que gestiona tareas, memorias y notas de producción de los kits Personal/Enterprise. Mantener BuscaClientes como fuente de aplicación y Notion/Obsidian como corpus editorial ya existentes. No migrar datos por defecto y no integrar Talorys en el frontend de compradores.

### Primera automatización propuesta (sin instalar todavía)
- Proyecto: «BuscaClientes — kits Personal y Enterprise».
- Tarea recurrente interna: «Auditar guías y plantillas: distinguir material entregado de material pendiente; cotejar cada promesa con tests y producto».
- Tarea recurrente interna: «Revisar los riesgos editoriales y las políticas Gumroad antes de publicar cambios en producto».
- Nota: «Registro de fuentes, fecha, versiones y enlaces de cada recurso».
Estas tareas se configuran manualmente **después** de autorizar instalación y comprobar costos. No son automatizaciones ya activas.

## Lo que el código de Talorys realmente hace
React+Vite vía Cloudflare Pages, Worker Hono privado mediante service binding, un Durable Object SQLite, Workers AI opcional y alarms. Contraseña única del propietario, sesiones cookie HttpOnly y herramientas limitadas a CRUD local; sus herramientas **no hacen navegación web ni envían email ni editan GitHub**. Un AI agent no equivale aquí a un sistema de publicación autónoma en Gumroad.

## Puerta de seguridad antes de instalar
- Aprobar explícitamente el **destino Cloudflare**: preferir cuenta separada de la producción crítica de friendly-123, con límites y visibilidad de facturación.
- Verificar versión/commit y dependencias. Repositorio observado en 2026-10-10; no ejecutar `npx ...@latest` automáticamente.
- No cargar contactos personales de clientes, credenciales Gumroad, ni material comercial confidencial antes de revisar tratamiento Cloudflare Workers AI.
- Ejecutar pruebas locales con mock AI antes de cualquier despliegue.
- Comprobar backup, restauración reversible, timezones, fallos de cuotas y seguridad de sesiones.
- Documentar `talorys.json` y URL resultante, sin secretos, luego de instalar. No colocar contraseñas o tokens en GitHub/Notion.
- Cloudflare puede facturar uso adicional si la cuenta tiene plan de pago; no dar por sentado costo cero.

## Comandos de investigación (NO ejecutados aquí)
```bash
git clone https://github.com/rociiu/talorys.git
cd talorys
git checkout <commit-auditado>
npm ci
npm run typecheck
npm test
npm run dev
```
`npm run dev` crea un entorno **local** y usa AI simulado, no despliega. Revisar antes de permitir red a otros dispositivos. El instalador Cloudflare es una fase **posterior**: `npx create-talorys@<version-fijada>` con aprobación explícita del usuario, no automática.

## Separación obligatoria
Talorys = **back-office editorial personal**.
BuscaClientes = **producto y CRM de compradores**, hoy local.
Gumroad = **eventual distribución de kits y cobros**, pendiente de confirmación de admisibilidad.
No acoplar sesiones de Talorys con usuarios de BuscaClientes, no usar el Durable Object único de Talorys como backend multiusuario, no acceder a friendly-123 ni cambiar sus Workers.
