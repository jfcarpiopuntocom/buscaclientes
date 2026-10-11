import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('dashboard.html'),js=read('crm-studio.js'),css=read('crm-studio.css'),index=read('index.html');
test('CRM first with actual ARIA tabs, Intelligence second and default protection',()=>{
 const tab1=html.indexOf('id="tabCRM"'),tab2=html.indexOf('id="tabIntel"');
 assert(tab1>0&&tab2>tab1);
 assert.match(html,/id="tabCRM"[^>]*aria-selected="true"/);
 assert.match(html,/id="tabIntel"[^>]*aria-selected="false"/);
 assert.match(html,/id="workspaceCRM"[^>]*role="tabpanel"/);
 assert.match(html,/id="workspaceIntel"[^>]*hidden/);
 assert.match(css,/\[hidden\]\{display:none!important\}/);
 assert.match(js,/\['ArrowRight','ArrowLeft','Home','End'\]/);
});
test('Existing reporting modules are retained ONLY in second tab; full CRM table is first',()=>{
 const first=html.indexOf('id="workspaceCRM"');
 const second=html.indexOf('id="workspaceIntel"');
 for(const id of ['cartera','contacts','contactRows','bcPrev','bcNext']) {
  const where=html.indexOf('id="'+id+'"');
  assert(where>first&&where<second,id+' not in CRM tab');
 }
 for(const id of ['resumen','mapa','territorio','porter','geoMap','tlGrid','forces','stages']) {
  assert(html.indexOf('id="'+id+'"')>second,id+' missing from Intelligence tab');
 }
 assert.equal((html.match(/id="cartera"/g)||[]).length,1);
 assert.match(html,/id="researchForm"/);
 assert.match(js,/\brefine|bcCity:/);
});
test('Public CRM fields edit ONLY existing contact records with rollback and optimistic conflict guard',()=>{
 for(const field of ['stage','notes','nextAction','followUpAt','modified'])
  assert(js.includes(field),field);
 assert.match(js,/bc-crm-durable-v1/);
 assert.match(js,/BC_CRM_TX/);
 assert.match(js,/tx\.commit\(localStorage,\[\[KEY,JSON\.stringify\(all\)\]\]\)/);
 assert.match(js,/baseline/);
 assert.match(js,/conflict/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|eval\s*\(|innerHTML\s*=/);
 assert.doesNotMatch(js,/PAYPAL_CLIENT_SECRET|isPremium\s*=\s*true|checkoutEnabled\s*=\s*true/);
});
test('User context and follow-ups are preserved on same-origin index and never initiate crawling automatically',()=>{
 assert.match(index,/new URLSearchParams\(window\.location\.search\)/);
 assert.match(index,/bcCity/);
 assert.match(index,/window\.addEventListener\('storage'/);
 assert.match(js,/researchForm/);
 assert.match(js,/Prefill only, do not trigger scraping automatically/);
 assert.match(read('payment-plan-config.js'),/live:false/);
});
test('No invented contacts; source and business channels are checked and rendered safely',()=>{
 assert.match(js,/x\.demo!==true/);
 assert.match(js,/\.textContent=String\(text\)/);
 assert.match(js,/\['https:','http:'\]/);
 assert.match(js,/noopener noreferrer/);
 assert.match(js,/const x=input\.replace/);
 assert.doesNotMatch(js,/Math\.random\(\)|fictionalLead|example\.com\/fake/);
});
test('Responsive CRM and minimum tap targets, accessible status and fallback for empty portfolio',()=>{
 for(const id of ['crmCards','crmDetail','crmEditFeedback','crmQuickSearch','crmTotalHero','crmDue','crmNoNext','crmCoverage'])
  assert(html.includes('id="'+id+'"'),id);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css,/min-height:4[148]px/);
 assert.match(html,/id="crmEditFeedback" role="status" aria-live="polite"/);
 assert.match(js,/\bnoNext\(/);
 assert.match(js,/followUpAt<=today\(\)/);
 assert.match(js,/loca(l)?Storage/);
});
test('No unintended dependency on friendly-123 or network auth in the CRM cockpit',()=>{
 assert.doesNotMatch(js,/friendly-123|fetch\(|localStorage\.clear\(|removeItem\(KEY\)|window\.open\(/);
 assert.match(read('scripts/build-cloudflare.mjs'),/"crm-studio\.js"/);
 assert.match(read('scripts/build-cloudflare.mjs'),/"crm-studio\.css"/);
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'crm-studio.js'}));
});

test('mobile full directory stays collapsible and refreshes instantly after CRM edit',()=>{
 const desk=read('dashboard.html'),css=read('crm-studio.css'),render=read('dashboard.js');
 assert.match(desk,/<details id="crmFullDirectory"/);
 assert.match(desk,/<\/details>/);
 assert.match(css,/\.crm-directory-disclosure table\{min-width:970px!important\}/);
 assert.match(render,/root\.addEventListener\('bc:crm-saved',\(\)=>connection\.refresh\(\)\)/);
});
