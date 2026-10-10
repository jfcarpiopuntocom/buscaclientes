/* BuscaClientes · shell 006 · five-forces evidence layer.
 * A local, exploratory REVERSE-PORTER RESEARCH WORKBENCH, NOT an assertion
 * of an undocumented JF Carpio formula or a verified market-yield predictor.
 * The first dimension is observed local rivalry (sample count);
 * four remain intentionally UNMEASURED until admissible sources exist.
 * Source: the user's own explicitly acquired OSM/CRM contact records only.
 */
(function(root){
'use strict';
const clean=s=>String(s??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,180);
const numeric=n=>Number.isFinite(Number(n))&&n!==null&&n!==''?Number(n):null;
const safeUrl=v=>{try{const u=new URL(String(v||'').startsWith('http')?v:'https://'+v);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}};
function normalize(row={}){
 if(!row||typeof row!=='object')return null;
 const name=clean(row.name);if(!name)return null;
 return {id:clean(row.id||name+'|'+row.address),name,category:clean(row.category||'Sin sector'),
  address:clean(row.address),lat:numeric(row.lat),lon:numeric(row.lon),
  website:safeUrl(row.website),phone:clean(row.phone),email:clean(row.email),
  source:clean(row.source||'Origen no documentado'),stage:clean(row.stage||'new'),
  created:clean(row.created),demo:!!row.demo};
}
function unique(input,limit=250){
 const map=new Map();
 for(const raw of Array.isArray(input)?input.slice(0,limit*2):[]){
  const row=normalize(raw);if(!row||row.demo)continue;
  const key=row.id||row.name+'|'+row.address;
  if(!map.has(key))map.set(key,row);
  if(map.size>=limit)break;
 }
 return [...map.values()];
}
function stats(rows){
 const arr=unique(rows),located=arr.filter(x=>x.lat!==null&&x.lon!==null&&Math.abs(x.lat)<=90&&Math.abs(x.lon)<=180);
 const web=arr.filter(x=>x.website).length,contact=arr.filter(x=>x.phone||x.email||x.website).length;
 const stage={};arr.forEach(x=>stage[x.stage]=(stage[x.stage]||0)+1);
 return {count:arr.length,located:located.length,withWebsite:web,withChannel:contact,
  websitePublishedPct:arr.length?Math.round(100*web/arr.length):null,
  stages:stage,sectorCount:new Set(arr.map(x=>x.category)).size};
}
const forces=[
 {id:'rivalry',label:'Rivalidad observada',need:'Cobertura de competidores por sector y territorio'},
 {id:'buyers',label:'Poder de compradores',need:'Demanda, concentración de clientes y sensibilidad al precio'},
 {id:'suppliers',label:'Poder de proveedores',need:'Costos e insumos disponibles por sector'},
 {id:'entrants',label:'Amenaza de nuevos entrantes',need:'Barreras verificadas, regulación y tasa de entradas'},
 {id:'substitutes',label:'Amenaza de sustitutos',need:'Alternativas de solución, precios y preferencias'}
];
function porter(rows){
 const data=unique(rows),sectors=new Map();
 for(const row of data){sectors.set(row.category,(sectors.get(row.category)||0)+1)}
 const first={...forces[0],status:data.length?'MUESTRA OBSERVADA':'SIN DATOS',metric:data.length,
  evidence:'Número de establecimientos visibles en la muestra obtenida, NO censo completo ni nivel de competencia del mercado.'};
 return [first,...forces.slice(1).map(f=>({...f,status:'NO MEDIDO',metric:null,evidence:'Sin datos suficientes en las fuentes actuales; no se asigna puntaje.'}))];
}
function cells(rows){
 const points=unique(rows).filter(x=>x.lat!==null&&x.lon!==null&&Math.abs(x.lat)<=90&&Math.abs(x.lon)<=180);
 if(!points.length)return {cells:[],points:[],extent:null,usable:false,notice:'No hay coordenadas suficientes para dibujar el territorio.'};
 let minLat=Math.min(...points.map(p=>p.lat)),maxLat=Math.max(...points.map(p=>p.lat)),minLon=Math.min(...points.map(p=>p.lon)),maxLon=Math.max(...points.map(p=>p.lon));
 const latSpan=Math.max(maxLat-minLat,.01),lonSpan=Math.max(maxLon-minLon,.01),centerLat=(minLat+maxLat)/2,centerLon=(minLon+maxLon)/2;
 // Pad the bbox so a single business doesn't look like full-market coverage.
 minLat=centerLat-latSpan*.72;maxLat=centerLat+latSpan*.72;
 minLon=centerLon-lonSpan*.72;maxLon=centerLon+lonSpan*.72;
 const groups=Array.from({length:9},(_,id)=>({id,col:id%3,row:2-Math.floor(id/3),count:0,web:0,channel:0,items:[]}));
 const normalizedPoints=[];
 for(const p of points){
  const x=Math.max(0,Math.min(.999999,(p.lon-minLon)/(maxLon-minLon)));
  const y=Math.max(0,Math.min(.999999,(maxLat-p.lat)/(maxLat-minLat)));
  const col=Math.min(2,Math.floor(x*3)),row=Math.min(2,Math.floor(y*3));const g=groups[row*3+col];
  g.count++;g.web+=p.website?1:0;g.channel+=p.website||p.email||p.phone?1:0;g.items.push(p);
  normalizedPoints.push({...p,x,y});
 }
 const sample=points.length;
 return {cells:groups.map(({items,...cell})=>({...cell,
  publishedWebsitePct:cell.count?Math.round(cell.web/cell.count*100):null,
  infoGap:cell.count?cell.count-cell.web:0,
  assessment:cell.count>=3?'REVISAR':'MUESTRA PEQUEÑA'})),
  points:normalizedPoints,extent:{minLat,maxLat,minLon,maxLon},
  usable:sample>=3,notice:sample>=3?'Concentración de contactos en la muestra; NO estimación de demanda ni rentabilidad.':'Muestra pequeña: no atribuir ventajas ni rendimiento al territorio.'};
}
function analyse(rows){return {stats:stats(rows),forces:porter(rows),geo:cells(rows),rows:unique(rows)}}
root.BC_OPPORTUNITIES=Object.freeze({normalize,unique,stats,porter,cells,analyse});
})(typeof window!=='undefined'?window:globalThis);
