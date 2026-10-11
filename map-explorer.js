/* BuscaClientes shell 011 — read-only interactive view of observed geographic contacts.
 * No third-party map tiles, no remote requests, no CRM mutation, no market-yield claims.
 */
(function(root){
'use strict';
const api=root.BC_OPPORTUNITIES;
if(!api)return;
const FILTERS=Object.freeze([
 {id:'all',label:'Todos'},
 {id:'web',label:'Con web'},
 {id:'email',label:'Con email'},
 {id:'phone',label:'Con teléfono'},
 {id:'none',label:'Sin canal'}
]);
function matches(p,filter){
 switch(filter){
  case 'web':return !!p.website;
  case 'email':return !!p.email;
  case 'phone':return !!p.phone;
  case 'none':return !p.website&&!p.email&&!p.phone;
  default:return true;
 }
}
function cluster(points,cellSize=58){
 const size=Number.isFinite(cellSize)&&cellSize>=24&&cellSize<=120?cellSize:58;
 const buckets=new Map();
 for(const p of Array.isArray(points)?points:[]){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)continue;
  const x=50+800*p.x,y=35+400*p.y;
  const key=Math.floor((x-50)/size)+','+Math.floor((y-35)/size);
  let slot=buckets.get(key);
  if(!slot){slot={key,rows:[],sumX:0,sumY:0};buckets.set(key,slot)}
  slot.rows.push(p);slot.sumX+=x;slot.sumY+=y;
 }
 return [...buckets.values()].map(s=>({
  key:s.key,count:s.rows.length,x:s.sumX/s.rows.length,y:s.sumY/s.rows.length,
  rows:s.rows.slice().sort((a,b)=>a.name.localeCompare(b.name,'es'))
 })).sort((a,b)=>a.y-b.y||a.x-b.x);
}
root.BC_MAP_EXPLORER=Object.freeze({FILTERS,matches,cluster});
if(typeof document==='undefined')return;
const byId=id=>document.getElementById(id);
const node=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el};
const svgn=(tag,attrs={})=>{
 const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
 return el;
};
function safeExternal(text){
 const str=String(text??'').trim();
 if(!str)return '';
 try{
  const value=new URL(/^https?:\/\//i.test(str)?str:'https://'+str);
  return /^https?:$/.test(value.protocol)&&value.hostname.includes('.')&&!value.username&&!value.password?value.href:'';
 }catch{return ''}
}
let all=[],savedKeys=new Set(),current='all',selected='',at=0,clusters=[];
function detail(g){
 const panel=byId('bcMapDetail');if(!panel)return;
 panel.replaceChildren();
 if(!g){panel.appendChild(node('p','bc-map-empty',
   all.length?'Selecciona un marcador para ver sus establecimientos y sus fuentes.':'Busca negocios en la app para activar esta vista.'));return}
 panel.appendChild(node('h3','',g.count>1?g.count+' establecimientos observados':'Establecimiento observado'));
 panel.appendChild(node('p','bc-map-disclaimer','Coordenadas observadas · No se infiere demanda, oportunidad garantizada ni rentabilidad.'));
 const list=node('div','bc-map-list');
 for(const p of g.rows.slice(0,15)){
  const row=node('article','bc-map-contact');
  row.appendChild(node('strong','',p.name));
  row.appendChild(node('span','',p.category+(savedKeys.has(p.id)?' · En mi cartera':' · Consulta observada')));
  row.appendChild(node('p','',p.address||'Dirección no publicada'));
  const evidence=node('small','', 'Fuente: '+(p.source||'No documentada')+
   ' · '+(p.created?'Guardado: '+p.created.slice(0,10):'Sin fecha de verificación publicada'));
  row.appendChild(evidence);
  const actions=node('div','bc-map-links');
  const website=safeExternal(p.website),source=safeExternal(p.source);
  if(website){
   const a=node('a','','Sitio publicado ↗');a.href=website;a.target='_blank';a.rel='noopener noreferrer';actions.appendChild(a);
  }
  if(source){
   const a=node('a','','Consultar fuente ↗');a.href=source;a.target='_blank';a.rel='noopener noreferrer';actions.appendChild(a);
  }
  if(savedKeys.has(p.id)){
   const a=node('a','','Abrir cartera ↗');a.href='./index.html#radar';actions.appendChild(a);
  }
  row.appendChild(actions);list.appendChild(row);
 }
 panel.appendChild(list);
 if(g.count>15)panel.appendChild(node('p','bc-map-empty',(g.count-15)+' establecimientos adicionales agrupados en este marcador.'));
}
function render(){
 const svg=byId('geoMap'),buttons=byId('bcMapFilters');
 if(!svg||!buttons)return;
 svg.querySelectorAll('[data-bc-marker]').forEach(e=>e.remove());
 for(const b of buttons.querySelectorAll('[data-map-filter]')){
  const filter=b.dataset.mapFilter;
  b.setAttribute('aria-pressed',String(filter===current));
  const count=all.filter(p=>matches(p,filter)).length;
  b.textContent=(FILTERS.find(t=>t.id===filter)?.label||filter)+' · '+count;
 }
 const display=all.filter(p=>matches(p,current));
 clusters=cluster(display);
 byId('bcMapCount').textContent=display.length+' contactos ubicados · '+clusters.length+
  (clusters.length===1?' marcador':' marcadores')+
  (current==='all'?'':' · filtro activo');
 if(!clusters.some(c=>c.rows.some(p=>p.id===selected)))selected='';
 for(const g of clusters){
  const focused=selected&&g.rows.some(p=>p.id===selected);
  const el=svgn('g',{'data-bc-marker':g.key,role:'button',tabindex:0,
   'aria-label':(g.count===1?g.rows[0].name:g.count+' establecimientos agrupados')+
    '. Pulsar Enter para consultar fuentes.',
   'aria-pressed':String(!!focused),class:'bc-map-marker'+(g.count>1?' clustered':'')+(focused?' selected':'')});
  const radius=g.count>1?17:7.5;
  el.appendChild(svgn('circle',{cx:g.x,cy:g.y,r:radius}));
  if(g.count>1){const label=svgn('text',{x:g.x,y:g.y+5,'text-anchor':'middle'});label.textContent=String(g.count);el.appendChild(label)}
  const title=svgn('title');title.textContent=g.count>1?g.count+' registros públicos en esta zona':g.rows[0].name;
  el.appendChild(title);
  const choose=()=>{selected=g.rows[0].id;render();};
  el.addEventListener('click',choose);
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();svg.querySelector('[data-bc-marker="'+g.key+'"]')?.focus()}});
  svg.appendChild(el);
 }
 const match=clusters.find(g=>g.rows.some(p=>p.id===selected));
 detail(match||null);
 if(!display.length&&all.length){
  const pane=byId('bcMapDetail');
  pane.replaceChildren(node('p','bc-map-empty','No hay contactos que coincidan con este filtro. Prueba Todos. No significa que no existan establecimientos.'));
 }
}
function incoming(event){
 const snapshot=event.detail||{},saved=api.unique(snapshot.saved||[]),
  observed=api.unique([...saved,...api.unique(snapshot.results||[])]);
 savedKeys=new Set(saved.map(r=>r.id));
 // Always project filters in the SAME geographic frame to avoid map drift.
 all=api.cells(observed).points;
 at=Number(snapshot.at)||0;
 render();
}
const controls=byId('bcMapFilters');
if(controls){
 controls.addEventListener('click',e=>{
  const button=e.target.closest('button[data-map-filter]');
  if(!button||!controls.contains(button))return;
  const filter=button.dataset.mapFilter;
  if(!FILTERS.some(t=>t.id===filter))return;
  current=filter;selected='';render();
 });
 document.addEventListener('bc:snapshot-ready',incoming);
}
})(typeof window!=='undefined'?window:globalThis);
