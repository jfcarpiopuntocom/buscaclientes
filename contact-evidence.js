/* BuscaClientes Shell 013 — source-bound public contact evidence, no scraping engine.
 * Pure normalization: caller owns persistence, consent and UI.
 */
(function(root){
'use strict';
const has=(v)=>typeof v==='string'&&v.trim().length>0;
function publicUrl(value){
 const raw=String(value??'').trim();if(!raw)return null;
 try{
  const url=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||!url.hostname.includes('.'))return null;
  if(url.hostname.endsWith('.')||/\s/.test(url.hostname))return null;
  return url;
 }catch{return null}
}
const host=url=>url.hostname.replace(/^www\./i,'').toLowerCase();
function matchingPage(value,website){
 const page=publicUrl(value),reference=publicUrl(website);
 return page&&reference&&host(page)===host(reference)?page.href:'';
}
function array(source,key){
 const value=source[key]??[];
 if(!Array.isArray(value))throw Error('Evidencia no válida: '+key+' no es una lista');
 return value
}
function distinct(items,limit,predicate){
 const out=[],seen=new Set();
 for(const x of items){
  if(typeof x!=='string')continue;
  const value=x.trim();
  if(!predicate(value))continue;
  const key=value.toLowerCase();
  if(seen.has(key))continue;
  seen.add(key);out.push(value);
  if(out.length>=limit)break
 }
 return out
}
const email=v=>v.length<=120&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phone=v=>v.length<=45&&/^[\d+().\s\-]{7,45}$/.test(v)&&v.replace(/\D/g,'').length>=7;
function normalize(raw,website,mode='scout',now=new Date().toISOString()){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Evidencia no válida');
 if(mode!=='scout'&&mode!=='remote')throw Error('Procedencia no válida');
 if(mode==='scout'&&raw.type!=='buscaclientes-contact-evidence')throw Error('Formato Contact Scout no válido');
 const target=publicUrl(website);
 if(!target)throw Error('El negocio no tiene una web pública válida');
 const emails=distinct(array(raw,'emails'),20,email);
 const phones=distinct(array(raw,'phones'),15,phone);
 let pages;
 if(mode==='scout'){
  if(!has(raw.source))throw Error('Falta dirección de la evidencia');
  const url=matchingPage(raw.source,website);
  if(!url)throw Error('La página consultada no corresponde a la web de este negocio');
  pages=[url]
 }else{
  pages=distinct(array(raw,'pages'),20,v=>v.length<=1000)
   .map(v=>matchingPage(v,website)).filter(Boolean);
  // The remote service must never introduce an off-domain URL as evidence.
 }
 return Object.freeze({emails,phones,pages,checked_at:String(now).slice(0,40),verified:false,
  method:mode==='scout'?'local_browser':'remote_enrichment'});
}
function merge(row,evidence){
 if(!row||typeof row!=='object'||!evidence)throw Error('Registro no válido');
 return {...row,email:row.email||evidence.emails[0]||'',phone:row.phone||evidence.phones[0]||'',contactEvidence:evidence}
}
root.BC_CONTACT_EVIDENCE=Object.freeze({publicUrl,matchingPage,normalize,merge});
})(typeof window!=='undefined'?window:globalThis);
