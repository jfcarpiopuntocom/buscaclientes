/* Shell 006: native same-origin app↔dashboard link.
 * No remote server, no new CRM authority, no credentials, no shared license.
 * The original BuscaClientes app is the source of truth; read-only reports.
 */
(function(root){
'use strict';
const CHANNEL='bc-dashboard-s006';
const CRM='bc-crm-durable-v1';
const allow=(arr)=>root.BC_OPPORTUNITIES?.unique(arr,250)||[];
const localRows=()=>{try{return allow(JSON.parse(root.localStorage?.getItem(CRM)||'[]'))}catch{return []}};
const createChannel=()=>typeof root.BroadcastChannel==='function'?new root.BroadcastChannel(CHANNEL):null;
function connectApp(source){
 if(typeof source!=='function')return {publish:()=>{},close:()=>{}};
 const channel=createChannel();
 const publish=()=>{
  if(!channel)return;
  try{
   const data=source()||{};
   channel.postMessage({kind:'bc:snapshot',version:1,at:Date.now(),
    saved:allow(data.saved),results:allow(data.results),city:String(data.city||'').slice(0,90)});
  }catch{/* Report must never break the source CRM. */}
 };
 if(channel){channel.onmessage=e=>{
  const msg=e.data;
  if(msg&&msg.kind==='bc:hello'&&msg.version===1)publish();
 }}
 return {publish,close:()=>channel?.close()};
}
function connectDashboard(receive){
 const channel=createChannel();
 let alive=false;
 const notify=(saved,results,city,connected,at)=>{
  if(typeof receive==='function')receive({saved,results,city,connected,at});
 };
 notify(localRows(),[], '',false,0);
 if(channel){
  channel.onmessage=e=>{
   const msg=e.data;
   if(!msg||msg.kind!=='bc:snapshot'||msg.version!==1)return;
   alive=true;
   notify(allow(msg.saved),allow(msg.results),String(msg.city||'').slice(0,90),true,Number(msg.at)||Date.now());
  };
  channel.postMessage({kind:'bc:hello',version:1});
 }
 const onStorage=e=>{if(e.key===CRM)notify(localRows(),[], '',alive,Date.now())};
 root.addEventListener?.('storage',onStorage);
 return {refresh:()=>{notify(localRows(),[], '',alive,Date.now());channel?.postMessage({kind:'bc:hello',version:1})},
  close:()=>{root.removeEventListener?.('storage',onStorage);channel?.close()}};
}
root.BC_DASHBOARD_BUS=Object.freeze({connectApp,connectDashboard,localRows});
if(typeof document!=='undefined'){
 const setup=()=>{
  if(typeof root.BC_DASHBOARD_SOURCE==='function'){
   const port=connectApp(root.BC_DASHBOARD_SOURCE);
   root.BC_DASHBOARD_PUBLISH=port.publish;
   port.publish();
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
}
})(typeof window!=='undefined'?window:globalThis);
