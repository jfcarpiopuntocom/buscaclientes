/* BuscaClientes Shell017 — Relationship cockpit: local-first, zero fictitious leads.
 * Edits existing bc-crm-durable-v1 ONLY after explicit Save; no remote writes.
 * Payment and contact quota are NEVER authorized by this script.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),KEY='bc-crm-durable-v1';
const STAGES={new:'Nuevo',contacted:'Contactado',followup:'En seguimiento',qualified:'Calificado',won:'Ganado',lost:'Archivado'};
let filter='attention',query='',selected='',limit=40,baseline=null;
const lang=()=>{try{return ['es','en','pt'].includes(localStorage.getItem('bc-lang'))?localStorage.getItem('bc-lang'):'es'}catch{return'es'}};
const L={
 es:{empty:'Aún no hay contactos en esta vista.',discover:'Descubre un establecimiento y guárdalo en tu cartera para empezar.',next:'Sin próximo paso',today:'Para atender',future:'Programado',done:'Cerrado',notes:'Notas y contexto',action:'Siguiente acción',date:'Fecha de seguimiento',stage:'Etapa',save:'Guardar cambios',saved:'Cambios guardados en este navegador',conflict:'La ficha fue modificada en otra pestaña. Actualizamos la información antes de sobrescribirla; revisa y vuelve a guardar.',unavailable:'No se pudo guardar. Los datos anteriores permanecen intactos.',missing:'El contacto ya no está en este navegador: no se reemplazó nada.',more:'Mostrar más',total:'contactos',email:'Correo',phone:'Llamar',web:'Sitio web',source:'Fuente',whatsapp:'WhatsApp',pick:'Selecciona una ficha para trabajar en ella.',due:'Vencido',later:'Próximo',archive:'Sin fecha',none:'Sin canal publicado',repeat:'No pierdes contactos ni notas al cambiar de plan.'},
 en:{empty:'No contacts in this view yet.',discover:'Find a public business and save it to begin.',next:'No next step',today:'Needs attention',future:'Scheduled',done:'Closed',notes:'Notes and context',action:'Next action',date:'Follow-up date',stage:'Stage',save:'Save changes',saved:'Saved in this browser',conflict:'This contact changed in another tab. Its latest data was loaded. Review before saving again.',unavailable:'Could not save. Previous data is intact.',missing:'This contact is no longer stored here. Nothing was replaced.',more:'Show more',total:'contacts',email:'Email',phone:'Call',web:'Website',source:'Source',whatsapp:'WhatsApp',pick:'Choose a record to work on.',due:'Overdue',later:'Upcoming',archive:'No date',none:'No public channel',repeat:'Your contacts and notes remain yours.'},
 pt:{empty:'Ainda não há contactos nesta vista.',discover:'Descobre um negócio e guarda-o para começar.',next:'Sem próximo passo',today:'Precisa de atenção',future:'Agendado',done:'Concluído',notes:'Notas e contexto',action:'Próxima ação',date:'Data do seguimento',stage:'Etapa',save:'Guardar alterações',saved:'Alterações guardadas neste navegador',conflict:'Esta ficha mudou noutra aba. Recarregámos os dados; confirma antes de guardar novamente.',unavailable:'Não foi possível guardar. Os dados anteriores estão intactos.',missing:'Este contacto já não está guardado. Nada foi substituído.',more:'Mostrar mais',total:'contactos',email:'Email',phone:'Ligar',web:'Website',source:'Fonte',whatsapp:'WhatsApp',pick:'Seleciona uma ficha para trabalhar.',due:'Atrasado',later:'Próximo',archive:'Sem data',none:'Sem canal público',repeat:'Os teus contactos e notas continuam teus.'}
};
const i18n=()=>L[lang()]||L.es;
function read(){
 try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&typeof x==='object'&&typeof x.id==='string'&&x.id&&x.demo!==true):[]}catch{return []}
}
function elt(name,className,text){
 const node=document.createElement(name);if(className)node.className=className;
 if(text!==undefined)node.textContent=String(text);return node
}
function today(){
 const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return y+'-'+m+'-'+day
}
function closed(item){return item.stage==='won'||item.stage==='lost'}
function due(item){return !closed(item)&&typeof item.followUpAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.followUpAt)&&item.followUpAt<=today()}
function noNext(item){return !closed(item)&&!item.followUpAt}
function active(item){return !closed(item)}
function sortRows(items){
 return items.slice().sort((a,b)=>{
  const rank=x=>due(x)?0:noNext(x)?1:active(x)?2:3;
  const delta=rank(a)-rank(b);
  if(delta)return delta;
  if(rank(a)===0||rank(a)===2){const aDate=a.followUpAt||'9999',bDate=b.followUpAt||'9999';if(aDate!==bDate)return aDate.localeCompare(bDate)}
  return String(a.name||'').localeCompare(String(b.name||''),lang());
 })
}
function filtered(items){
 const q=query.trim().toLocaleLowerCase();
 return sortRows(items.filter(x=>{
  if(filter==='attention'&&!due(x)&&!noNext(x))return false;
  if(filter==='next'&&!noNext(x))return false;
  if(filter==='active'&&!active(x))return false;
  if(q&&!['name','address','category','notes','stage','nextAction'].some(k=>String(x[k]||'').toLocaleLowerCase().includes(q)))return false;
  return true
 }))
}
function feedback(message,isError){
 const node=$('crmEditFeedback');node.textContent=message||'';node.dataset.error=isError?'true':'false'
}
function safeLink(kind,raw){
 if(typeof raw!=='string')return'';
 const input=raw.trim();if(!input||input.length>700)return'';
 if(kind==='web'||kind==='source'){
  try{const url=new URL(input);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:''}catch{return''}
 }
 if(kind==='phone'){const x=input.replace(/[^+\d]/g,'');return x.replace(/\D/g,'').length>=6?'tel:'+x:''}
 if(kind==='email'){return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(input)?'mailto:'+input:''}
 if(kind==='whatsapp'){
  const digits=input.replace(/\D/g,'');return digits.length>=8&&digits.length<=15?'https://wa.me/'+digits:''
 }
 return''
}
function renderCards(){
 const items=read(),t=i18n(),visible=filtered(items);
 const live=items.filter(active),covered=live.filter(x=>Boolean(x.followUpAt)).length;
 $('crmTotalHero').textContent=items.length.toLocaleString();
 $('crmDue').textContent=items.filter(due).length.toLocaleString();
 $('crmNoNext').textContent=items.filter(noNext).length.toLocaleString();
 $('crmActive').textContent=live.length.toLocaleString();
 $('crmCoverage').textContent=live.length?Math.round(100*covered/live.length)+'%':'0%';
 $('crmAttentionCount').textContent=String(items.filter(x=>due(x)||noNext(x)).length);
 $('crmListCount').textContent=visible.length+' '+t.total;
 $('crmVisible').textContent=Math.min(limit,visible.length)+' de '+visible.length;
 $('crmShowMore').hidden=limit>=visible.length;
 $('crmShowMore').textContent=t.more;
 const cards=$('crmCards');cards.replaceChildren();
 if(!visible.length){
  const empty=elt('div','crm-empty');
  empty.appendChild(elt('strong','',t.empty));
  empty.appendChild(elt('p','',items.length?'Prueba otro filtro o busca por nombre.':t.discover));
  const a=elt('a','', '＋ '+(lang()==='es'?'Explorar negocios':'Discover businesses'));
  a.href='./index.html#radar';empty.appendChild(a);cards.appendChild(empty);return;
 }
 for(const item of visible.slice(0,limit)){
  const button=elt('button','crm-contact-card'+(item.id===selected?' is-selected':''));button.type='button';
  button.dataset.contactId=item.id;button.setAttribute('aria-pressed',String(item.id===selected));
  const top=elt('div','crm-card-top'),avatar=elt('div','crm-avatar',String(item.name||'?').trim().slice(0,1).toUpperCase()),info=elt('div','crm-card-info');
  info.appendChild(elt('strong','',item.name||'Sin nombre'));
  info.appendChild(elt('small','',[item.category,item.address].filter(Boolean).join(' · ')||'Ficha guardada'));
  top.append(avatar,info);button.appendChild(top);
  const badge=elt('div','crm-card-bottom');
  badge.appendChild(elt('span','crm-stage crm-stage-'+(STAGES[item.stage]?item.stage:'new'),STAGES[item.stage]||t.next));
  badge.appendChild(elt('span',due(item)?'crm-date is-due':'crm-date',due(item)?'● '+t.due+' · '+item.followUpAt:item.followUpAt?'◷ '+item.followUpAt:noNext(item)?'＋ '+t.next:'✓ '+t.done));
  button.appendChild(badge);
  if(item.nextAction)button.appendChild(elt('p','crm-next-action','⇢ '+item.nextAction.slice(0,120)));
  button.addEventListener('click',()=>{selected=item.id;renderCards();renderDetail();});
  const wrapper=elt('div','crm-card-item');wrapper.setAttribute('role','listitem');wrapper.appendChild(button);cards.appendChild(wrapper)
 }
}
function renderDetail(force=false){
 const pane=$('crmDetail'),t=i18n(),item=read().find(x=>x.id===selected);
 if(!item){
  baseline=null;pane.replaceChildren();
  const blank=elt('div','crm-detail-blank');blank.appendChild(elt('span','','✦'));
  blank.appendChild(elt('h3','',lang()==='es'?'Cada relación tiene historia.':'Every relationship has a story.'));
  blank.appendChild(elt('p','',t.pick));pane.appendChild(blank);return;
 }
 if(!force&&pane.contains(document.activeElement)&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 baseline={id:item.id,stage:item.stage||'new',notes:item.notes||'',nextAction:item.nextAction||'',followUpAt:item.followUpAt||'',modified:item.modified||''};
 pane.replaceChildren();
 const head=elt('div','crm-detail-head');
 head.appendChild(elt('span','crm-overline','RELATIONSHIP CARD / '+item.id.slice(0,65)));
 head.appendChild(elt('h2','',item.name||'Sin nombre'));
 head.appendChild(elt('p','',[item.address,item.category].filter(Boolean).join(' · ')||'Ficha guardada'));
 pane.appendChild(head);
 const links=elt('div','crm-channel-links');
 for(const [kind,val,label] of [['email',item.email,t.email],['phone',item.phone,t.phone],['web',item.website,t.web],['whatsapp',item.whatsapp,t.whatsapp],['source',item.source,t.source]]){
  const url=safeLink(kind,val);if(!url)continue;
  const a=elt('a','crm-channel-link',label+' ↗');a.href=url;
  if(kind==='web'||kind==='source'||kind==='whatsapp'){a.target='_blank';a.rel='noopener noreferrer';}links.appendChild(a)
 }
 if(!links.childElementCount)links.appendChild(elt('p','crm-channel-empty',t.none));
 pane.appendChild(links);
 const form=elt('form','crm-edit-form');form.id='crmEditForm';form.noValidate=true;
 const grid=elt('div','crm-edit-grid');
 const stageLabel=elt('label','',t.stage);const stage=elt('select');stage.name='stage';stage.id='crmStage';
 for(const [key,label] of Object.entries(STAGES)){const opt=elt('option','',label);opt.value=key;if(key===(item.stage||'new'))opt.selected=true;stage.appendChild(opt)}
 stageLabel.appendChild(stage);grid.appendChild(stageLabel);
 const dateLabel=elt('label','',t.date),date=elt('input');date.name='followUpAt';date.type='date';date.value=item.followUpAt||'';
 dateLabel.appendChild(date);grid.appendChild(dateLabel);form.appendChild(grid);
 const nextLabel=elt('label','',t.action),next=elt('input');next.name='nextAction';next.type='text';next.maxLength=180;
 next.placeholder=lang()==='es'?'Ej. Escribir el jueves para presentar una idea':'E.g. Follow up on Thursday';next.value=item.nextAction||'';
 nextLabel.appendChild(next);form.appendChild(nextLabel);
 const noteLabel=elt('label','',t.notes),notes=elt('textarea');notes.name='notes';notes.maxLength=1200;notes.rows=5;
 notes.placeholder=lang()==='es'?'¿Qué importa a este contacto? ¿Qué hablamos? ¿Qué sigue?':'What matters to this contact? What happened?';
 notes.value=item.notes||'';noteLabel.appendChild(notes);form.appendChild(noteLabel);
 const status=elt('p','crm-safe-caption','◉ '+(lang()==='es'?'Se guarda únicamente en este navegador. Editar no consume contactos.':t.repeat));form.appendChild(status);
 const button=elt('button','crm-save-button','✦ '+t.save);button.type='submit';form.appendChild(button);
 form.addEventListener('submit',saveDetail);
 pane.appendChild(form)
}
function saveDetail(event){
 event.preventDefault();const form=event.currentTarget,t=i18n();
 const rows=read(),idx=rows.findIndex(x=>x.id===selected);
 if(idx<0){feedback(t.missing,true);renderDetail(true);return}
 const current=rows[idx];if(!baseline||baseline.id!==selected){feedback(t.conflict,true);renderDetail(true);return}
 // Optimistic concurrency: never overwrite other-tab edits silently.
 for(const key of ['stage','notes','nextAction','followUpAt','modified']){
  if(String(current[key]||((key==='stage')?'new':''))!==String(baseline[key]||((key==='stage')?'new':''))){
   feedback(t.conflict,true);renderDetail(true);renderCards();return
  }
 }
 const f=new FormData(form),stage=String(f.get('stage')||'new'),notes=String(f.get('notes')||'').slice(0,1200),
 nextAction=String(f.get('nextAction')||'').slice(0,180),followUpAt=String(f.get('followUpAt')||'');
 if(!Object.hasOwn(STAGES,stage)||followUpAt&&!/^\d{4}-\d{2}-\d{2}$/.test(followUpAt)){feedback(t.unavailable,true);return}
 const original=localStorage.getItem(KEY);
 // read() strips demos; preserve original array exactly including records this panel does not manage.
 let all;try{all=JSON.parse(original||'[]')}catch{feedback(t.unavailable,true);return}
 if(!Array.isArray(all)){feedback(t.unavailable,true);return}
 const at=all.findIndex(x=>x&&x.id===selected&&!x.demo);
 if(at<0){feedback(t.missing,true);return}
 const persisted=all[at];
 for(const key of ['stage','notes','nextAction','followUpAt','modified']){
  if(String(persisted[key]||((key==='stage')?'new':''))!==String(baseline[key]||((key==='stage')?'new':''))){
   feedback(t.conflict,true);renderDetail(true);renderCards();return
  }
 }
 all[at]={...persisted,stage,notes,nextAction,followUpAt,modified:new Date().toISOString()};
 const tx=root.BC_CRM_TX;
 if(!tx||!tx.commit){feedback(t.unavailable,true);return}
 const outcome=tx.commit(localStorage,[[KEY,JSON.stringify(all)]]);
 if(!outcome.ok){feedback(t.unavailable,true);return}
 feedback(t.saved,false);
 root.dispatchEvent(new CustomEvent('bc:crm-saved',{detail:{id:selected}}));
 renderCards();renderDetail(true);
 // Never signal premium membership, never debit a save quota on an edit.
}
function openTab(name,setHash=false){
 const crm=name==='crm';
 $('workspaceCRM').hidden=!crm;$('workspaceIntel').hidden=crm;
 for(const [id,active] of [['tabCRM',crm],['tabIntel',!crm]]){
  const tab=$(id);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
 }
 if(setHash)history.replaceState(null,'',crm?'#crm':'#inteligencia');
}
function syncHash(){
 const h=decodeURIComponent(location.hash.slice(1));
 openTab(['inteligencia','resumen','mapa','territorio','porter'].includes(h)?'intel':'crm');
}
for(const [name,id] of [['crm','tabCRM'],['intel','tabIntel']])$(id).addEventListener('click',()=>openTab(name,true));
const tabs=[$('tabCRM'),$('tabIntel')];
for(const [i,button] of tabs.entries())button.addEventListener('keydown',e=>{
 if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();
 const n=e.key==='Home'?0:e.key==='End'?1:(i+(e.key==='ArrowRight'?1:-1)+2)%2;
 tabs[n].focus();openTab(n===0?'crm':'intel',true)
});
root.addEventListener('hashchange',syncHash);
document.querySelectorAll('[data-crm-filter]').forEach(button=>button.addEventListener('click',()=>{
 filter=button.dataset.crmFilter;limit=40;
 document.querySelectorAll('[data-crm-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 renderCards()
}));
$('crmQuickSearch').addEventListener('input',e=>{query=String(e.target.value||'');limit=40;renderCards()});
$('crmShowMore').addEventListener('click',()=>{limit+=40;renderCards()});
root.addEventListener('storage',e=>{if(e.key===KEY){renderCards();renderDetail();}});
root.addEventListener('bc:crm-saved',()=>{renderCards();renderDetail()});
document.addEventListener('bc:snapshot-ready',()=>{renderCards();renderDetail()});
document.getElementById('researchForm').addEventListener('submit',e=>{
 e.preventDefault();const city=$('researchCity').value.trim();if(!city){$('researchCity').focus();return}
 const params=new URLSearchParams({bcCity:city.slice(0,90),bcCategory:$('researchCategory').value,bcKeyword:$('researchKeyword').value.slice(0,90)});
 // Existing search engine remains authoritative. Prefill only, do not trigger scraping automatically.
 root.location.assign('./index.html?'+params.toString()+'#radar')
});
syncHash();renderCards();renderDetail();
})(typeof window!=='undefined'?window:globalThis);
