/* Progressive-disclosure interface for BuscaClientes' optional public intelligence. */
(function(){
'use strict';
const LABELS={
 es:{title:'⌁ Contexto e indicios',hint:'Se consulta solo al abrir; no usa contactos de tu cartera.',loading:'Consultando fuentes públicas…',macro:'Contexto nacional',events:'Señales para investigar',leads:'Evidencia de negocios',territory:'Prioridad territorial',none:'No hay datos comprobables para esta consulta.',unknown:'Sin determinar',chain:'Cadena identificada',independent:'Independiente probable',status:'Datos indicativos; verifica cada fuente.',unavailable:'No disponible',error:'Fuente no disponible o acceso bloqueado; no se inventaron datos.',density:'Ranking municipal/condal pendiente de estadísticas agregadas con procedencia.',year:'año',reason:'Señales'},
 en:{title:'⌁ Context & evidence',hint:'Fetched only when opened; contacts are never sent.',loading:'Reading public sources…',macro:'Country context',events:'Signals to investigate',leads:'Business evidence',territory:'Territory priority',none:'No verified data for this query.',unknown:'Undetermined',chain:'Identified chain',independent:'Likely independent',status:'Indicative only; verify each source.',unavailable:'Unavailable',error:'Source unavailable or blocked; no data invented.',density:'County/city ranking requires sourced aggregate statistics.',year:'year',reason:'Signals'},
 pt:{title:'⌁ Contexto e evidências',hint:'Consultado apenas ao abrir; sem transmitir contactos.',loading:'A consultar fontes públicas…',macro:'Contexto nacional',events:'Sinais para investigar',leads:'Evidência de negócios',territory:'Prioridade territorial',none:'Não há dados comprováveis para esta consulta.',unknown:'Por determinar',chain:'Rede identificada',independent:'Independente provável',status:'Informação indicativa; verifique as fontes.',unavailable:'Fonte indisponível ou acesso bloqueado; não foram inventados dados.',error:'Fonte indisponível ou acesso bloqueado; sem dados inventados.',density:'Comparar municípios requer estatísticas agregadas com proveniência.',year:'ano',reason:'Sinais'}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>LABELS[document.documentElement.lang]||LABELS.es;
const fmt=(value)=>new Intl.NumberFormat(document.documentElement.lang||'es',{maximumFractionDigits:2}).format(value);
const section=(title,body)=>'<section class="bc-intel-section"><strong>'+esc(title)+'</strong>'+body+'</section>';
const sourceLink=(href,label)=>'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>';
function init(){
 const tabs=document.querySelector('.crm-tabs');
 if(!tabs||!window.BC_INTEL)return;
 const styles=document.createElement('style');
 styles.textContent='.bc-intel{margin:0 0 14px;background:#0b1827;border:1px solid #315265;border-radius:12px;padding:10px 13px;color:#dceaf0}.bc-intel summary{cursor:pointer;font-size:13px;color:#a3eadc;font-weight:700}.bc-intel-body{margin-top:12px;display:grid;gap:12px}.bc-intel-section{border-top:1px solid #263f50;padding-top:10px;font-size:12px;line-height:1.65}.bc-intel-section strong{display:block;margin-bottom:5px;font-size:13px;color:#f2fafc}.bc-intel-section p{margin:5px 0;color:#abbacb}.bc-intel-section ul{margin:6px 0;padding-left:20px}.bc-intel-section li{margin:4px 0}.bc-intel-note{font-size:11px;color:#a9b7c6}.bc-intel a{color:#75e6d5}.bc-intel-chip{font-size:11px!important}';
 document.head.appendChild(styles);
 const detail=document.createElement('details');detail.className='bc-intel';
 const summary=document.createElement('summary');summary.textContent=lang().title;
 const caption=document.createElement('p');caption.className='bc-intel-note';caption.textContent=lang().hint;
 const body=document.createElement('div');body.className='bc-intel-body';body.setAttribute('aria-live','polite');
 detail.append(summary,caption,body);tabs.after(detail);
 let busy=false,lastKey='';
 detail.addEventListener('toggle',async()=>{
  if(!detail.open||busy)return;
  const w=lang();summary.textContent=w.title;caption.textContent=w.hint;
  const ctx=window.BC_INTEL_CONTEXT?.()||{}, country=String(ctx.country||'').toUpperCase(),city=String(ctx.city||''),category=String(ctx.category||'');
  const rows=(ctx.leads||[]).filter(r=>r&&!r.demo).slice(0,7);
  const key=[country,city,category,rows.map(x=>x.id).join(',')].join('|');
  if(lastKey===key&&body.childElementCount)return;
  lastKey=key;busy=true;body.textContent=w.loading;
  const intel=window.BC_INTEL;
  const [macro,news,territory]=await Promise.allSettled([
    intel.countryContext(country),intel.opportunitySignals({sector:category.replace(/_/g,' '),area:city.split(',')[0]}),
    intel.territoryContext({city,category,country})
  ]);
  if(!detail.open){busy=false;return}
  const facts=macro.status==='fulfilled'?macro.value.facts.filter(f=>f.status!=='unavailable'):[];
  let html=section(w.macro,facts.length?'<ul>'+facts.map(f=>'<li>'+esc(f.label)+': <b>'+esc(fmt(f.value))+'</b> '+esc(f.unit)+' ('+esc(w.year)+' '+f.year+') '+sourceLink(f.sourceUrl,'World Bank')+'</li>').join('')+'</ul><p class="bc-intel-note">Country ≠ city or business.</p>':'<p>'+esc(w.error)+'</p>');
  const reports=news.status==='fulfilled'?news.value.signals:[];
  html+=section(w.events,reports.length?'<ul>'+reports.slice(0,5).map(e=>'<li>'+sourceLink(e.url,e.title)+' <span class="bc-intel-note">· '+esc(e.publishedAt||e.source)+'</span></li>').join('')+'</ul><p class="bc-intel-note">News ≠ validated sales opportunity.</p>':'<p>'+esc(w.none)+'</p>');
  const ranked=territory.status==='fulfilled'?territory.value.ranked||[]:[];
  html+=section(w.territory,ranked.length?'<ol>'+ranked.slice(0,5).map(r=>'<li>'+esc(r.name)+': '+esc(fmt(r.per10000))+' establishments per 10k people ('+esc(r.year)+') '+sourceLink(r.sourceUrl,'Census / source')+'</li>').join('')+'</ol>':'<p>'+esc(w.density)+'</p>');
  html+=section(w.leads,rows.length?'<ul>'+rows.map(r=>{const v=intel.companyEvidence(r),c=v.classification;
   const label=w[c]||w.unknown;return '<li><b>'+esc(v.name)+'</b> — '+esc(label)+(v.classification.reasonCodes?.length?' · '+esc(w.reason)+': '+esc(v.classification.reasonCodes.join(', ')):'')+' '+v.sourceEvidence.map(e=>sourceLink(e.url,e.type)).join(' · ')+'</li>'}).join('')+'</ul><p class="bc-intel-note">Brand identity and published listings do not verify legal ownership.</p>':'<p>'+esc(w.none)+'</p>');
  body.innerHTML=html+'<p class="bc-intel-note">'+esc(w.status)+'</p>';busy=false;
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();