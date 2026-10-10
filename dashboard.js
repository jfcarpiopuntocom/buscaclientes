/* BuscaClientes shell 006 — read-only report rendering.
 * No data mutation. Mirrors useful patterns from friendly-123's owner dashboard
 * (KPI hub, easy printing, source pulse, CSV fallback, clear degradation).
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),api=root.BC_OPPORTUNITIES,bus=root.BC_DASHBOARD_BUS;
if(!api||!bus){$('liveState').textContent='Módulos de lectura no disponibles';return}
let state={saved:[],results:[],connected:false,city:'',at:0},filtered=[];
const fmt=new Intl.NumberFormat('es-EC');
const safe=v=>String(v??'').replace(/[\u0000-\u001f]/g,' ').trim();
function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function clear(node){node.replaceChildren()}
function value(id,n){$(id).textContent=fmt.format(n)}
function rows(){return api.unique([...state.saved,...state.results])}
const STAGES={new:'Nuevo',contacted:'Contactado',followup:'Seguimiento',qualified:'Calificado',won:'Ganado',lost:'Descartado'};
function bar(parent,key,amount,maximum){
 const line=element('div','bar-row');
 line.appendChild(element('b','',key));
 const track=element('div','track'),fill=element('span','fill');fill.style.width=(maximum>0?Math.round(100*amount/maximum):0)+'%';
 track.appendChild(fill);line.appendChild(track);line.appendChild(element('span','',fmt.format(amount)));
 parent.appendChild(line);
}
function drawStats(){
 const all=rows(),data=api.stats(all);
 value('kTotal',data.count);value('kSaved',api.unique(state.saved).length);
 value('kContact',data.withChannel);value('kGeo',data.located);
 const sectors=$('sectors');clear(sectors);
 if(!all.length)sectors.appendChild(element('p','empty','No hay contactos. Busca un sector en la aplicación y abre este dashboard.'));
 else{
  const groups=new Map();all.forEach(x=>groups.set(x.category,(groups.get(x.category)||0)+1));
  const series=[...groups].sort((a,b)=>b[1]-a[1]).slice(0,10);
  for(const [name,n] of series)bar(sectors,name,n,Math.max(...series.map(x=>x[1])));
 }
 const stages=$('stages');clear(stages);
 const saved=api.unique(state.saved);
 if(!saved.length)stages.appendChild(element('p','empty','Tu cartera aún está vacía. Guarda contactos en BuscaClientes.'));
 else{
  const counts=new Map();saved.forEach(x=>counts.set(x.stage,(counts.get(x.stage)||0)+1));
  for(const [name,n] of counts)bar(stages,STAGES[name]||name,n,saved.length);
 }
}
function svgNode(tag,attrs={},text){
 const e=document.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
 if(text!==undefined)e.textContent=String(text);
 return e;
}
function drawGeo(){
 const m=$('geoMap');clear(m);
 m.appendChild(svgNode('rect',{x:0,y:0,width:900,height:480,fill:'#0B1730'}));
 const geo=api.cells(rows());
 const bounds=$('mapBounds'),status=$('mapStatus'),gaps=$('gaps');
 clear(gaps);bounds.textContent=geo.extent?
   [geo.extent.minLat.toFixed(2)+'°',geo.extent.minLon.toFixed(2)+'°','→',geo.extent.maxLat.toFixed(2)+'°',geo.extent.maxLon.toFixed(2)+'°'].join(' '):
   'Sin coordenadas observadas';
 status.textContent=geo.usable?'Muestra geográfica disponible':'Datos insuficientes';
 for(let i=1;i<3;i++){
  m.appendChild(svgNode('line',{x1:50+800*i/3,y1:35,x2:50+800*i/3,y2:435,stroke:'#326B82','stroke-width':1,'stroke-dasharray':'6 9'}));
  m.appendChild(svgNode('line',{x1:50,y1:35+400*i/3,x2:850,y2:35+400*i/3,stroke:'#326B82','stroke-width':1,'stroke-dasharray':'6 9'}));
 }
 if(!geo.points.length){
  m.appendChild(svgNode('text',{x:450,y:240,fill:'#B2C7DD','text-anchor':'middle','font-size':20},'Aún no hay contactos con coordenadas'));
  gaps.appendChild(element('p','empty',geo.notice));return;
 }
 for(const p of geo.points.slice(0,250)){
  const dot=svgNode('circle',{cx:50+800*p.x,cy:35+400*p.y,r:5.4,fill:'#F97316',stroke:'#FFDCB6','stroke-width':1,opacity:.9});
  dot.appendChild(svgNode('title',{},p.name+' — '+(p.address||p.category)));
  m.appendChild(dot);
 }
 m.appendChild(svgNode('text',{x:50,y:460,fill:'#9AB8D0','font-size':15},'Posiciones relativas de las coordenadas observadas · no incluye mapa base ni estimaciones'));
 const potential=geo.cells.filter(c=>c.count).sort((a,b)=>b.infoGap-a.infoGap||b.count-a.count).slice(0,5);
 for(const cell of potential){
  const label='Cuadrante '+(cell.id+1),e=element('div','gap');
  e.appendChild(element('b','',label+': '+cell.count+' contactos'));
  e.appendChild(element('span','',cell.web+' con web publicada'));
  gaps.appendChild(e);
 }
 gaps.appendChild(element('p','small-info',geo.notice));
}
function drawPorter(){
 const region=$('forces');clear(region);
 for(const force of api.porter(rows())){
  const c=element('article','force');
  c.appendChild(element('span','index',String(region.children.length+1).padStart(2,'0')+'/05'));
  c.appendChild(element('h3','',force.label));
  c.appendChild(element('span','status',force.status));
  c.appendChild(element('p','',force.need));
  c.appendChild(element('p','',force.evidence));
  if(force.id==='rivalry'&&force.metric!==null)c.appendChild(element('strong','',fmt.format(force.metric)+' establecimientos observados (muestra)'));
  region.appendChild(c);
 }
}
function filteredRows(){
 const search=safe($('filter').value).toLocaleLowerCase();
 return api.unique(state.saved).filter(r=>[r.name,r.category,r.address,r.phone,r.email,r.website,r.stage].some(v=>String(v||'').toLocaleLowerCase().includes(search)));
}
function renderTable(){
 const tbody=$('contactRows');clear(tbody);filtered=filteredRows();
 $('shown').textContent=filtered.length+' contactos en la cartera';
 if(!filtered.length){const tr=element('tr'),td=element('td','empty','No hay contactos guardados que coincidan con este filtro.');td.colSpan=6;tr.appendChild(td);tbody.appendChild(tr);return}
 for(const item of filtered.slice(0,250)){
  const tr=element('tr');
  const cols=[
   item.name,item.category,item.address||'Sin ubicación detallada',
   [item.email,item.phone,item.website].filter(Boolean).join(' · ')||'Sin canal publicado',
   STAGES[item.stage]||item.stage,item.source
  ];
  cols.forEach((v,i)=>{
   const td=element('td','',v);
   if(i===0)td.style.fontWeight='800';
   tr.appendChild(td);
  });
  tbody.appendChild(tr);
 }
}
function paint(){
 const all=rows();const status=$('liveState');
 status.textContent=state.connected?'App conectada · mismo navegador':'Cartera local · abre BuscaClientes para resultados en vivo';
 status.dataset.live=state.connected?'yes':'no';
 $('source').textContent=state.connected?'Aplicación abierta · canal local':'Almacenamiento de tu navegador';
 $('refreshed').textContent=state.at?'Datos recibidos: '+new Date(state.at).toLocaleTimeString('es-EC'):'Solo contactos guardados';
 drawStats();drawGeo();drawPorter();renderTable();
}
function exportCSV(){
 const data=filteredRows();
 if(!data.length){$('shown').textContent='No hay contactos para exportar';return}
 const cols=['name','category','address','email','phone','website','stage','source','lat','lon'];
 const quote=x=>{let s=String(x??'').replace(/[\r\n]+/g,' ');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const csv='\uFEFF'+cols.join(',')+'\r\n'+data.map(row=>cols.map(col=>quote(row[col])).join(',')).join('\r\n');
 const a=element('a');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 a.href=url;a.download='BuscaClientes-Contactos-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 $('shown').textContent=data.length+' contactos · CSV exportado';
}
const connection=bus.connectDashboard(snapshot=>{state=snapshot;paint()});
$('filter').addEventListener('input',renderTable);
$('refresh').addEventListener('click',()=>connection.refresh());
$('print').addEventListener('click',()=>root.print());
$('csv').addEventListener('click',exportCSV);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint()});
})(typeof window!=='undefined'?window:globalThis);
