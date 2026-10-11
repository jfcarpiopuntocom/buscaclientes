// BuscaClientes PayPal — isolated, fail-closed integration. NOT deployed.
// Deploy as a SEPARATE Cloudflare Worker. Never bind friendly-123 resources.
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}});
const events=new Set(["CHECKOUT.ORDER.APPROVED","PAYMENT.CAPTURE.COMPLETED","PAYMENT.CAPTURE.PENDING","PAYMENT.CAPTURE.DENIED","PAYMENT.CAPTURE.REFUNDED","CHECKOUT.PAYMENT-APPROVAL.REVERSED"]);
async function paypalToken(env){
 const auth=btoa(env.PAYPAL_CLIENT_ID+":"+env.PAYPAL_CLIENT_SECRET);
 const r=await fetch("https://api-m.paypal.com/v1/oauth2/token",{method:"POST",headers:{authorization:"Basic "+auth,"content-type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
 if(!r.ok)throw Error("PayPal authentication failed");
 const j=await r.json();return j.access_token;
}
async function verifyWebhook(req,env,payload){
 const header=n=>req.headers.get(n)||"";
 const transmissionId=header("paypal-transmission-id"),transmissionTime=header("paypal-transmission-time"),certUrl=header("paypal-cert-url"),authAlgo=header("paypal-auth-algo"),transmissionSig=header("paypal-transmission-sig");
 if(![transmissionId,transmissionTime,certUrl,authAlgo,transmissionSig].every(Boolean))return false;
 // Never fetch URLs supplied by the webhook. PayPal's verification endpoint does that safely.
 const token=await paypalToken(env);
 const r=await fetch("https://api-m.paypal.com/v1/notifications/verify-webhook-signature",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({auth_algo:authAlgo,cert_url:certUrl,transmission_id:transmissionId,transmission_sig:transmissionSig,transmission_time:transmissionTime,webhook_id:env.PAYPAL_WEBHOOK_ID,webhook_event:payload})});
 if(!r.ok)return false;
 return (await r.json()).verification_status==="SUCCESS";
}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname==="/api/paypal/health"&&request.method==="GET")return json({ok:true,mode:"not-live",configured:!!(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET&&env.PAYPAL_WEBHOOK_ID&&env.PAYPAL_DB)});
  if(u.pathname==="/api/paypal/create-order"||u.pathname==="/api/paypal/capture-order")return json({error:"Checkout disabled until customer authentication, durable entitlements and pricing are integrated and tested."},503);
  if(u.pathname!=="/api/paypal/webhook")return json({error:"Not found"},404);
  if(request.method!=="POST")return json({error:"Method not allowed"},405);
  if(!env.PAYPAL_DB||!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET||!env.PAYPAL_WEBHOOK_ID)return json({error:"Not configured"},503);
  const raw=await request.text();
  if(raw.length>128000)return json({error:"Payload too large"},413);
  let event;try{event=JSON.parse(raw)}catch{return json({error:"Malformed JSON"},400)}
  if(!event||typeof event.id!=="string"||typeof event.event_type!=="string")return json({error:"Invalid event"},400);
  let verified=false;try{verified=await verifyWebhook(request,env,event)}catch{return json({error:"Verification unavailable"},503)}
  if(!verified)return json({error:"Invalid PayPal signature"},401);
  if(!events.has(event.event_type))return json({received:true,ignored:true});
  // Idempotency: durable unique PayPal event ID, no customer activation from webhook alone.
  try{
   await env.PAYPAL_DB.prepare("INSERT OR IGNORE INTO paypal_events (event_id,event_type,resource_id,payload,received_at) VALUES (?,?,?,?,?)")
    .bind(event.id,event.event_type,String(event.resource?.id||""),raw,new Date().toISOString()).run();
   return json({received:true});
  }catch{return json({error:"Persistence failed; retry delivery"},503)}
 }
};
