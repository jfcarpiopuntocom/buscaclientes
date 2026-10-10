/* Optional Gumroad subscription validator, Cloudflare Worker.
   NOT DEPLOYED until product exists. Product ID is server-side env.
   No seller tokens stored on client, no payment information handled.
   Enforce rate-limits at Cloudflare edge/WAF before real paid usage. */
const response=(body,status,origin)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...(origin?{'access-control-allow-origin':origin,'vary':'Origin'}:{})}});
function validPurchase(obj,expected){
 const p=obj?.purchase||{};
 if(obj?.success!==true)return false;
 if(String(p.product_id||'')!==String(expected))return false;
 if(p.refunded||p.chargebacked||p.disputed||p.subscription_failed_at||p.subscription_ended_at||p.subscription_ended)return false;
 if(p.subscription_cancelled_at){
  const ending=p.subscription_ended_at||p.subscription_end_date||p.subscription_ends_at;
  if(!ending||Number.isNaN(Date.parse(ending))||Date.parse(ending)<=Date.now())return false;
 }
 return true;
}
export default {async fetch(req,env){
 const origin=req.headers.get('Origin')||'',allowed=env.ALLOWED_ORIGIN||'';
 if(!allowed||!env.GUMROAD_PRODUCT_ID)return response({error:'not_configured'},503);
 if(origin!==allowed)return response({error:'forbidden_origin'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':allowed,'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','vary':'Origin'}});
 if(req.method!=='POST'||new URL(req.url).pathname!=='/api/license')return response({error:'not_found'},404,allowed);
 if(Number(req.headers.get('content-length')||0)>2048)return response({error:'too_large'},413,allowed);
 let input;try{input=await req.json()}catch{return response({error:'invalid_input'},400,allowed)}
 const key=String(input?.licenseKey||'').trim();
 if(!/^[a-zA-Z0-9-]{12,90}$/.test(key))return response({valid:false},422,allowed);
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7500);
  let res;
  try{
   res=await fetch('https://api.gumroad.com/v2/licenses/verify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({product_id:env.GUMROAD_PRODUCT_ID,license_key:key,increment_uses_count:'false'}),signal:controller.signal});
  }finally{clearTimeout(timeout)}
  if(!res.ok)return response({valid:false},res.status===429?503:401,allowed);
  const data=await res.json();
  const valid=validPurchase(data,env.GUMROAD_PRODUCT_ID);
  return response(valid?{valid:true,validUntil:Date.now()+15*60*1000,provider:'gumroad'}:{valid:false},valid?200:401,allowed);
 }catch{return response({error:'verification_unavailable'},503,allowed)}
}};
export {validPurchase};
