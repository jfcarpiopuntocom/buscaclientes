/* BuscaClientes Personal: private server-side paid quota, fail-closed.
 * NO PayPal endpoint. Requires independently configured Cloudflare Access JWT,
 * verified PayPal subscription reconciliation and separate D1.
 * Preview/testing only until completed; never grants premium based on JS flags.
 */
const reply=(value,status=200,more={})=>new Response(JSON.stringify(value),{status,headers:{
 'content-type':'application/json; charset=utf-8','cache-control':'no-store',
 'x-content-type-options':'nosniff',...more
}});
const encoder=new TextEncoder();
const hex=buffer=>Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,'0')).join('');
const sha256=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const decode=encoded=>{
 if(typeof encoded!=='string'||!/^[A-Za-z0-9_-]+$/.test(encoded))throw Error('bad_encoding');
 return Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((encoded.length+3)%4)),x=>x.charCodeAt(0));
};
async function verifyAccess(request,env){
 if(!env.CF_ACCESS_TEAM_DOMAIN||!env.CF_ACCESS_AUD)throw Error('access_not_configured');
 const issuer='https://'+env.CF_ACCESS_TEAM_DOMAIN;
 if(!/^https:\/\/[a-z0-9.-]+\.cloudflareaccess\.com$/.test(issuer))throw Error('invalid_issuer');
 const jwt=request.headers.get('cf-access-jwt-assertion');
 if(typeof jwt!=='string'||jwt.length>8192)throw Error('missing_jwt');
 const pieces=jwt.split('.');
 if(pieces.length!==3)throw Error('bad_jwt');
 const header=JSON.parse(new TextDecoder().decode(decode(pieces[0])));
 const payload=JSON.parse(new TextDecoder().decode(decode(pieces[1])));
 if(header.alg!=='RS256'||typeof header.kid!=='string'||!header.kid||payload.iss!==issuer||!Array.isArray(payload.aud)||!payload.aud.includes(env.CF_ACCESS_AUD))throw Error('invalid_access_claims');
 const now=Math.floor(Date.now()/1000);
 if(!Number.isFinite(payload.exp)||payload.exp<=now||!Number.isFinite(payload.iat)||payload.iat>now+60||payload.nbf>now+60||typeof payload.sub!=='string'||payload.sub.length<6)throw Error('expired_or_invalid_jwt');
 const res=await fetch(issuer+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(6000)});
 if(!res.ok)throw Error('cert_unavailable');
 const keys=(await res.json()).keys||[];
 const jwk=keys.find(x=>x.kid===header.kid&&x.kty==='RSA'&&(!x.alg||x.alg==='RS256'));
 if(!jwk)throw Error('access_kid_missing');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(pieces[2]),encoder.encode(pieces[0]+'.'+pieces[1])))throw Error('bad_signature');
 const subHash=await sha256(issuer+'|'+payload.sub);
 return {id:'p-'+subHash.slice(0,32),subjectHash:subHash};
}
async function digestContact(id,secret){
 if(typeof secret!=='string'||secret.length<32)throw Error('hmac_not_configured');
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(id.toLowerCase())));
}
async function boundedJson(request){
 if(Number(request.headers.get('content-length')||0)>4096)throw Error('oversize');
 const reader=request.body?.getReader();if(!reader)throw Error('empty');
 let len=0;const blocks=[];
 while(true){const {value,done}=await reader.read();if(done)break;len+=value.length;if(len>4096){await reader.cancel();throw Error('oversize')}blocks.push(value)}
 const whole=new Uint8Array(len);let pos=0;for(const b of blocks){whole.set(b,pos);pos+=b.length}
 return JSON.parse(new TextDecoder().decode(whole));
}
const utcMonday=now=>{const d=new Date(now);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/personal/health'&&request.method==='GET')
    return reply({ok:true,mode:'protected',billingEnabled:false});
  if(url.pathname!=='/api/personal/me'&&url.pathname!=='/api/personal/reserve')
    return reply({error:'not_found'},404);
  const origins=String(env.PERSONAL_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  const origin=request.headers.get('Origin'),cross=origin!==null;
  const cors=cross&&origins.includes(origin)?{'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'content-type, cf-access-jwt-assertion'}:{};
  if(cross&&!origins.includes(origin))return reply({error:'origin_not_allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(!env.PAYPAL_DB||!env.CF_ACCESS_TEAM_DOMAIN||!env.CF_ACCESS_AUD||!env.PERSONAL_HMAC_SECRET)
    return reply({error:'not_configured'},503,cors);
  let actor;try{actor=await verifyAccess(request,env)}catch{return reply({error:'authentication_required'},401,cors)}
  const now=new Date().toISOString();
  try{
   await env.PAYPAL_DB.prepare("INSERT OR IGNORE INTO personal_principals (principal_id,identity_provider,subject_hash,created_at) VALUES (?,?,?,?)").bind(actor.id,'email_otp',actor.subjectHash,now).run();
   const active=await env.PAYPAL_DB.prepare("SELECT c.cycle_id,c.starts_at,c.ends_at FROM personal_subscriptions s JOIN personal_billing_cycles c ON s.subscription_id=c.subscription_id WHERE s.principal_id=? AND s.status='active' AND c.starts_at<=? AND c.ends_at>? AND s.verified_at>=? ORDER BY c.starts_at DESC LIMIT 1").bind(actor.id,now,now,new Date(Date.now()-72*3600*1000).toISOString()).first();
   if(request.method==='GET'&&url.pathname==='/api/personal/me'){
    if(!active)return reply({plan:'free',personalActive:false},200,cors);
    const count=await env.PAYPAL_DB.prepare("SELECT COUNT(*) AS used FROM personal_usage_events WHERE principal_id=? AND cycle_id=?").bind(actor.id,active.cycle_id).first();
    return reply({plan:'personal',personalActive:true,limit:1000,used:count?.used||0,cycleEnd:active.ends_at},200,cors);
   }
   if(request.method!=='POST')return reply({error:'method_not_allowed'},405,cors);
   const input=await boundedJson(request).catch(()=>null);
   if(!input||typeof input.contactId!=='string'||!/^osm-(node|way|relation)-[0-9]{1,20}$/.test(input.contactId)||typeof input.operationId!=='string'||!/^[0-9a-fA-F-]{36}$/.test(input.operationId))
    return reply({error:'invalid_contact_or_operation'},400,cors);
   const key=await digestContact(input.contactId,env.PERSONAL_HMAC_SECRET);
   const known=await env.PAYPAL_DB.prepare("SELECT 1 AS found FROM personal_usage_events WHERE principal_id=? AND contact_key_hash=?").bind(actor.id,key).first();
   if(known)return reply({reserved:true,charged:0},200,cors);
   if(!active)return reply({error:'subscription_required'},403,cors);
   // One atomic SQL statement with quota predicate; concurrency cannot overrun 1000.
   const sql="INSERT OR IGNORE INTO personal_usage_events (principal_id,contact_key_hash,operation_id,cycle_id,utc_week_start,saved_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM personal_usage_events WHERE principal_id=? AND cycle_id=?) < 1000";
   const result=await env.PAYPAL_DB.prepare(sql).bind(actor.id,key,input.operationId,active.cycle_id,utcMonday(now),now,actor.id,active.cycle_id).run();
   if(result.meta?.changes===1)return reply({reserved:true,charged:1},200,cors);
   const again=await env.PAYPAL_DB.prepare("SELECT 1 AS found FROM personal_usage_events WHERE principal_id=? AND contact_key_hash=?").bind(actor.id,key).first();
   if(again)return reply({reserved:true,charged:0},200,cors);
   return reply({reserved:false,error:'billing_cycle_limit',limit:1000},429,cors);
  }catch{
   // Persistence failures must never grant access or consume a browser-side credit.
   return reply({error:'temporary_server_failure'},503,cors);
  }
 }
};