import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const brand=read('brand-i18n.js'),whatsapp=read('public-whatsapp.js'),geo=read('geo-safe.js');
const kit=read('kit-libre.md'),page=read('kit-libre.html'),app=read('index.html'),dashboard=read('dashboard.html');
function script(source,globals={}){const ctx={window:{},URL,console,...globals};vm.runInNewContext(source,ctx);return ctx.window;}
test('01 brand uses one unchanged globe SVG with exact approved ES EN PT names',()=>{
 const names=script(brand).BC_BRAND.names;
 assert.equal(Array.from(names.es).join(''),'BuscaClientes');
 assert.equal(Array.from(names.en).join(''),'FindClients');
 assert.equal(Array.from(names.pt).join(''),'EncontraClientes');
 assert.match(app,/src="\.\/brand-globe\.svg"/);
 assert.match(dashboard,/src="\.\/brand-globe\.svg"/);
 assert.doesNotMatch(brand,/\.svg|innerHTML/);
});
test('02 public multilingual help offers thoughtful new beginnings, not internal debates',()=>{
 assert.match(app,/id="bcQuickHelp"/);assert.match(app,/id="bcHelpToggle"/);assert.match(app,/syncHelp\(\)/);
 assert.match(app,/Novos começos, novas ligações/);
 assert.match(app,/New beginnings, new connections/);
 assert.match(app,/Nuevos comienzos, nuevas conexiones/);
 assert.doesNotMatch(app.match(/function syncHelp\(\)[\s\S]*?function syncLangFlag/)[0],/TOS|scraping|framework|Gumroad|PayPal|aprobación interna/i);
});
test('03 kit is free for every person, with no login, payment or fake subscribers',()=>{
 assert.match(page,/href="\.\/kit-libre\.md"/);assert.match(page,/Sin cuenta, sin pago/);
 assert.match(kit,/ESPAÑOL/);assert.match(kit,/ENGLISH/);assert.match(kit,/PORTUGUÊS/);
 assert.match(kit,/No contiene listas de personas ni datos privados/);
 assert.doesNotMatch(page,/checkout|paypal\.com|gumroad\.com|subscribe|credit card/i);
});
test('04 published WhatsApp tag is explicit; phone numbers are NOT presumed WhatsApp',()=>{
 assert.match(app,/whatsapp:t\['contact:whatsapp'\]\|\|t\.whatsapp\|\|''/);
 assert.match(app,/window\.BC_WHATSAPP\.link\(r\.whatsapp\)/);
 assert.doesNotMatch(app,/BC_WHATSAPP\.link\(r\.phone\)/);
});
test('05 WhatsApp links accept explicit published URLs only, no messages or hostile URLs',()=>{
 const link=script(whatsapp).BC_WHATSAPP.link;
 assert.equal(link('+593 99 000 1234'),'https://wa.me/593990001234');
 assert.equal(link('https://wa.me/593990001234'),'https://wa.me/593990001234');
 assert.equal(link('https://api.whatsapp.com/send?phone=%2B593990001234'),'https://wa.me/593990001234');
 for(const value of ['','593990001234','javascript:alert(1)','https://wa.me.evil.com/593990001234','https://wa.me/593990001234?text=hey','https://evil.org','https://user@wa.me/593990001234'])
 assert.equal(link(value),'',value);
});
test('06 geocoder requests are user-triggered, throttled/cached and bounded per-browser',async()=>{
 const mem=new Map();
 const store={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v))};
 const safe=script(geo,{sessionStorage:store,setTimeout:cb=>{cb();return 1},clearTimeout:()=>{},Date});
 let called=0;
 const g=safe.BC_GEO_GUARD;
 const first=await g.lookup('Cuenca','EC',async()=>{called++;return [{name:'Cuenca'}]});
 const cached=await g.lookup('Cuenca','EC',async()=>{called++;return [{name:'another'}]});
 assert.equal(called,1);assert.equal(first,cached);
 for(let i=1;i<6;i++)await g.lookup('city'+i,'EC',async()=>{called++;return [{i}]});
 await assert.rejects(g.lookup('seventh','EC',async()=>[{bad:1}]),/límite prudente/);
 assert.equal(called,6);
 assert.match(geo,/NOT a service-wide Nominatim quota/);
});
test('07 the scanner shows observed businesses/channels, never inventing WhatsApp',()=>{
 assert.match(app,/whatsappCount|WhatsApp publicados/);
 assert.match(app,/bc-wa-link/);
 assert.match(app,/window\.BC_GEO_GUARD\.lookup\(city,countryCode/);
 assert.doesNotMatch(app,/wa\.me\/\$\{r\.phone\}/);
});
test('08 dashboard shares chosen language without tampering with public brand icon',()=>{
 assert.match(app,/localStorage\.setItem\('bc-lang',lang\)/);
 assert.match(dashboard,/BC_BRAND\.apply\(localStorage\.getItem\("bc-lang"\)/);
 assert.match(app,/v1\.0 shell 014/);
 assert.match(dashboard,/v1\.0 shell 014/);
});
