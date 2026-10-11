import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const ctx={window:{},console};vm.runInNewContext(read('geo-scope.js'),ctx);
const geo=ctx.window.BC_GEO_SCOPE;
const countries=['EC','US','GB'];const display=c=>({EC:'Ecuador',US:'United States',GB:'United Kingdom'})[c];
const ecuador=Object.freeze({lat:-1.8312,lon:-78.1834});
test('01 Ecuador is the country, not latitude zero or geographical equator',()=>{
 assert.equal(geo.countryName('Ecuador',countries,display),'EC');
 assert.equal(geo.countryName('Ecuador, Ecuador',countries,display),'EC');
 assert.equal(geo.countryName('Equador',countries,display),'EC');
 assert.equal(geo.countryName('Equator',countries,display),'');
 const anchor=geo.countryFocus('EC');assert(anchor.lat<-1&&anchor.lat>-6);assert(anchor.lon<-75&&anchor.lon>-82);
 assert.equal(anchor.lat,ecuador.lat);assert.equal(anchor.lon,ecuador.lon);
});
test('02 exact country selection does not mistake Quito or Austin for a country',()=>{
 assert.equal(geo.countryName('Quito, Ecuador',countries,display),'');
 assert.equal(geo.countryName('Austin, Texas, USA',countries,display),'');
 assert.equal(geo.countryName('United States',countries,display),'US');
});
test('03 reject equator line, cross-border hits, invalid coordinates',()=>{
 const line={lat:0,lon:-78,address:{country_code:'ec'},type:'equator'};
 const foreign={lat:0,lon:-77,address:{country_code:'co'},type:'city'};
 const good={lat:-2.89,lon:-79,address:{country_code:'ec'},type:'city'};
 assert.equal(geo.choose([line,foreign,good],'EC'),good);
 assert.equal(geo.choose([foreign],'EC'),null);
 assert.equal(geo.choose([{lat:200,lon:2,address:{country_code:'ec'}}],'EC'),null);
});
test('04 country geometries must be countries, not municipalities',()=>{
 const city={lat:-.18,lon:-78.47,address:{country_code:'ec'},addresstype:'city',type:'administrative',class:'boundary'};
 const country={lat:-1.8,lon:-78.2,address:{country_code:'ec'},addresstype:'country',type:'administrative',class:'boundary'};
 assert.equal(geo.choose([city,country],'EC',true),country);
 assert.equal(geo.choose([city],'EC',true),null);
 assert.equal(geo.choose([country],'US',true),null);
});
const html=read('index.html'),map=read('map-explorer.js'),dash=read('dashboard.html');
test('05 country dropdown sets geographic focus but country-only search asks for city',()=>{
 assert.match(html,/window\.BC_COUNTRY_FOCUS\?\.\(countrySelect\.value\)/);
 assert.match(html,/window\.BC_COUNTRY_FOCUS=focusCountry/);
 assert.match(html,/const countryOnly=countryOnlyName\(city\)/);
 assert.match(html,/Elige una ciudad de /);
 assert.match(html,/featuretype:'country',countrycodes:code\.toLowerCase\(\)/);
});
test('06 Nominatim results must match selected ISO and reject equivocal response',()=>{
 assert.match(html,/window\.BC_GEO_SCOPE\.choose\(matches,countryCode\)/);
 assert.match(html,/countryCode!==countrySelect\.value/);
 assert.match(html,/window\.BC_GEO_SCOPE\.choose\(geo,code\)/);
 assert.match(html,/limit:5,addressdetails:1,countrycodes:code\.toLowerCase\(\)/);
});
test('07 demo records can never enter the business intelligence snapshot',()=>{
 for(const id of [1,2,3])assert.match(html,new RegExp("id:'example-"+id+"',demo:true"));
 assert.match(html,/results:!demo&&cityTruth\.state\.name===lastResultCity\?lastResults\.filter\(x=>!x\.demo\):\[\]/);
 assert.match(read('opportunity-matrix.js'),/row\.demo\|\|\/\^example-/);
});
const txContext={window:{},console};vm.runInNewContext(read('crm-transaction.js'),txContext);
const tx=txContext.window.BC_CRM_TX;
function store(initial={},block=()=>false){
 const state=new Map(Object.entries(initial));
 return {state,getItem(k){return state.has(k)?state.get(k):null},
  setItem(k,v){if(block(k))throw Error('QuotaExceededError');state.set(k,String(v))},
  removeItem(k){state.delete(k)}};
}
test('08 successful CRM commit persists quota and durable records together',()=>{
 const data=store({quota:'[]',durable:'[{"id":"old"}]'});
 const result=tx.commit(data,[['quota','["a"]'],['durable','[{"id":"old"},{"id":"new"}]']]);
 assert(result.ok);assert.equal(data.getItem('quota'),'["a"]');assert.match(data.getItem('durable'),/"new"/);
});
test('09 if durable write fails, quota is restored and no contact is acknowledged',()=>{
 const data=store({quota:'[]',durable:'[{"id":"old"}]'},k=>k==='durable');
 const result=tx.commit(data,[['quota','["a"]'],['durable','[{"id":"old"},{"id":"new"}]']]);
 assert(!result.ok);assert(result.rolledBack);assert.equal(data.getItem('quota'),'[]');
 assert.equal(data.getItem('durable'),'[{"id":"old"}]');
});
test('10 if local storage fails immediately, original data is untouched',()=>{
 const data=store({quota:'[]',durable:'keep'},k=>k==='quota');
 assert(!tx.commit(data,[['quota','["a"]'],['durable','replace']]).ok);
 assert.equal(data.getItem('quota'),'[]');assert.equal(data.getItem('durable'),'keep');
});
test('11 editing notes and stages is committed before mutating in-memory rows',()=>{
 assert.match(html,/const next=saved\.map\(x=>x\.id!==id\?x:/);
 assert.match(html,/if\(!persistCRM\(next\)\)return;/);
 assert.match(html,/saved=next;showCRM\('saved'\)/);
 assert.match(html,/if\(!result\.ok\)\{/);
});
test('12 grouped markers let users access more than first 15 contacts',()=>{
 assert.match(map,/for\(const p of g\.rows\.slice\(0,visible\)\)/);
 assert.match(map,/visible=Math\.min\(g\.count,visible\+15\);detail\(g\)/);
 assert.match(map,/visible=15;render\(\)/);
 assert.match(dash,/id="bcMapDetail"/);
});
test('13 no destructive commerce, downloads or new external data engines',()=>{
 assert.doesNotMatch(read('geo-scope.js'),/localStorage|\.removeItem\(/);
 assert.doesNotMatch(read('crm-transaction.js'),/fetch\(/);
 assert.match(html,/v1\.0 shell 013/);
 assert.match(dash,/v1\.0 shell 013/);
 assert.match(html,/worldMarker:'El mundo está lleno de clientes'/);
});
