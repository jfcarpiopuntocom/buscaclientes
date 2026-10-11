/* Geographic target validation — a country is never the equator line. */
(function(root){'use strict';
const norm=v=>String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const valid=(lat,lon)=>lat!==null&&lon!==null&&lat!==''&&lon!==''&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lon))<=180;
function countryName(raw,codes,display){
 const value=norm(raw);if(!value)return '';
 for(const code of codes){
  const title=norm(display(code));
  if(value===title||value===norm(code)||value===title+', '+title)return code;
 }
 const aliases={equador:'EC','republica del ecuador':'EC','republic of ecuador':'EC',usa:'US',eeuu:'US','united states':'US'};
 return aliases[value]||'';
}
function choose(results,iso,countryOnly=false){
 if(!Array.isArray(results)||!/^[A-Z]{2}$/.test(String(iso||'')))return null;
 const expected=iso.toLowerCase();
 return results.find(r=>{
  if(!r||!valid(r.lat,r.lon))return false;
  const kind=norm([r.type,r.addresstype,r.category].join(' '));
  if(/\bequator\b|\becuator\b|\bequateur\b/.test(kind))return false;
  if(String(r.address?.country_code||'').toLowerCase()!==expected)return false;
  if(!countryOnly)return true;
  return r.addresstype==='country'||r.type==='country'||(r.type==='administrative'&&r.class==='boundary');
 })||null;
}
const known=Object.freeze({EC:Object.freeze({lat:-1.8312,lon:-78.1834,label:'Ecuador'})});
root.BC_GEO_SCOPE=Object.freeze({countryName,choose,valid,countryFocus:iso=>known[iso]||null});
})(typeof window!=='undefined'?window:globalThis);
