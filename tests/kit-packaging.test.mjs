import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const get = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const files = ['commerce/PRODUCT-BIBLE-KITS-009.md','kits/personal/README.md','kits/personal/GUIA-DE-CAMPO.md','kits/enterprise/README.md','kits/enterprise/MATRIZ-DE-OPORTUNIDADES.md','ops/talorys/PILOTO-009.md','commerce/SOLICITUD-GUMROAD.md'];
test('all factual kit content exists and is nontrivial',()=>{
 for(const p of files) assert(get(p).length>750,p);
});
test('pre-launch materials disclose companion software and future limits',()=>{
 const product=get(files[0]);
 assert.match(product,/inclui|incluye|incluido|app/i);
 assert.match(product,/Gumroad/i);
 assert.match(product,/NO pretende ocultar/i);
 assert.match(product,/sin backend ni licencias/i);
});
test('personal and enterprise both deliver original operational material',()=>{
 assert.match(get(files[2]),/Prueba de pertinencia/);
 assert.match(get(files[4]),/Hipótesis falsable/);
 assert.match(get(files[4]),/(?:jamás|no).*equivale a retorno financiero/i);
});
test('Talorys pilot does not claim Cloudflare or Gumroad is connected',()=>{
 const pilot=get(files[5]);
 assert.match(pilot,/NO ejecutados aquí/);
 assert.match(pilot,/single-owner/);
 assert.match(pilot,/no despliega/);
 assert.match(pilot,/friendly-123/);
});
test('vendor review explicitly includes the application and export capability',()=>{
 const email=get(files[6]);
 assert.match(email,/including the clearly disclosed companion app/);
 assert.match(email,/CSV export/);
 assert.match(email,/not.*disguise/i);
});
