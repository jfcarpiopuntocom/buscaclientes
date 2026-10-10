/* Shell 006: 7 manual searches / city / ISO week / browser, privacy-first.
   Honest limitation: browser storage can be cleared; this is not a global entitlement system.
   Paid is true ONLY after a live Gumroad license validation endpoint succeeds. */
(function(root){
'use strict';
const KEY='bc-search-usage-v2',LIMIT=7;
const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase().replace(/\s+/g,' ').slice(0,160);
const week=(date=new Date())=>{const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)};
const cityKey=city=>normalize(city);
function create(storage){
 const read=()=>{try{const v=JSON.parse(storage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
 const write=v=>{try{storage.setItem(KEY,JSON.stringify(v));return true}catch{return false}};
 function status(city,date=new Date()){
  const data=read(),key=week(date)+'|'+cityKey(city),count=Math.max(0,Math.min(LIMIT,Number(data[key])||0));
  return {city:cityKey(city),week:week(date),used:count,remaining:LIMIT-count,limit:LIMIT,allowed:count<LIMIT};
 }
 function commit(city,date=new Date()){
  const data=read(),key=week(date)+'|'+cityKey(city);
  const count=Number(data[key])||0;
  if(count>=LIMIT)return {ok:false,...status(city,date)};
  // Browser-local only; discard old weeks, bounded set.
  const present=week(date)+'|';
  const current=Object.fromEntries(Object.entries(data).filter(([k,v])=>k.startsWith(present)&&Number.isInteger(v)&&v>=0).slice(-150));
  current[key]=count+1;
  if(!write(current))return {ok:false,error:'storage_unavailable',...status(city,date)};
  return {ok:true,...status(city,date)};
 }
 return {status,commit,week,cityKey};
}
const quota=create(root.localStorage||{getItem:()=>null,setItem:()=>{}});
let paidUntil=0;
const paid=()=>Date.now()<paidUntil;
function verifiedUntil(exp){if(!Number.isFinite(exp)||exp<Date.now()||exp>Date.now()+24*3600e3)throw Error('invalid_license_expiry');paidUntil=exp}
function allow(city){return paid()||quota.status(city).allowed}
function commit(city){return paid()?{ok:true,paid:true}:quota.commit(city)}
root.BC_PLAN=Object.freeze({quota,allow,commit,paid,verifiedUntil,LIMIT,week});
})(typeof window!=='undefined'?window:globalThis);
