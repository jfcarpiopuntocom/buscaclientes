/* Bounded user-triggered geocoding only; no bulk/autocomplete.
   This per-browser cap is NOT a service-wide Nominatim quota.
   Replace public API for scaled paid traffic with approved commercial endpoint.
 */
(function(root){'use strict';
const hits=new Map(),MAX=6,WINDOW=3600000;
let lastCall=0,pending=null;
async function lookup(city,country,callback,now=Date.now()){
 const key=String(country).toUpperCase()+':'+String(city).trim().toLowerCase();
 if(!key||!city||!country)throw Error('Falta lugar o país');
 const saved=hits.get(key);if(saved&&now-saved.at<86400000)return saved.data;
 let count=0;
 try{const v=JSON.parse(sessionStorage.getItem('bc-geocode-limit-v1')||'null');count=v&&now-v.start<WINDOW?Number(v.count)||0:0}catch{}
 if(count>=MAX)throw Error('Se alcanzó el límite prudente de consultas geográficas de esta sesión. Intenta más tarde.');
 if(pending){await pending.catch(()=>{})}
 const wait=Math.max(0,1600-(Date.now()-lastCall));
 if(wait)await new Promise(r=>setTimeout(r,wait));
 const current=Date.now(), start=(()=>{try{const v=JSON.parse(sessionStorage.getItem('bc-geocode-limit-v1')||'null');return v&&current-v.start<WINDOW?v.start:current}catch{return current}})();
 let total=count;try{const v=JSON.parse(sessionStorage.getItem('bc-geocode-limit-v1')||'null');total=v&&current-v.start<WINDOW?Number(v.count)||0:0}catch{}
 if(total>=MAX)throw Error('Se alcanzó el límite geográfico; vuelve más tarde.');
 try{sessionStorage.setItem('bc-geocode-limit-v1',JSON.stringify({start,count:total+1}))}catch{}
 lastCall=current;
 pending=Promise.resolve().then(callback);
 try{const data=await pending;if(Array.isArray(data)&&data.length)hits.set(key,{at:Date.now(),data});return data}
 finally{pending=null}
}
root.BC_GEO_GUARD=Object.freeze({lookup});
})(typeof window!=='undefined'?window:globalThis);
