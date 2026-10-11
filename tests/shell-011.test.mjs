import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const raw=fs.readFileSync(new URL('../map-explorer.js',import.meta.url),'utf8');
const ctx={window:{BC_OPPORTUNITIES:{}},console};
vm.runInNewContext(raw,ctx);
const {cluster,matches,FILTERS}=ctx.window.BC_MAP_EXPLORER;
const p=(id,x,y,other={})=>({id,name:id,x,y,website:'',email:'',phone:'',...other});
test('01 bins near business coordinates without fabricating pins',()=>{
 const data=cluster([p('a',.2,.25),p('b',.205,.26),p('c',.88,.91)]);
 assert.equal(data.length,2);assert.equal(data.reduce((sum,c)=>sum+c.count,0),3);
 assert.equal(data.find(c=>c.count===2).rows.length,2);
});
test('02 clustering is stable regardless of source record order',()=>{
 const rows=[p('z',.31,.22),p('a',.305,.223),p('b',.9,.3)];
 const forward=cluster(rows).map(c=>c.rows.map(p=>p.id).join(','));
 const backward=cluster(rows.slice().reverse()).map(c=>c.rows.map(p=>p.id).join(','));
 assert.deepEqual(forward,backward);
});
test('03 non-geolocated or out-of-range points are never mapped',()=>{
 const rows=[p('good',.45,.5),p('bad',NaN,.2),p('x',2,.2),p('n',null,.5)];
 assert.equal(cluster(rows).reduce((sum,c)=>sum+c.count,0),1);
});
test('04 the original map coordinate frame is unchanged by filtering',()=>{
 const rows=[p('a',.3,.4,{website:'example.org'}),p('b',.85,.91)];
 const full=cluster(rows),filtered=cluster(rows.filter(p=>matches(p,'web')));
 assert.equal(full.reduce((sum,c)=>sum+c.count,0),2);
 assert.equal(filtered[0].x,50+800*.3);assert.equal(filtered[0].y,35+400*.4);
});
test('05 filters use published channel fields, not inferred demand',()=>{
 const rows=[p('a',.1,.1,{email:'a@example.com'}),p('b',.3,.3,{phone:'123'}),p('c',.4,.4,{website:'example.com'}),p('d',.6,.6)];
 assert.deepEqual(FILTERS.map(f=>rows.filter(r=>matches(r,f.id)).length),[4,1,1,1,1]);
});
test('06 no market-value or search-result mutation and only safe external links',()=>{
 assert.doesNotMatch(raw,/fetch\(|localStorage\.setItem|XMLHttpRequest|google\.com\/maps/);
 assert.match(raw,/safeExternal/);assert.match(raw,/^.*noopener noreferrer.*$/m);
 assert.match(raw,/No se infiere demanda, oportunidad garantizada ni rentabilidad/);
});
test('07 keyboard, role, status and immutable CRM authority',()=>{
 for(const token of ['bc:snapshot-ready','aria-pressed','aria-label','tabindex:0',"e.key==='Enter'","e.key===' '",'bcMapFilters','bcMapDetail'])assert(raw.includes(token),token);
});
test('08 no links to unverified individual contact channels',()=>{
 assert.doesNotMatch(raw,/mailto:|tel:/);
 assert.match(raw,/Dirección no publicada/);
 assert.match(raw,/Sin fecha de verificación publicada/);
});
