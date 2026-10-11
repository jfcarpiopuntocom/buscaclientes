import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../paypal-worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript,'+encodeURIComponent(src));
const headers={
 'paypal-transmission-id':'test','paypal-transmission-time':'2026-10-10T22:00:00Z',
 'paypal-cert-url':'https://api.paypal.com/certs/test','paypal-auth-algo':'SHA256withRSA',
 'paypal-transmission-sig':'signature','content-type':'application/json'
};
const event=(event_type='BILLING.SUBSCRIPTION.ACTIVATED',id='WH-1')=>({
 id,event_type,create_time:'2026-10-10T22:00:00Z',
 resource:{id:'I-EXAMPLE',billing_agreement_id:'I-EXAMPLE',subscriber:{email_address:'private@example.org'}}
});
const request=(body=event(),signed=true)=>new Request('https://test.invalid/api/paypal/webhook',{
 method:'POST',headers:signed?headers:{'content-type':'application/json'},
 body:typeof body==='string'?body:JSON.stringify(body)});
const store=()=>{const rows=new Map();return {rows,prepare(sql){assert.match(sql,/INSERT OR IGNORE/);
 return {bind(...values){return {async run(){if(!rows.has(values[0]))rows.set(values[0],values)}}}}}}};
const env=(PAYPAL_DB=store())=>({PAYPAL_DB,PAYPAL_ENV:'sandbox',PAYPAL_CLIENT_ID:'test-id',
 PAYPAL_CLIENT_SECRET:'test-private-secret',PAYPAL_WEBHOOK_ID:'WH-test'});
async function withPayPal(run,status='SUCCESS'){
 const original=globalThis.fetch;
 globalThis.fetch=async(url)=>{
  assert.match(String(url),/^https:\/\/api-m\.sandbox\.paypal\.com\//);
  if(String(url).endsWith('/v1/oauth2/token'))return Response.json({access_token:'test-token'});
  if(String(url).endsWith('/verify-webhook-signature'))return Response.json({verification_status:status});
  throw Error('Unexpected URL '+url);
 };
 try{await run()}finally{globalThis.fetch=original}
}
test('checkout is strictly disabled and configuration hidden',async()=>{
 for(const action of ['create-order','capture-order','create-subscription']){
  const r=await worker.fetch(new Request('https://test.invalid/api/paypal/'+action,{method:'POST'}),env());
  assert.equal(r.status,503);
 }
 const h=await worker.fetch(new Request('https://test.invalid/api/paypal/health'),env());
 assert.equal(h.status,200);assert.equal((await h.json()).checkoutEnabled,false);
});
test('missing configuration, signatures and malformed inputs fail closed',async()=>{
 assert.equal((await worker.fetch(request(),{})).status,503);
 assert.equal((await worker.fetch(request(event(),false),env())).status,401);
 assert.equal((await worker.fetch(request('{bad'),env())).status,400);
 assert.equal((await worker.fetch(request('x'.repeat(65537)),env())).status,413);
 assert.equal((await worker.fetch(request(),{...env(),PAYPAL_ENV:'invalid'})).status,503);
});
test('valid subscription events are idempotent, storing metadata without personal data',async()=>{
 const db=store();
 await withPayPal(async()=>{
  for(const type of ['BILLING.SUBSCRIPTION.ACTIVATED','PAYMENT.SALE.COMPLETED','PAYMENT.SALE.REFUNDED']){
   const id='WH-'+type;
   assert.equal((await worker.fetch(request(event(type,id)),env(db))).status,200);
   assert.equal((await worker.fetch(request(event(type,id)),env(db))).status,200);
  }
  assert.equal(db.rows.size,3);
  assert.doesNotMatch(JSON.stringify([...db.rows.values()]),/private@example.org|test-private-secret/);
  const ignored=await worker.fetch(request(event('CHECKOUT.ORDER.APPROVED','WH-orders')),env(db));
  assert.equal((await ignored.json()).ignored,true);
  assert.equal(db.rows.size,3);
 });
});
test('signature failure or D1 failure never acknowledges payment as recorded',async()=>{
 const db=store();
 await withPayPal(async()=>assert.equal((await worker.fetch(request(),env(db))).status,401),'FAILURE');
 assert.equal(db.rows.size,0);
 await withPayPal(async()=>{
  const badDb={prepare(){throw Error('DB down')}};
  assert.equal((await worker.fetch(request(),env(badDb))).status,503);
 });
});
