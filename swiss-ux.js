/* BuscaClientes Swiss-Army UX: progressive disclosure + evidence inside existing surfaces.
   No persistent CRM writes, no new global dashboard, no outbound email.
   Driven only by existing controls and explicit user interactions. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const clean=t=>String(t??'').slice(0,250);
const esc=t=>clean(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>document.documentElement.lang||'es';
const copy={
 es:{advanced:'Filtros y orden',sources:'Ver evidencia',noEvidence:'Sin pruebas suficientes para clasificar su propiedad.',chain:'Cadena identificada',independent:'Independiente probable',unknown:'Sin determinar',macro:'Contexto económico del país',news:'Señales del sector',territory:'Comparación territorial',notConfigured:'Comparador territorial aún no configurado.',notAvailable:'Fuente no disponible; ningún dato inventado.',unverified:'Señal sin verificar',notCompany:'Una noticia no identifica por sí sola al negocio.',sector:'Las estadísticas nacionales describen el contexto, no este negocio.',source:'Fuente'},
 en:{advanced:'Filters & sorting',sources:'View evidence',noEvidence:'Not enough evidence to determine legal ownership.',chain:'Identified chain',independent:'Likely independent',unknown:'Undetermined',macro:'Country economic context',news:'Sector signals',territory:'Territory comparison',notConfigured:'Territory comparison is not configured.',notAvailable:'Source unavailable; no fabricated data.',unverified:'Unverified lead',notCompany:'A news mention alone does not identify this business.',sector:'Country statistics are context, not business-specific figures.',source:'Source'},
 pt:{advanced:'Filtros e ordem',sources:'Ver evidências',noEvidence:'Sem provas para verificar a titularidade.',chain:'Rede identificada',independent:'Independente provável',unknown:'Por determinar',macro:'Contexto económico nacional',news:'Sinais setoriais',territory:'Comparação territorial',notConfigured:'Comparação territorial ainda não configurada.',notAvailable:'Fonte indisponível; sem dados inventados.',unverified:'Sinal não verificado',notCompany:'Notícias com nomes similares não identificam empresas.',sector:'Estatísticas nacionais não representam o negócio.',source:'Fonte'}
};
const words=()=>copy[lang()]||copy.es;
function showStatus(target,msg){const entry=document.createElement('div');entry.className='scope-line swiss-context-signals';entry.textContent=msg;target.prepend(entry);return entry}
function evidenceInCards(){
 const radar=$('results');if(!radar||!window.BC_INTEL)return;
 const seen=new WeakSet();
 const attach=()=>{
  radar.querySelectorAll('article.lead').forEach(card=>{
   if(seen.has(card))return;seen.add(card);
   const badge=card.querySelector('.lead-class'),name=card.querySelector('.lead-name');
   if(!badge||!name)return;
   const keys=card.querySelectorAll('button[data-save],button[data-enrich]');
   const leads=(window.BC_INTEL_CONTEXT?.().leads||[]);
   const entity=leads.find(r=>String(r.name)===String(name.textContent))||null;
   if(!entity)return;
   const detail=window.BC_INTEL.companyEvidence(entity);
   badge.setAttribute('role','button');badge.tabIndex=0;
   badge.setAttribute('aria-label',words().sources+': '+clean(name.textContent));
   badge.setAttribute('aria-expanded','false');badge.title=words().sources+' · '+(detail.classification.reasonCodes.join(', ')||words().noEvidence);
   const toggle=()=>{
    let pane=card.querySelector('.swiss-company-proof');
    if(pane){pane.remove();badge.setAttribute('aria-expanded','false');return}
    pane=document.createElement('div');pane.className='swiss-company-proof';
    const w=words(),c=detail.classification,classification=w[c.classification]||w.unknown;
    const top=document.createElement('strong');top.textContent=classification+(c.reasonCodes.length?' · '+c.reasonCodes.join(', '):' · '+w.noEvidence);pane.append(top);
    const line=document.createElement('div');line.className='source-row';line.style.marginTop='7px';
    for(const item of detail.sourceEvidence){
     const a=document.createElement('a');a.href=item.url;a.rel='noopener noreferrer';a.target='_blank';a.textContent=w.source+': '+item.type+' ↗';a.style.marginRight='9px';line.appendChild(a);
    }
    pane.append(line);
    const note=document.createElement('small');note.textContent=w.notCompany;pane.append(note);
    card.append(pane);badge.setAttribute('aria-expanded','true');
   };
   badge.addEventListener('click',toggle);
   badge.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
  });
 };
 attach();const observer=new MutationObserver(attach);
 observer.observe(radar,{childList:true,subtree:true});
}
function advancedControls(){
 const filters=document.querySelector('.filters-extra');
 const search=$('searchButton')?.closest('.panel');if(!filters||!search)return;
 search.classList.add('swiss-search');
 if(filters.closest('.swiss-advanced'))return;
 const advanced=document.createElement('details');advanced.className='swiss-advanced';advanced.id='swissFilters';
 const summary=document.createElement('summary');summary.id='swissFilterLabel';
 summary.textContent=words().advanced;
 const note=document.createElement('span');note.className='sr-only';note.textContent='Optional existing filters';
 advanced.append(summary);filters.parentNode.insertBefore(advanced,filters);advanced.appendChild(filters);
 /* Label remains associated with native selects, keyboard fully supported. */
 const language=$('lang');
 language?.addEventListener('change',()=>{summary.textContent=words().advanced});
}
async function fetchContextIfPossible(feed){
 if(!window.BC_INTEL)return;
 const ctx=window.BC_INTEL_CONTEXT?.()||{},w=words();
 const country=String(ctx.country||'').toUpperCase();
 const city=String(ctx.city||'').split(',')[0];
 const category=String(ctx.category||'').replace(/_/g,' ');
 const macro=showStatus(feed,w.macro+' · …'),news=showStatus(feed,w.news+' · …');
 const result=await Promise.allSettled([
  window.BC_INTEL.countryContext(country),
  window.BC_INTEL.opportunitySignals({sector:category,area:city})
 ]);
 if(result[0].status==='fulfilled'){
  const facts=result[0].value.facts.filter(f=>f.status!=='unavailable');
  macro.textContent=w.macro+' · '+(facts.length?facts.map(f=>f.label+': '+new Intl.NumberFormat(lang(),{maximumFractionDigits:2}).format(f.value)+' '+f.unit+' ('+f.year+')').join(' · '):w.notAvailable)+' · '+w.sector;
  if(facts.length){const a=document.createElement('a');a.href=facts[0].sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' ↗ '+w.source;macro.append(a)}
 }else macro.textContent=w.macro+' · '+w.notAvailable;
 if(result[1].status==='fulfilled'&&result[1].value.signals.length){
  const signals=result[1].value.signals.slice(0,3);
  news.textContent=w.news+' · '+w.unverified+': ';
  for(const signal of signals){
   const a=document.createElement('a');a.href=signal.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=clean(signal.title)+' ↗';a.style.margin='0 6px';news.append(a)
  }
 }else news.textContent=w.news+' · '+w.notAvailable;
}
function periscopeDetails(){
 const detail=$('scopeDetail'),evidence=$('scopeEvidence'),periscope=$('periscope');
 if(!detail||!evidence||!periscope)return;
 detail.hidden=true;
 periscope.after(detail); // Reuse original detailed sonar, same IDs and content.
 evidence.tabIndex=0;evidence.setAttribute('role','button');evidence.setAttribute('aria-controls','scopeDetail');evidence.setAttribute('aria-expanded','false');
 evidence.title='⌄ '+words().sources;
 let lastKey='';
 const toggle=()=>{
  detail.hidden=!detail.hidden;
  evidence.setAttribute('aria-expanded',String(!detail.hidden));
  if(detail.hidden)return;
  const ctx=window.BC_INTEL_CONTEXT?.()||{};
  const key=[ctx.country,ctx.city,ctx.category].join('|');
  if(key===lastKey)return;lastKey=key;
  const feed=$('scopeLog');if(feed)fetchContextIfPossible(feed).catch(e=>showStatus(feed,words().notAvailable));
 };
 evidence.addEventListener('click',toggle);
 evidence.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
}
function init(){
 advancedControls();periscopeDetails();evidenceInCards();
 const s=$('scopeTry');if(s)s.title=lang()==='es'?'Buscar otro lugar al azar':'Search another random place';
 /* UX-only; avoid silently altering searches, saved records or quota. */
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
