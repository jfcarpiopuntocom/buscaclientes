import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const ctx={window:{},URL,console};vm.runInNewContext(read('payment-launch.js'),ctx);
const {validateSubscriptionUrl:parse,isReady}=ctx.window.BC_PAYPAL_LAUNCH;
const id='P-123456789ABCDEFGHIJKLMNOPQ';
const url='https://www.paypal.com/webapps/billing/plans/subscribe?plan_id='+id;
test('01 exact PayPal recurring subscription link only, not a one-time payment',()=>{
 assert.equal(parse(url)?.planId,id);
 for(const s of [
  'https://paypal.me/merchant/7',
  'https://www.paypal.com/ncp/payment/xyz',
  'https://paypal.com.evil.example/webapps/billing/plans/subscribe?plan_id='+id,
  'http://www.paypal.com/webapps/billing/plans/subscribe?plan_id='+id,
  'https://www.sandbox.paypal.com/webapps/billing/plans/subscribe?plan_id='+id,
  'https://evil@www.paypal.com/webapps/billing/plans/subscribe?plan_id='+id,
  'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id='+id+'&redirect=https://evil.org',
  'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=INVALID',
  'javascript:alert(1)'
 ])assert.equal(parse(s),null,s);
});
test('02 checkout requires all live flags, genuine link, exact plan and price',()=>{
 const cfg={live:true,paypalVerified:true,entitlementBackendReady:true,offers:{personal:{url,planId:id,priceText:'USD 7/month'}}};
 assert.equal(isReady(cfg,'personal'),true);
 for(const key of ['live','paypalVerified','entitlementBackendReady']){
  assert.equal(isReady({...cfg,[key]:false},'personal'),false,key);
 }
 assert.equal(isReady({...cfg,offers:{personal:{...cfg.offers.personal,planId:'P-WRONG'}}},'personal'),false);
 assert.equal(isReady({...cfg,offers:{personal:{...cfg.offers.personal,priceText:''}}},'personal'),false);
 assert.equal(isReady({...cfg,offers:{personal:{...cfg.offers.personal,url:'https://paypal.me/example'}}},'personal'),false);
 assert.equal(isReady(cfg,'team'),false);
});
test('03 public configuration has NO live payment plan, price or premium claims',()=>{
 const context={window:{}};vm.runInNewContext(read('payment-plan-config.js'),context);
 const cfg=context.window.BC_PLAN_CONFIG;
 assert.equal(cfg.live,false);assert.equal(cfg.paypalVerified,false);
 assert.equal(cfg.entitlementBackendReady,false);
 assert.equal(cfg.offers.personal.url,'');assert.equal(cfg.offers.team.url,'');
 assert.equal(isReady(cfg,'personal'),false);assert.equal(isReady(cfg,'team'),false);
});
test('04 Free is available, Personal/Teams are clear coming soon, kit remains free',()=>{
 const page=read('planes.html');
 assert.match(page,/data-plan-card="personal"/);assert.match(page,/data-plan-card="team"/);
 assert.match(page,/En preparación/);
 assert.match(page,/hasta siete contactos cada semana/);
 assert.match(page,/href=".\/kit-libre.html"/);
 assert.match(page,/Kit es gratuito|kit es gratuito/i);
});
test('05 page works in ES EN PT and never says checkout is successful without proof',()=>{
 const app=read('payment-launch.js'),page=read('planes.html');
 for(const word of ['Explore freely','Explora sin prisa','Explora livremente','Suscribirme mediante PayPal','Subscribe with PayPal','Subscrever através do PayPal'])assert(app.includes(word),word);
 assert.doesNotMatch(page,/payment successful|compra confirmada|subscription active/i);
 assert.match(app,/action.hidden=true/);assert.match(app,/validateSubscriptionUrl/);
});
test('06 existing app creates an unobtrusive honest link and retains the free kit',()=>{
 const app=read('index.html');
 assert.match(app,/class="bc-launch-link" href=".\/planes.html"/);
 assert.match(app,/href=".\/kit-libre.html"/);
 assert.match(app,/v1\.0 shell 015/);
 assert.match(read('dashboard.html'),/v1\.0 shell 015/);
 assert.match(app,/const navLink=document\.querySelector\('\.bc-launch-link'\)/);
});
test('07 public launch files contain zero client secrets or generated IDs',()=>{
 for(const p of ['planes.html','payment-plan-config.js','payment-launch.js','shell-015-launch.css']){
  const s=read(p);
  assert.doesNotMatch(s,/client_secret|sk_live_|api_secret|bearer\\s+[A-Z0-9_-]{20,}/i,p);
 }
});
test('08 no external worker, cache erasure, or CRM mutation in pricing module',()=>{
 const s=read('payment-launch.js');
 assert.doesNotMatch(s,/fetch\\(|sendBeacon|removeItem|\\.clear\\(|bc-crm-durable-v1|bc-credits-|window\\.open/i);
 assert.match(read('SHELL-015-PAYPAL-GUMROAD-RUNBOOK.md'),/server-side entitlement/);
});
test('09 original brand icon unaltered, source of truth for three brands',()=>{
 const h=read('planes.html'),app=read('index.html');
 assert.match(h,/src=".\/brand-globe.svg"/);
 assert.match(app,/src=".\/brand-globe.svg"/);
 assert.match(read('brand-i18n.js'),/Find','Clients/);
});
