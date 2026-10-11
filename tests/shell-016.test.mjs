import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const page=read('personal/index.html'),dash=read('dashboard.html'),dashboardJS=read('dashboard.js');
test('Personal is a real same-origin /personal/ page with links to existing CRM and dashboard',()=>{
 assert.match(page,/href="\.\.\/dashboard\.html"/);
 assert.match(page,/href="\.\.\/index\.html\?view=saved#radar"/);
 assert.match(page,/href="\.\.\/brand-globe\.svg"/);
 assert.match(page,/data-t="notice"/);
 assert.match(page,/está activado|está activado|todavía no está activado/i);
});
test('no fake PayPal unlock, secret, order or premium localStorage toggle',()=>{
 assert.doesNotMatch(page,/sk_live_|PAYPAL_CLIENT_SECRET|client_secret|entitlementBackendReady\s*=\s*true|isPremium\s*=\s*true/i);
 assert.doesNotMatch(page,/paypal\.com\/webapps\/billing\/plans\/subscribe/);
 assert.match(page,/No se ha cobrado nada/);
});
test('public plans display Free + Personal and hide legacy Teams',()=>{
 const plans=read('planes.html');
 assert.match(plans,/data-plan-card="team" hidden aria-hidden="true"/);
 assert.match(plans,/href="\.\/personal\/"/);
});
test('portal supports ES, EN and PT, preserves legacy original files',()=>{
 for(const t of ['YOUR PERSONAL SPACE','TU ESPACIO PERSONAL','O TEU ESPAÇO PESSOAL'])assert(page.includes(t));
 assert.match(read('index.html'),/const quotaKey='bc-credits-'/);
 assert.match(read('index.html'),/used\.length>=7/);
 assert.match(read('payment-plan-config.js'),/live:false/);
});
test('dashboard bridge accepts 1000+ records without silent 250 truncation',()=>{
 const c={window:{},URL};vm.runInNewContext(read('opportunity-matrix.js'),c);
 const api=c.window.BC_OPPORTUNITIES;
 const items=Array.from({length:2500},(_,i)=>({id:'osm:'+i,name:'Place '+i,category:'shop',address:'City',lat:2+i/10000,lon:-78,source:'https://www.openstreetmap.org'}));
 assert.equal(api.unique(items).length,2500);
 assert.equal(api.stats(items).count,2500);
 assert.match(read('dashboard-bridge.js'),/unique\(arr\)/);
});
test('dashboard has real pagination navigation and exports all filtered rows',()=>{
 for(const id of ['bcPrev','bcNext','bcPage'])assert(dash.includes('id="'+id+'"'));
 assert.match(dashboardJS,/const PAGE_SIZE=100/);
 assert.match(dashboardJS,/filtered\.slice\(page\*PAGE_SIZE,\(page\+1\)\*PAGE_SIZE\)/);
 assert.doesNotMatch(dashboardJS,/filtered\.slice\(0,250\)/);
 assert.match(dashboardJS,/const data=filteredRows\(\)/);
});
test('unchanged public free kit and origin-only preservation',()=>{
 assert.match(read('kit-libre.html'),/kit gratuito/i);
 assert.match(dash,/Sin sincronización remota ni contraseña configurada todavía/);
 assert.doesNotMatch(page,/<iframe|fetch\(|WebSocket|navigator\.sendBeacon/i);
});

test('one transparent Personal 1000/cycle offer in all languages, no 250/week second cap',()=>{
 const portal=read('personal/index.html');
 const plans=read('payment-launch.js');
 assert.match(portal,/<b>1\.000<\/b>/);
 assert.doesNotMatch(portal,/250 nuevos|250-new|250 contactos novos/i);
 assert.match(plans,/1\.000 negocios públicos/);
 assert.match(plans,/1,000 newly saved public businesses/);
 assert.match(plans,/1\.000 novos negócios públicos/);
});
test('CRM migration is local-only and merges without deleting existing records',()=>{
 const migration=read('migrar.html');
 assert.match(migration,/buscaclientes-crm-export-v1/);
 assert.match(migration,/SHA-256/);
 assert.match(migration,/if\(!ids\.has\(item\.id\)\)/);
 assert.match(migration,/BC_CRM_TX\.commit/);
 assert.doesNotMatch(migration,/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
 assert.match(read('scripts/build-cloudflare.mjs'),/"migrar\.html"/);
});
