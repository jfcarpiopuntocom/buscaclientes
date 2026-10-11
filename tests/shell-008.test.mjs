import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const dir=path.join(import.meta.dirname,'..');
const read=f=>fs.readFileSync(path.join(dir,f),'utf8');
const context={window:{},console};
vm.runInNewContext(read('city-coherence.js'),context);
const {create,valid,clean}=context.window.BC_CITY_TRUTH;
const html=read('index.html'),scan=read('terminator-scan.js');
test('01 city selection is authoritative and immutable',()=>{
 const s=create(),token=s.choose('Austin, Texas, USA','gift_shop',30.26,-97.74);
 assert.equal(s.state.name,'Austin, Texas, USA');assert.equal(s.state.epoch,token);
 assert.equal(s.state.status,'located');assert(Object.isFrozen(s.state));
});
test('02 normalization trims city text without changing international names',()=>{
 assert.equal(clean('  Port    Townsend, Washington, USA  '),'Port Townsend, Washington, USA');
 assert.equal(clean(null),'');
});
test('03 valid latitude/longitude including zero and date line',()=>{
 for(const p of [[0,0],[90,180],[-90,-180],[-2.9,-79]])assert(valid(...p));
});
test('04 missing and impossible coordinates never become a geographic target',()=>{
 for(const p of [[null,3],['',7],[91,2],[-91,3],[2,181],[2,NaN],[Infinity,5]])assert(!valid(...p));
});
test('05 pending manual city invalidates old map coordinates',()=>{
 const s=create();s.choose('Port Townsend','boutique',48,-122);s.draft('Austin','cafe');
 assert.equal(s.state.status,'unlocated');assert.equal(s.state.lat,null);assert.equal(s.state.lon,null);
});
test('06 stale asynchronous response cannot re-focus previous city',()=>{
 const s=create(),old=s.draft('Austin','gift_shop');s.draft('Cuenca','cafe');
 assert.equal(s.resolve(old,'Austin',30.26,-97.74),false);
 assert.equal(s.state.name,'Cuenca');assert.equal(s.state.status,'unlocated');
});
test('07 geocoded name must match selection exactly',()=>{
 const s=create(),token=s.draft('Cuenca, Ecuador','cafe');
 assert.equal(s.resolve(token,'Quito, Ecuador',-.2,-78),false);
 assert.equal(s.resolve(token,'Cuenca, Ecuador',-2.9,-79),true);
 assert.equal(s.state.name,'Cuenca, Ecuador');assert.equal(s.state.status,'located');
});
test('08 invalid geocoder reply never yields false coordinates',()=>{
 const s=create(),token=s.draft('Austin','gift_shop');
 assert.equal(s.resolve(token,'Austin',400,300),false);
 assert.equal(s.state.status,'unlocated');
});
test('09 random target updates form, country and sector with one token',()=>{
 assert.match(html,/const choice=pickSearchCity\(\),token=selectCityChoice\(choice\)/);
 assert.match(html,/cityInput\.value=name;setActiveCountry\(name\)/);
 assert.match(html,/\$\('category'\)\.value=category/);
 assert.match(html,/\$\('keyword'\)\.value=''/);
});
test('10 cached scan requires exact real city/category and nonfuture timestamp',()=>{
 assert.match(html,/cache\.at<=Date\.now\(\)/);
 assert.match(html,/periscopeCities\.some\(c=>c\[0\]===cache\.city&&c\[1\]===cache\.category\)/);
 assert.match(html,/selectCityChoice\(cachedTarget\);focusGlobeOnCity\(cachedTarget\)/);
});
test('11 manual form and quick city chips cannot retain old globe geocodes',()=>{
 assert.match(html,/const token=cityTruth\.draft\(city,\$\('category'\)\.value\)/);
 assert.match(html,/window\.dispatchEvent\(new CustomEvent\('bc:globe-scan'\)\)/);
 assert.match(html,/pos=>resolvedCity\(token,city,pos\.lat,pos\.lon\)/);
 assert.match(html,/data\.city\.lat,data\.city\.lon/);
 assert.match(html,/\$\('keyword'\)\.value='';search\(\)/);
});
test('12 country change and manual typing clear stale target',()=>{
 assert.match(html,/countrySelect\.addEventListener\('change',\(\)=>\{cityInput\.value='';loadCitiesForCountry\(countrySelect\.value\);window\.BC_CITY_DRAFT\?\.\(\)/);
 assert.match(html,/cityInput\.addEventListener\('input',\(\)=>\{suggestCities\(\);window\.BC_CITY_DRAFT\?\.\(\)/);
 assert.match(html,/COORDENADAS PENDIENTES/);
});
test('13 sample mode names Austin and positions globe on its fictional demo city',()=>{
 assert.match(html,/function sample\(\)\{const choice=\['Austin, Texas, USA','gift_shop',30\.26,-97\.74\];selectCityChoice\(choice\);focusGlobeOnCity\(choice\)/);
 assert.match(html,/Sample Handmade Studio \(fictional\)/);
});
test('14 dashboard results cannot be assigned to a different selected city',()=>{
 assert.match(html,/results:!demo&&cityTruth\.state\.name===lastResultCity\?lastResults\.filter\(x=>!x\.demo\):\[\]/);
 assert.match(html,/saved:saved\.filter\(x=>!x\.demo\)/);
});
test('15 cloudless globe does not instantiate cloud textures or spherical cover',()=>{
 assert.doesNotMatch(html,/earth_clouds_1024|const clouds=/);
 assert.match(html,/earth_normal_2048/);
});
test('16 Terminator cancels obsolete acquisitions before focus or query',async()=>{
 let current=true,focused=0;
 const nodes=new Map();
 const mk=()=>({textContent:'',classList:{add(){},remove(){}}});
 const win={matchMedia:()=>({matches:false}),dispatchEvent(){}};
 const harness={window:win,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,mk());return nodes.get(id)}},
 CustomEvent:class{constructor(name){this.type=name}},setTimeout(fn){current=false;queueMicrotask(fn)}};
 vm.runInNewContext(scan,harness);
 const result=await win.BC_TERMINATOR_SCAN(['Port Townsend','boutique',48,-122],()=>focused++,()=>current);
 assert.equal(result.cancelled,true);assert.equal(focused,0);
});
test('17 selecting a manual city can geocode before a search is launched',()=>{
 assert.match(html,/cityInput\.addEventListener\('change',\(\)=>\{/);
 assert.match(html,/const known=periscopeCities\.find/);
 assert.match(html,/const found=window\.BC_GEO_SCOPE\.choose\(geo,code\)/);
});
test('18 original CRM, quota, globe and dashboard remain present',()=>{
 for(const needle of ["const quotaKey='bc-credits-'+week()","function persistCRM(next=saved)","function save(r,isDemo)","window.BC_DASHBOARD_SOURCE=","BC_GYRO.create","BC_TERMINATOR_SCAN","function makeCRMCSV"])assert(html.includes(needle),needle);
 assert.match(html,/v1\.0 shell 013/);
 assert.match(html,/<script src="\.\/city-coherence\.js"><\/script>/);
});
