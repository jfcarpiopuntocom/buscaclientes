import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const R=path.join(import.meta.dirname,'..');
const read=n=>fs.readFileSync(path.join(R,n),'utf8');
const context={window:{},URL,console};
vm.runInNewContext(read('opportunity-matrix.js'),context);
context.window.BC_OPPORTUNITIES=context.window.BC_OPPORTUNITIES;
vm.runInNewContext(read('territory-lab.js'),context);
const inspect=context.window.BC_TERRITORY_LAB.inspect;
const rows=[
 {id:'osm1',name:'Café Uno',category:'cafe',lat:-2.90,lon:-79.01,website:'cafe.example',source:'OSM'},
 {id:'osm2',name:'Café Dos',category:'cafe',lat:-2.92,lon:-79.03,phone:'123',source:'OSM'},
 {id:'osm3',name:'Tienda Centro',category:'shop',lat:-2.91,lon:-79.02,source:'OSM'},
 {id:'osm1',name:'duplicate',category:'cafe',lat:-2.9,lon:-79.01},
 {id:'demo',name:'Fake',category:'cafe',lat:-2.95,lon:-79.05,demo:true},
 {id:'off',name:'Sin coordenadas',category:'shop',lat:999,lon:-79.01}
];
test('shell007 empty state does not invent any market outcomes',()=>{
 const r=inspect([]);
 assert.equal(r.selected,0);assert.equal(r.located,0);assert.equal(r.cells.length,9);
 assert(r.cells.every(c=>c.count===0));
 assert.equal(r.forces.length,5);assert.equal(r.forces[1].observed,null);
 assert.match(r.yieldStatus,/NO ESTIMABLE/);
 assert.match(r.interpretation,/INSUFICIENTE/);
});
test('fixed sample frame prevents re-scaling sector cells',()=>{
 const all=inspect(rows),cafe=inspect(rows,'cafe'),shop=inspect(rows,'shop');
 assert.equal(all.observed,4);assert.equal(all.located,3);assert.equal(all.outside,1);
 assert.equal(cafe.located,2);assert.equal(shop.located,1);
 assert.equal(cafe.cells.reduce((x,c)=>x+c.count,0),2);
 assert.equal(shop.cells.reduce((x,c)=>x+c.count,0),1);
 assert.equal(all.cells.reduce((x,c)=>x+c.count,0),3);
 assert.deepEqual(JSON.parse(JSON.stringify(all.frame)),JSON.parse(JSON.stringify(shop.frame)));
 assert.deepEqual(JSON.parse(JSON.stringify(all.frame)),JSON.parse(JSON.stringify(cafe.frame)));
 assert(all.sectors.includes('shop')&&all.sectors.includes('cafe'));
 assert(!all.cells.some(c=>c.rows.some(r=>r.demo)));
});
test('only observable sample signals are measured',()=>{
 const cafe=inspect(rows,'cafe'),cells=cafe.cells;
 assert.equal(cells.reduce((n,c)=>n+c.withWebsite,0),1);
 assert.equal(cells.reduce((n,c)=>n+c.withChannel,0),2);
 assert.equal(cells.reduce((n,c)=>n+c.unpublishedWebsite,0),1);
 assert.equal(cafe.forces[0].observed,2);
 for(const f of cafe.forces.slice(1))assert.equal(f.observed,null);
 assert(!Object.keys(cafe).some(k=>/predictedProfit|ROI|profitScore/i.test(k)));
 assert.match(cafe.disclaimer,/no significa/);
});
test('visual controls integrate without editing CRM or touching source app',()=>{
 const script=read('territory-lab.js'),html=read('dashboard.html'),
       css=read('territory-lab.css'),app=read('index.html'),dash=read('dashboard.js');
 assert.match(html,/v1\.0 shell 0(?:0[789]|1[012])/);
 assert.match(app,/v1\.0 shell 0(?:0[789]|1[012])/);
 for(const id of ['tlSector','tlGrid','tlDetails','tlEvidence','tlOverlayToggle','tlExport'])
  assert(html.includes('id="'+id+'"'));
 assert.match(html,/territory-lab\.css/);assert.match(html,/territory-lab\.js/);
 assert.match(dash,/bc:snapshot-ready/);
 assert.match(script,/new Blob\(\[data\]/);
 assert.match(script,/\.textContent=/);
 assert.match(css,/focus-visible/);
 assert.doesNotMatch(script,/localStorage\.setItem|sessionStorage\.setItem|fetch\(|XMLHttpRequest|innerHTML\s*=/);
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/Sin sincronización remota ni contraseña configurada/);
});
