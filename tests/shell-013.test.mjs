import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const ctx={window:{},console,URL};vm.runInNewContext(read('contact-evidence.js'),ctx);
const e=ctx.window.BC_CONTACT_EVIDENCE;
const website='https://www.cuenca-example.org/about';
const scout=(data={})=>({type:'buscaclientes-contact-evidence',source:'https://cuenca-example.org/contact',
  emails:['hola@cuenca-example.org'],phones:['+593 7 288 0000'],...data});
test('01 Scout evidence same hostname (www normalization), source and clear unverified flag',()=>{
 const x=e.normalize(scout(),website,'scout','2026-10-10T00:00:00.000Z');
 assert.equal(x.pages[0],'https://cuenca-example.org/contact');
 assert.equal(x.method,'local_browser');assert.equal(x.verified,false);
});
test('02 spoofed sources, non-HTTP protocols and cross-domain pages cannot be imported',()=>{
 for(const url of ['https://cuenca-example.org.evil.net/contact','https://attacker.example/scout',
   'javascript:alert(1)','https://user:password@cuenca-example.org/','https://cuenca-example.org@attacker.net/']){
  assert.throws(()=>e.normalize(scout({source:url}),website,'scout'));
 }
});
test('03 contact field validation, duplicate removal and bounds',()=>{
 const x=e.normalize(scout({
  emails:[' Hola@Example.com ','hola@example.com','bad @email','x'.repeat(125)+'@x.com'],
  phones:['+593 7 288 0000','+593 7 288 0000','abc12345']
 }),website);
 assert.equal(x.emails.length,1);assert.equal(x.emails[0],'Hola@Example.com');
 assert.equal(x.phones.length,1);
});
test('04 malformed remote email and phone schema raises error rather than storing letters',()=>{
 for(const body of [{emails:'not-array',phones:[]},{emails:[],phones:123},{emails:null,phones:{a:1}}]){
  assert.throws(()=>e.normalize(body,website,'remote'))
 }
});
test('05 remote links are only from website domain, never injected external pages',()=>{
 const x=e.normalize({emails:['x@cuenca-example.org'],phones:[],
  pages:['https://cuenca-example.org/contact','https://x.evil.example/fake','file:///etc/passwd']
 },website,'remote');
 assert.deepEqual(Array.from(x.pages),['https://cuenca-example.org/contact']);
 assert.equal(x.method,'remote_enrichment');assert.equal(x.verified,false);
});
test('06 merge builds a new CRM object preserving notes/stage and existing contacts',()=>{
 const previous=Object.freeze({id:'one',email:'prior@example.org',notes:'IMPORTANT',stage:'qualified',phone:''});
 const ev=e.normalize(scout(),website);
 const next=e.merge(previous,ev);
 assert.notEqual(next,previous);assert.equal(previous.phone,'');
 assert.equal(next.email,'prior@example.org');assert.equal(next.notes,'IMPORTANT');
 assert.equal(next.stage,'qualified');assert.equal(next.phone,'+593 7 288 0000');
});
const html=read('index.html'),map=read('map-explorer.js'),dash=read('dashboard.html');
test('07 Scout and remote adapters share staged commit-before-mutate logic',()=>{
 assert.match(html,/function applyContactEvidence\(r,evidence\)/);
 assert.match(html,/const next=saved\.map\(x=>x\.id===r\.id\?window\.BC_CONTACT_EVIDENCE\.merge\(x,evidence\):x\)/);
 assert.match(html,/if\(!persistCRM\(next\)\)return false/);
 assert.match(html,/saved=next/);
 assert.match(html,/Object\.assign\(r,\{email:enriched\.email/);
 assert.match(html,/if\(!applyContactEvidence\(r,evidence\)\)/);
});
test('08 remote service bounded to 20 seconds, single in-flight request per contact',()=>{
 assert.match(html,/const enrichmentLocks=new Set\(\)/);
 assert.match(html,/enrichmentLocks\.has\(r\.id\)/);
 assert.match(html,/setTimeout\(\(\)=>controller\.abort\(\),20000\)/);
 assert.match(html,/clearTimeout\(stop\)/);
 assert.match(html,/signal:controller\.signal/);
});
test('09 invalid websites reject userinfo, unsupported protocols and pseudo domains',()=>{
 for(const input of ['http://user:password@merchant.com','javascript:alert(1)','merchant','file:///foo'])assert.equal(e.publicUrl(input),null);
});
test('10 saved CRM map link opens the actual saved tab, never generic result radar',()=>{
 assert.match(map,/index\.html\?view=saved#radar/);
 assert.match(html,/new URLSearchParams\(window\.location\.search\)\.get\('view'\)==='saved'/);
 assert.match(html,/queueMicrotask\(\(\)=>showCRM\('saved'\)\)/);
});
test('11 scope guard: versions, globe, city coherence and exact original slogan retained',()=>{
 assert.match(html,/v1\.0 shell 013/);assert.match(dash,/v1\.0 shell 013/);
 for(const text of ["geo-scope.js","city-coherence.js","crm-transaction.js","contact-evidence.js","BC_GYRO.create","window.BC_COUNTRY_FOCUS=focusCountry","worldMarker:'El mundo está lleno de clientes'"])assert(html.includes(text),text);
});
