/* BuscaClientes shell 008: one authoritative selection; no CRM or network writes. */
(function(root){
'use strict';
const valid=(lat,lon)=>Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&lat!==null&&lon!==null&&lat!==''&&lon!==''&&Math.abs(Number(lat))<=90&&Math.abs(Number(lon))<=180;
const clean=s=>String(s??'').trim().replace(/\s+/g,' ').slice(0,180);
function create(){
 let epoch=0,selection=Object.freeze({epoch:0,name:'',category:'',lat:null,lon:null,status:'unlocated'});
 function choose(name,category,lat=null,lon=null){
  const n=clean(name),located=valid(lat,lon);
  selection=Object.freeze({epoch:++epoch,name:n,category:clean(category),lat:located?Number(lat):null,lon:located?Number(lon):null,status:located?'located':'unlocated'});
  return selection.epoch;
 }
 function draft(name,category){return choose(name,category);}
 function resolve(token,name,lat,lon){
  if(!current(token)||clean(name)!==selection.name||!valid(lat,lon))return false;
  selection=Object.freeze({...selection,lat:Number(lat),lon:Number(lon),status:'located'});
  return true;
 }
 function current(token){return token===epoch}
 return Object.freeze({choose,draft,resolve,current,get state(){return selection}});
}
root.BC_CITY_TRUTH=Object.freeze({create,valid,clean});
})(typeof window!=='undefined'?window:globalThis);
