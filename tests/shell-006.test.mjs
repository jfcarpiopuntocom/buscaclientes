import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const R=path.join(import.meta.dirname,'..');
const read=n=>fs.readFileSync(path.join(R,n),'utf8');
const source=read('opportunity-matrix.js');
const context={window:{},URL,console};vm.runInNewContext(source,context);
const api=context.window.BC_OPPORTUNITIES;
const html=read('dashboard.html'),js=read('dashboard.js'),index=read('index.html');
const sample=[
 {id:'osm-1',name:'Café Norte',category:'cafe',lat:-2.91,lon:-79.01,website:'example.com',phone:'',stage:'new'},
 {id:'osm-2',name:'Café Centro',category:'cafe',lat:-2.92,lon:-79.02,phone:'555-1234',stage:'contacted'},
 {id:'osm-3',name:'Tienda Sur',category:'shop',lat:-2.93,lon:-79.03,stage:'followup'},
 {id:'osm-1',name:'Café Norte - duplicate',category:'cafe',lat:-2.91,lon:-79.01},
 {id:'demo',name:'Tienda simulada',category:'shop',demo:true,lat:-2.8,lon:-79},
];
test('shell 006 link and title preserve approved name, shell and legacy app',()=>{
 assert.match(index,/v1\.0 shell 0(?:0[6789]|1[012])/);
 assert.match(index,/href="\.\/dashboard\.html"/);
 assert.match(html,/BuscaClientes: el mundo está lleno de clientes/);
 assert.match(index,/function makeCRMCSV/);
 assert.match(index,/function persistCRM/);
 assert.match(index,/const quotaKey='bc-credits-'\+week\(\)/);
 assert.match(index,/function save\(r,isDemo\)/);
 assert.match(index,/window\.BC_DASHBOARD_SOURCE=\(\)=>/);
 assert.match(index,/window\.BC_DASHBOARD_PUBLISH\?\.\(\)/);
 assert.doesNotMatch(index,/GUMROAD_PRODUCT_ID|password=|SECRET_KEY/);
});
test('no sample data or fictional claims on an empty dashboard',()=>{
 const d=api.analyse([]);assert.equal(d.stats.count,0);assert.equal(d.stats.located,0);
 assert.equal(d.forces.length,5);assert(d.forces.every(f=>f.metric===null||f.metric===0));
 assert.equal(d.geo.usable,false);
 assert.match(html,/Sin sincronización remota ni contraseña configurada/);
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(html,/USD 1000|75% más|retorno garantizado/i);
});
test('deduped observed companies, no demonstrations and no profits inferred',()=>{
 const d=api.analyse(sample);assert.equal(d.stats.count,3);
 assert.equal(d.stats.located,3);
 assert.equal(d.stats.withWebsite,1);
 assert.equal(d.stats.withChannel,2);
 assert.equal(d.stats.websitePublishedPct,33);
 assert.equal(d.forces[0].metric,3);
 for(const x of d.forces.slice(1)){assert.equal(x.metric,null);assert.equal(x.status,'NO MEDIDO')}
 assert.equal(d.geo.cells.reduce((n,c)=>n+c.count,0),3);
 assert(!Object.keys(d).some(k=>/yield|profit|ROI/i.test(k)));
});
test('data integrity: leading formulas and dangerous URLs are not trusted',()=>{
 const obj=api.normalize({id:'1',name:'=<script>alert(1)</script>',website:'javascript:alert(1)',phone:'=1+1',lat:'10.1',lon:'-2.2'});
 assert.equal(obj.website,'');
 assert.equal(obj.lat,10.1);
 assert.match(obj.name,/script/);
 assert.match(js,/\.textContent=/);
 assert.match(js,/if\(\/\^\[=\+@-\]\/\.test\(s\)\)/);
 assert.doesNotMatch(js,/innerHTML=/);
});
test('no real geography is invented and invalid geocodes are excluded',()=>{
 const d=api.analyse([{id:'one',name:'A',lat:null,lon:null},{id:'bad',name:'B',lat:400,lon:-80}]);
 assert.equal(d.stats.count,2);
 assert.equal(d.stats.located,0);
 assert.equal(d.geo.points.length,0);
 assert.equal(d.geo.usable,false);
});
test('Porter coverage does not confuse sample count with actual rivalry',()=>{
 const forces=api.porter(sample);assert.equal(forces.length,5);
 assert.match(forces[0].evidence,/NO censo completo/);
 assert.deepEqual(Array.from(forces.map(f=>f.id)),['rivalry','buyers','suppliers','entrants','substitutes']);
 assert(forces.slice(1).every(x=>x.evidence.includes('Sin datos')));
});
test('dashboard bridge is same-origin, read-only and never leaks CRM by fetch',()=>{
 const s=read('dashboard-bridge.js');
 assert.match(s,/BroadcastChannel/);
 assert.match(s,/bc-dashboard-s006/);
 assert.match(s,/bc-crm-durable-v1/);
 assert.match(s,/kind:'bc:snapshot'/);
 assert.match(s,/kind:'bc:hello'/);
 assert.doesNotMatch(s,/(?:fetch\(|XMLHttpRequest|sendBeacon|postMessage\s*\(\s*['"]https?:)/);
 assert.doesNotMatch(s,/localStorage\?\.setItem|localStorage\.setItem/);
});
test('dashboard never mutates CRM; chart, report and export work without CDN',()=>{
 assert.match(html,/id="geoMap"/);assert.match(html,/id="forces"/);
 assert.match(html,/id="contacts"/);assert.match(html,/id="csv"/);assert.match(html,/id="print"/);
 assert.match(js,/connection\.refresh\(\)/);
 assert.match(js,/new Blob\(\[csv\]/);
 assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem|\.setAttribute\(['"]stage['"]/);
 assert.doesNotMatch(html,/https:\/\/(?:unpkg|cdn|cdnjs)\./);
});
test('app inline script remains syntactically valid',()=>{
 const classics=[...index.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>m[1].trim()==='');
 assert.equal(classics.length,1);
 assert.doesNotThrow(()=>new Function(classics[0][2]));
});
