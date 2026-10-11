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
test('portal supports ES, EN and PT, preserves legacy original files',()=>{
 for(const t of ['YOUR PERSONAL SPACE','TU ESPACIO PERSONAL','O TEU ESPAÇO PESSOAL'])assert(page.includes(t));
 assert.match(read('index.html'),/const quotaKey='bc-credits-'/);
 assert.match(read('index.html'),/used\.length>=7/);
 assert.match(read('payment-plan-config.js'),/live:false/);
});
test('dashboard bridge accepts 1000+ records without silent 250 truncation',()=>{
 const c={window:{},URL};vm.runInNewContext(read('opportunity-matrix.js'),c);
 const api=c.window.BC_OPPORTUNITIES;
 const items=Array.from({length:1250},(_,i)=>({id:'osm:'+i,name:'Place '+i,category:'shop',address:'City',lat:2+i/10000,lon:-78,source:'https://www.openstreetmap.org'}));
 assert.equal(api.unique(items).length,1250);
 assert.equal(api.stats(items).count,1250);
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
