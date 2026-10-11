import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('approved product identity for Spanish English and Portuguese, original logo unchanged',()=>{
 const brand=read('brand-i18n.js'),ctx={window:{}};vm.runInNewContext(brand,ctx);
 const {names,descriptors}=ctx.window.BC_BRAND;
 assert.equal([...names.es].join('')+': '+descriptors.es,'BuscaClientes: Búsqueda + CRM');
 assert.equal([...names.en].join('')+': '+descriptors.en,'FindClients: Search Satellite + CRM');
 assert.equal([...names.pt].join('')+': '+descriptors.pt,'EncontraClientes: Busca + CRM');
 assert.doesNotMatch(brand,/<svg|innerHTML/);
});
test('all first-screen brands and headline omit slogan ending punctuation in ES EN PT',()=>{
 const index=read('index.html');
 assert.match(index,/<span class="bc-product-descriptor" id="bcBrandDescriptor">: Búsqueda \+ CRM<\/span>/);
 for(const t of ['El mundo está lleno de <em>clientes</em>','The world is full of <em>clients</em>','O mundo está cheio de <em>clientes</em>']) assert(index.includes(t),t);
 assert.doesNotMatch(index,/\b(clientes|clients)\.<\/em>/);
 assert.match(index,/document\.title=window\.BC_BRAND\.names\[lang\]/);
 const dashboard=read('dashboard.html');
 assert.match(dashboard,/: Búsqueda \+ CRM/);
 assert.doesNotMatch(dashboard,/El mundo está lleno de clientes\./);
});
test('No View Example button, fake demo dispatch or fictitious businesses; retain example searches',()=>{
 const app=read('index.html');
 for(const t of ['id="sampleButton"','function sample(){',"sampleButton:","sampleButton').addEventListener","Sample Handmade Studio (fictional)","Sample Artisan Market (fictional)"]) assert(!app.includes(t),t);
 for(const sample of ['Portland · Artisans','Miami · Florists']) assert(app.includes(sample),sample);
 assert.match(app,/Elige una ciudad y categoría para encontrar negocios reales/);
});
test('all entry points share full branded header',()=>{
 const plans=read('planes.html'),personal=read('personal/index.html'),dashboard=read('dashboard.html');
 for(const src of [plans,personal,dashboard])assert.match(src,/class="bc-product-descriptor"/);
 assert.match(personal,/id="bcBrandDescriptor"/);
 assert.match(plans,/src="\.\/brand-globe\.svg"/);
 assert.match(dashboard,/src="\.\/brand-globe\.svg"/);
});
