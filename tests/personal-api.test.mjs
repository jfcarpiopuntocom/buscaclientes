import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../personal/personal-api-worker.js',import.meta.url),'utf8');
const {default:api}=await import('data:text/javascript,'+encodeURIComponent(source));
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const issuer='https://sample-team.cloudflareaccess.com';
const base='https://personal.test.invalid/api/personal/';
const good={CF_ACCESS_TEAM_DOMAIN:'sample-team.cloudflareaccess.com',CF_ACCESS_AUD:'audience-123',
 PERSONAL_HMAC_SECRET:'long-example-test-HMAC-secret-at-least-32-characters',
 PERSONAL_ALLOWED_ORIGINS:'https://jfcarpiopuntocom.github.io'};
async function signedContext(fn){
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const pub=await crypto.subtle.exportKey('jwk',pair.publicKey);
 const h=b64({alg:'RS256',kid:'key-1',typ:'JWT'});
 const p=b64({iss:issuer,sub:'google-subject-abc987',aud:['audience-123'],iat:Math.floor(Date.now()/1000)-60,exp:Math.floor(Date.now()/1000)+3600});
 const msg=h+'.'+p;
 const sig=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(msg))).toString('base64url');
 const jwt=msg+'.'+sig;
 const old=globalThis.fetch;globalThis.fetch=async url=>{
  assert.equal(String(url),issuer+'/cdn-cgi/access/certs');
  return Response.json({keys:[{...pub,kid:'key-1',alg:'RS256'}]});
 };
 try{await fn(jwt)}finally{globalThis.fetch=old}
}
const req=(path,opts={})=>new Request(base+path,opts);
function fakeDB({active=true,changes=1,known=false,broken=false}={}){
 const calls=[];
 return {calls,prepare(sql){
  if(broken)throw Error('D1 temporarily down');
  return {bind(...args){calls.push({sql,args});return{
   async first(){
    if(sql.includes('SELECT c.cycle_id'))return active?{cycle_id:'cycle-1',starts_at:'2026-10-01',ends_at:'2026-11-01'}:null;
    if(sql.includes('SELECT 1 AS found'))return known?{found:1}:null;
    if(sql.includes('COUNT(*) AS used'))return {used:15};
    return null;
   },
   async run(){return {meta:{changes}};}
  }}}
 }};
}
const auth=(jwt,method='GET',body,origin)=>({
 method,headers:{'cf-access-jwt-assertion':jwt,...(origin?{Origin:origin}:{}),...(body?{'content-type':'application/json'}:{})},
 ...(body?{body:JSON.stringify(body)}:{})
});
test('public health never claims live payment capability',async()=>{
 const r=await api.fetch(req('health'),{});
 assert.equal(r.status,200);assert.equal((await r.json()).billingEnabled,false);
});
test('missing credentials and unauthorized origin fail closed',async()=>{
 const r=await api.fetch(req('reserve',{method:'POST'}),{});
 assert.equal(r.status,503);
 const rejected=await api.fetch(req('me',{headers:{Origin:'https://evil.invalid'}}),good);
 assert.equal(rejected.status,403);
});
test('no Cloudflare Access JWT means no customer record inserted',async()=>{
 const db=fakeDB();const r=await api.fetch(req('me'),{...good,PAYPAL_DB:db});
 assert.equal(r.status,401);assert.equal(db.calls.length,0);
});
test('valid signed Cloudflare Access identity reads Personal entitlement and counters',async()=>{
 await signedContext(async jwt=>{
  const db=fakeDB();const r=await api.fetch(req('me',auth(jwt)),{...good,PAYPAL_DB:db});
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{plan:'personal',personalActive:true,limit:1000,used:15,cycleEnd:'2026-11-01'});
  assert(db.calls.some(c=>c.sql.includes('personal_principals')));
 });
});
test('authenticated reservation writes only HMACed canonical id, never raw contact information',async()=>{
 await signedContext(async jwt=>{
  const db=fakeDB();
  const input={contactId:'osm-node-123456789',operationId:'550e8400-e29b-41d4-a716-446655440000'};
  const r=await api.fetch(req('reserve',auth(jwt,'POST',input)),{...good,PAYPAL_DB:db});
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{reserved:true,charged:1});
  assert(!JSON.stringify(db.calls).includes('osm-node-123456789'));
  assert(db.calls.some(c=>c.sql.includes('COUNT(*)')&&c.sql.includes('< 1000')));
 });
});
test('cancelled subscription cannot reserve fresh contacts but preserves historical plan access',async()=>{
 await signedContext(async jwt=>{
  const db=fakeDB({active:false});
  const r=await api.fetch(req('me',auth(jwt)),{...good,PAYPAL_DB:db});
  assert.equal((await r.json()).plan,'free');
  const input={contactId:'osm-node-42',operationId:'550e8400-e29b-41d4-a716-446655440000'};
  const post=await api.fetch(req('reserve',auth(jwt,'POST',input)),{...good,PAYPAL_DB:db});
  assert.equal(post.status,403);
 });
});
test('server-side quota enforces 429 at exhausted cycle, no client-side paid flag accepted',async()=>{
 await signedContext(async jwt=>{
  const db=fakeDB({changes:0});
  const body={contactId:'osm-node-42',operationId:'550e8400-e29b-41d4-a716-446655440000'};
  const r=await api.fetch(req('reserve',auth(jwt,'POST',body)),{...good,PAYPAL_DB:db});
  assert.equal(r.status,429);assert.equal((await r.json()).limit,1000);
 });
});
test('D1 outage never grants free entitlement or acknowledges contact reservation',async()=>{
 await signedContext(async jwt=>{
  const db=fakeDB({broken:true});
  const r=await api.fetch(req('me',auth(jwt)),{...good,PAYPAL_DB:db});
  assert.equal(r.status,503);
 });
});
