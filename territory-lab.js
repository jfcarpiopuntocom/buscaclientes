/* BuscaClientes v1.0 shell 007 — comparative territorial laboratory.
 * Read-only, same-origin snapshot. This is NOT a high-yield financial predictor.
 * No client credentials, CRM mutation, network calls, or synthetic companies.
 */
(function(root){
'use strict';
const api=root.BC_OPPORTUNITIES;
if(!api)return;
const axes=Object.freeze([
 {id:'rivalry',label:'Rivalidad y diferenciación',question:'¿Qué competidores ofrecen una alternativa comparable?',status:'MUESTRA PARCIAL'},
 {id:'buyers',label:'Compradores',question:'¿Qué necesidades o disposiciones a pagar están documentadas?',status:'SIN MEDIR'},
 {id:'suppliers',label:'Proveedores',question:'¿Qué insumos y condiciones verificables permiten competir?',status:'SIN MEDIR'},
 {id:'entrants',label:'Nuevos entrantes',question:'¿Qué barreras y nuevas aperturas están comprobadas?',status:'SIN MEDIR'},
 {id:'substitutes',label:'Sustitutos',question:'¿Qué alternativas reales y precios están disponibles?',status:'SIN MEDIR'}
]);
const valid=p=>p.lat!==null&&p.lon!==null&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
function inspect(input,sector=''){
 const all=api.unique(input),selected=sector?all.filter(p=>p.category===sector):all;
 // The territorial frame is fixed by ALL observed geocodes: comparisons do not re-scale.
 const frame=api.cells(all), cells=Array.from({length:9},(_,id)=>({
  id,count:0,withWebsite:0,withChannel:0,unpublishedWebsite:0,
  rows:[],sources:{}
 }));
 const seen=selected.filter(valid);
 const originalPoints=new Map(frame.points.map(p=>[p.id,p]));
 for(const p of seen){
  const point=originalPoints.get(p.id);if(!point)continue;
  const col=Math.min(2,Math.floor(point.x*3)),row=Math.min(2,Math.floor(point.y*3));
  const cell=cells[row*3+col];
  cell.rows.push(p);cell.count++;
  if(p.website)cell.withWebsite++;else cell.unpublishedWebsite++;
  if(p.website||p.phone||p.email)cell.withChannel++;
  cell.sources[p.source]=(cell.sources[p.source]||0)+1;
 }
 return {sector,observed:all.length,selected:selected.length,located:seen.length,
  outside:selected.length-seen.length,frame:frame.extent,cells,
  sectors:[...new Set(all.map(p=>p.category))].sort((a,b)=>a.localeCompare(b,'es')),
  forces:axes.map((f,i)=>({...f,observed:i===0?seen.length:null})),
  interpretation:seen.length<3?'MUESTRA INSUFICIENTE':'MUESTRA EXPLORATORIA',
  yieldStatus:'NO ESTIMABLE: faltan datos de demanda, precios, costos y sustitutos',
  disclaimer:'Los negocios y canales provienen de la muestra visible. Una web no publicada en esa muestra no significa que el negocio carezca de web.'
 };
}
root.BC_TERRITORY_LAB=Object.freeze({inspect,axes});
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id), el=(tag,cls,value)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;
};
let input=[],saved=[],sector='',chosen=null,analysis=inspect([]);
function refresh(){
 analysis=inspect(input,sector);
 const picker=$('tlSector'),last=picker.value;
 picker.replaceChildren();
 const all=el('option','', 'Todos los sectores');all.value='';picker.appendChild(all);
 for(const s of analysis.sectors){const o=el('option','',s);o.value=s;picker.appendChild(o)}
 picker.value=analysis.sectors.includes(sector)?sector:'';
 if(picker.value!==sector){sector='';analysis=inspect(input)}
 $('tlCount').textContent=analysis.located+' contactos ubicados · '+analysis.selected+' registros del sector';
 $('tlQuality').textContent=analysis.interpretation+' · ningún cálculo de rentabilidad';
 $('tlMissing').textContent=analysis.outside+
  ' registros sin coordenadas válidas · las cuadrículas vacías NO prueban ausencia de negocios';
 const grid=$('tlGrid');grid.replaceChildren();
 const max=Math.max(1,...analysis.cells.map(c=>c.count));
 for(const c of analysis.cells){
  const b=el('button','tl-cell');
  b.type='button';b.dataset.id=String(c.id);
  b.dataset.band=String(c.count===0?0:c.count>=6?3:c.count>=3?2:1);
  b.setAttribute('aria-pressed',String(chosen===c.id));
  b.setAttribute('aria-label','Cuadrante '+(c.id+1)+': '+c.count+' contactos ubicados');
  b.appendChild(el('span','tl-cell-label','Cuadrante '+(c.id+1)));
  b.appendChild(el('strong','',c.count));
  b.appendChild(el('span','tl-cell-foot','contactos de la muestra'));
  b.addEventListener('click',()=>{chosen=c.id;refresh()});
  grid.appendChild(b);
 }
 const available=analysis.cells.filter(c=>c.count);
 if(chosen===null&&available.length){chosen=available[0].id;refresh();return}
 const current=analysis.cells.find(c=>c.id===chosen);
 if(!current){$('tlDetails').replaceChildren(el('p','tl-empty','Consulta un sector en BuscaClientes para examinar sus cuadrantes.'))}
 else{
  const detail=$('tlDetails');detail.replaceChildren();
  detail.appendChild(el('h3','', 'Cuadrante '+(current.id+1)));
  detail.appendChild(el('p','tl-facts',current.count+' contactos · '+current.withWebsite+
   ' webs publicadas en la muestra · '+current.withChannel+' con algún canal público'));
  detail.appendChild(el('p','tl-caution',current.unpublishedWebsite+
   ' sin web registrada en esta muestra (NO equivale a web inexistente).'));
  if(current.count===0)detail.appendChild(el('p','tl-empty',
   'No aparecen negocios de este sector en este cuadrante de la muestra. Sin información para concluir sobre el mercado.'));
  for(const p of current.rows.slice(0,12)){
   const item=el('div','tl-business');
   item.appendChild(el('strong','',p.name));
   item.appendChild(el('span','',p.category+' · '+p.source));
   item.appendChild(el('small','',p.address||'Sin dirección publicada'));
   detail.appendChild(item);
  }
  if(current.count>12)detail.appendChild(el('p','tl-empty',String(current.count-12)+' más en este cuadrante'));
 }
 const forces=$('tlEvidence');forces.replaceChildren();
 for(const f of analysis.forces){
  const line=el('div','tl-evidence');
  line.appendChild(el('b','',f.label));
  line.appendChild(el('p','',f.question));
  line.appendChild(el('span','',f.id==='rivalry'?f.observed+' contactos sectoriales observados (NO un censo)':f.status));
  forces.appendChild(line);
 }
 // A relative sample-density overlay, never a heatmap of profitability.
 const svg=$('geoMap'),old=$('tlOverlay');old?.remove();
 if($('tlOverlayToggle').checked&&analysis.frame){
  const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');
  g.id='tlOverlay';g.setAttribute('pointer-events','none');
  for(const c of analysis.cells){
   if(!c.count)continue;
   const r=document.createElementNS(ns,'rect');
   const col=c.id%3,row=Math.floor(c.id/3);
   r.setAttribute('x',String(50+800*col/3));
   r.setAttribute('y',String(35+400*row/3));
   r.setAttribute('width',String(800/3));r.setAttribute('height',String(400/3));
   r.setAttribute('fill','#27B1CE');r.setAttribute('fill-opacity',String(.08+.24*c.count/max));
   g.appendChild(r);
  }
  const firstLine=svg.querySelector('line');
  svg.insertBefore(g,firstLine||svg.firstChild?.nextSibling||null);
 }
}
function csv(){
 const quote=v=>{
  let s=String(v??'').replace(/[\r\n]+/g,' ');
  if(/^[=+@-]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
 };
 const head=['sector','cuadrante','contactos_muestra','web_publicada_muestra',
             'sin_web_publicada_muestra','con_canal_publico','fuentes','nivel_evidencia'];
 const records=analysis.cells.map(c=>[
  analysis.sector||'Todos',c.id+1,c.count,c.withWebsite,c.unpublishedWebsite,
  c.withChannel,Object.keys(c.sources).join(' | '),analysis.interpretation
 ]);
 const data='\uFEFF'+[head,...records].map(row=>row.map(quote).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));
 const a=el('a');a.href=url;a.download='BuscaClientes-Atlas-Muestra.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function connectSnapshot(e){
 const d=e.detail||{};
 saved=api.unique(d.saved);
 input=api.unique([...saved,...api.unique(d.results)]);
 refresh();
}
document.addEventListener('bc:snapshot-ready',connectSnapshot);
$('tlSector').addEventListener('change',e=>{sector=e.target.value;chosen=null;refresh()});
$('tlOverlayToggle').addEventListener('change',refresh);
$('tlExport').addEventListener('click',csv);
input=api.unique(root.BC_DASHBOARD_BUS?.localRows()||[]);
saved=input.slice();refresh();
})(typeof window!=='undefined'?window:globalThis);
