// BuscaClientes PayPal subscriptions: ISOLATED, NO CHARGES, NO ENTITLEMENT GRANTS.
// Not deployed. Never bind or deploy into friendly-123 resources.
const EVENT_TYPES = new Set([
  "BILLING.SUBSCRIPTION.CREATED",
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.SALE.REFUNDED",
  "PAYMENT.SALE.REVERSED"
]);
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{
  "content-type":"application/json; charset=utf-8","cache-control":"no-store",
  "x-content-type-options":"nosniff"
}});
function apiOrigin(env){
  if(env.PAYPAL_ENV==="sandbox")return "https://api-m.sandbox.paypal.com";
  if(env.PAYPAL_ENV==="live")return "https://api-m.paypal.com";
  throw Error("Explicit PAYPAL_ENV sandbox/live required");
}
async function getToken(env){
  const authorization="Basic "+btoa(env.PAYPAL_CLIENT_ID+":"+env.PAYPAL_CLIENT_SECRET);
  const res=await fetch(apiOrigin(env)+"/v1/oauth2/token",{
    method:"POST",headers:{"authorization":authorization,"content-type":"application/x-www-form-urlencoded"},
    body:"grant_type=client_credentials",signal:AbortSignal.timeout(7000)
  });
  if(!res.ok)throw Error("PayPal token unavailable");
  const data=await res.json();
  if(typeof data.access_token!=="string"||!data.access_token)throw Error("Missing PayPal token");
  return data.access_token;
}
async function isVerified(request,env,event){
  const header=name=>request.headers.get(name);
  const transmission_id=header("paypal-transmission-id");
  const transmission_time=header("paypal-transmission-time");
  const cert_url=header("paypal-cert-url");
  const auth_algo=header("paypal-auth-algo");
  const transmission_sig=header("paypal-transmission-sig");
  if(![transmission_id,transmission_time,cert_url,auth_algo,transmission_sig].every(Boolean))return false;
  const token=await getToken(env);
  const response=await fetch(apiOrigin(env)+"/v1/notifications/verify-webhook-signature",{
    method:"POST",
    headers:{"authorization":"Bearer "+token,"content-type":"application/json"},
    body:JSON.stringify({auth_algo,cert_url,transmission_id,transmission_sig,
      transmission_time,webhook_id:env.PAYPAL_WEBHOOK_ID,webhook_event:event}),
    signal:AbortSignal.timeout(7000)
  });
  if(!response.ok)return false;
  return (await response.json()).verification_status==="SUCCESS";
}
async function limitedBody(request,limit){
  const declared=Number(request.headers.get("content-length")||0);
  if(declared>limit)throw Error("too_large");
  const reader=request.body?.getReader();
  if(!reader)return "";
  let size=0;
  const chunks=[];
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    size+=value.byteLength;
    if(size>limit){await reader.cancel().catch(()=>{});throw Error("too_large")}
    chunks.push(value);
  }
  const data=new Uint8Array(size);
  let position=0;
  for(const part of chunks){data.set(part,position);position+=part.byteLength}
  return new TextDecoder().decode(data);
}
function safeId(v){return typeof v==="string"?v.slice(0,160):""}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/paypal/health"&&request.method==="GET")
      return respond({ok:true,checkoutEnabled:false,webhookConfigured:!!(
        env.PAYPAL_DB&&env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET&&env.PAYPAL_WEBHOOK_ID
        &&["sandbox","live"].includes(env.PAYPAL_ENV))});
    if(url.pathname==="/api/paypal/create-order"||url.pathname==="/api/paypal/capture-order"
      ||url.pathname==="/api/paypal/create-subscription")
      return respond({error:"Billing disabled pending approved plan, identity, entitlements and tests"},503);
    if(url.pathname!=="/api/paypal/webhook")return respond({error:"Not found"},404);
    if(request.method!=="POST")return respond({error:"Method not allowed"},405);
    if(!env.PAYPAL_DB||!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET
      ||!env.PAYPAL_WEBHOOK_ID||!["sandbox","live"].includes(env.PAYPAL_ENV))
      return respond({error:"Not configured"},503);
    let raw;
    try{raw=await limitedBody(request,65536)}
    catch(e){return respond({error:e.message==="too_large"?"Payload too large":"Invalid request"},e.message==="too_large"?413:400)}
    let event;
    try{event=JSON.parse(raw)}catch{return respond({error:"Malformed JSON"},400)}
    if(!event||typeof event.id!=="string"||event.id.length>160||!event.id
      ||typeof event.event_type!=="string"||event.event_type.length>100)
      return respond({error:"Invalid event"},400);
    let verified=false;
    try{verified=await isVerified(request,env,event)}
    catch{return respond({error:"Verification unavailable"},503)}
    if(!verified)return respond({error:"Invalid signature"},401);
    if(!EVENT_TYPES.has(event.event_type))return respond({received:true,ignored:true});
    // PayPal sends SALE events with billing_agreement_id. No personal details stored.
    const resource=event.resource&&typeof event.resource==="object"?event.resource:{};
    const resourceId=safeId(resource.id);
    const subId=safeId(resource.billing_agreement_id||
      (event.event_type.startsWith("BILLING.SUBSCRIPTION.")?resource.id:""));
    const date=typeof event.create_time==="string"?event.create_time.slice(0,40):"";
    try{
      await env.PAYPAL_DB.prepare(
        "INSERT OR IGNORE INTO paypal_events (event_id,event_type,resource_id,subscription_id,event_time,received_at) VALUES (?,?,?,?,?,?)"
      ).bind(event.id,event.event_type,resourceId,subId,date,new Date().toISOString()).run();
      return respond({received:true});
    }catch{
      // A non-2xx response causes PayPal to retry; never acknowledge lost events.
      return respond({error:"Persistence unavailable"},503);
    }
  }
};