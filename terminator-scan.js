/* Terminator-like scan → geographic zero-in → hand-off to existing Periscope.
   Pure visual acquisition; never fakes business results or modifies CRM. */
(function(root){
'use strict';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const byId=id=>document.getElementById(id);
const set=(id,text)=>{const x=byId(id);if(x)x.textContent=text};
async function acquire(city,focus){
 if(!Array.isArray(city)||!Number.isFinite(Number(city[2]))||!Number.isFinite(Number(city[3])))throw Error('invalid_scan_target');
 if(typeof focus!=='function')throw Error('missing_globe_focus');
 const globe=byId('globe'),hud=byId('targetUI'),coords=byId('targetCoords');
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const hunting=reduced?250:1450,locking=reduced?350:3000;
 try{
  globe?.classList.remove('bc-locking','acquiring');
  hud?.classList.remove('active');
  globe?.classList.add('bc-hunting');
  root.dispatchEvent?.(new CustomEvent('bc:globe-scan')); // new hunt resumes globe rotation until next zero-in
  if(coords)coords.textContent='WORLD SCAN · ACQUIRING';
  set('scopeBadge','RASTREANDO');
  set('scopeHeadline','Escaneando el mundo en busca de oportunidades…');
  set('scopeCity','Analizando posibles destinos');
  set('scopeEvidence','Barrido geográfico · objetivo aún no fijado');
  set('scopeDetailCity','Localizando…');
  set('stepGeo','Rastreando…');
  set('stepQuery','En espera del objetivo');
  set('cityMarker','BUSCANDO DESTINO…');
  await wait(hunting);
  globe?.classList.remove('bc-hunting');
  globe?.classList.add('bc-locking');
  set('scopeBadge','FIJANDO OBJETIVO');
  set('scopeHeadline','Fijando objetivo: '+String(city[0])+'…');
  set('scopeCity','Zeroing in · '+String(city[0]));
  set('scopeEvidence','Objetivo geográfico: '+Number(city[2]).toFixed(2)+'°, '+Number(city[3]).toFixed(2)+'°');
  set('scopeDetailCity',String(city[0]));
  set('stepGeo',String(city[0]));
  set('cityMarker',String(city[0]).toUpperCase().slice(0,34));
  focus(city); // Existing globe engine rotates and zooms to actual lat/lon.
  await wait(locking);
  set('scopeBadge','CONSULTANDO');
  set('scopeHeadline','Buscando negocios en '+String(city[0])+'…');
  set('scopeCity',String(city[0]));
  set('scopeEvidence','Objetivo fijado · consultando fuentes públicas');
  set('stepQuery','Consultando…');
  return {target:String(city[0]),reducedMotion:reduced};
 }finally{
  globe?.classList.remove('bc-hunting','bc-locking');
  hud?.classList.remove('active');
 }
}
root.BC_TERMINATOR_SCAN=acquire;
})(typeof window!=='undefined'?window:globalThis);
