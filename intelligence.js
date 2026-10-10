/* BuscaClientes global intelligence: public, user-initiated, non-persistent. */
(function(root){
'use strict';
const WB='https://api.worldbank.org/v2/country/';
const GDELT='https://api.gdeltproject.org/api/v2/doc/doc';
const KNOWN=new Set(['starbucks','mcdonalds','subway','dunkin','burger king','wendys','taco bell','kfc','dominos','pizza hut','walmart','target','walgreens','cvs pharmacy','7 eleven','dollar general','dollar tree','aldi','costco','whole foods','best buy','home depot','lowes','chipotle','panera bread','anytime fitness','planet fitness']);
const METRICS=Object.freeze([
 {id:'NY.GDP.MKTP.KD.ZG',label:'GDP growth',unit:'% annual'},
 {id:'FP.CPI.TOTL.ZG',label:'Consumer inflation',unit:'% annual'},
 {id:'SP.POP.TOTL',label:'Population',unit:'people'}
]);
const str=s=>String(s??'').trim();
const http=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:null}catch{return null}};
function classifyOwnership(record={}){
 const r=record, name=str(r.name).toLocaleLowerCase(),brand=str(r.brand).toLocaleLowerCase();
 const franchise=str(r.franchise).toLowerCase(), operator=str(r.operatorType).toLowerCase();
 const chainReasons=[],independentReasons=[];
 if(KNOWN.has(name)||KNOWN.has(brand))chainReasons.push('known_chain_name');
 if(r.isChain===true)chainReasons.push('explicit_chain');
 if(r.brandWikidata&&r.branch)chainReasons.push('brand_and_branch');
 if(r.branch&&str(r.branch).toLowerCase()!=='no')chainReasons.push('branch_tag');
 if(['yes','true','1'].includes(franchise))chainReasons.push('franchise_tag');
 if(r.isIndependent===true)independentReasons.push('explicit_independent');
 if(operator==='independent')independentReasons.push('operator_independent');
 const conflict=chainReasons.length>0&&independentReasons.length>0;
 const classification=conflict?'unknown':chainReasons.length?'chain':independentReasons.length?'independent':'unknown';
 const observations=[];
 if(r.brandWikidata)observations.push('brand:wikidata='+str(r.brandWikidata).slice(0,55));
 if(r.brand)observations.push('brand='+str(r.brand).slice(0,55));
 if(r.franchise)observations.push('franchise='+franchise.slice(0,35));
 if(r.operatorType)observations.push('operator:type='+operator.slice(0,35));
 if(r.branch)observations.push('branch='+str(r.branch).slice(0,35));
 return {classification,reasonCodes:conflict?['conflicting_evidence',...chainReasons,...independentReasons]:[...chainReasons,...independentReasons],observations,level:classification==='unknown'?'unverified':'heuristic',source:http(r.source)};
}
function companyEvidence(record={}){
 const classification=classifyOwnership(record),sources=[];
 const source=http(record.source),site=http(record.website);
 if(source)sources.push({type:'listing',url:source,label:'Original business listing',verified:false});
 if(site)sources.push({type:'website',url:site,label:'Published business website',verified:false});
 if(/^Q\d{1,12}$/.test(str(record.brandWikidata)))sources.push({type:'brand_entity',url:'https://www.wikidata.org/wiki/'+record.brandWikidata,label:'Wikidata brand entry (not ownership proof)',verified:false});
 return {name:str(record.name).slice(0,150),classification,sourceEvidence:sources,at:new Date().toISOString(),identityVerified:false,notes:'A name or brand match never proves legal ownership or corporate identity.'};
}
async function json(url,{fetchImpl,timeout=7500}={}){
 const go=fetchImpl||root.fetch?.bind(root);if(!go)throw Error('fetch_not_available');
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
 try{const res=await go(url,{signal:ctl.signal,headers:{Accept:'application/json'}});
 if(!res.ok)throw Error('http_'+res.status);return await res.json();
 }finally{clearTimeout(timer)}
}
async function countryContext(iso,opts={}){
 const country=str(iso).toUpperCase();
 if(!/^[A-Z]{2}$/.test(country))throw Error('invalid_country');
 const facts=[];
 for(const metric of METRICS){
  const url=WB+country+'/indicator/'+metric.id+'?'+new URLSearchParams({format:'json',per_page:'12'});
  try{
   const data=await json(url,opts);
   if(!Array.isArray(data)||!Array.isArray(data[1]))throw Error('bad_world_bank_response');
   const point=data[1].find(x=>x&&x.value!==null&&x.value!==undefined&&Number.isFinite(Number(x.value))&&/^\d{4}$/.test(str(x.date)));
   if(point)facts.push({indicator:metric.id,label:metric.label,value:Number(point.value),unit:metric.unit,year:Number(point.date),level:'country',country,source:'World Bank Indicators API',sourceUrl:url,stale:false});
   else facts.push({indicator:metric.id,label:metric.label,status:'unavailable',country,sourceUrl:url});
  }catch{facts.push({indicator:metric.id,label:metric.label,status:'unavailable',country,sourceUrl:url})}
 }
 return {country,geographyLevel:'country',facts,warning:'Country statistics do not rank individual cities or identify businesses.'};
}
/* Compare only geographies with matched provenance, year, NAICS and measure. */
function rankTerritories(input=[]){
 if(!Array.isArray(input))throw Error('invalid_territories');
 const rejected=[],accepted=[];let cohort=null;
 for(const t of input.slice(0,500)){
  const name=str(t.name),year=Number(t.year),code=str(t.naics),source=http(t.sourceUrl);
  const count=Number(t.establishments),population=Number(t.population),level=str(t.level),populationSource=http(t.populationSourceUrl);
  if(!name||!source||!Number.isInteger(year)||year<1990||!code||!['county','metro'].includes(level)||!Number.isFinite(count)||count<0||!Number.isFinite(population)||population<=0){
   rejected.push({name,reason:'missing_or_invalid_evidence'});continue;
  }
  const key=year+'|'+code+'|'+level;
  if(cohort!==null&&cohort!==key){rejected.push({name,reason:'incomparable_year_naics_or_level'});continue}
  cohort=key;
  accepted.push({name,year,naics:code,level,establishments:count,population,sourceUrl:source,populationSourceUrl:populationSource,per10000:Math.round(count/population*10000*100)/100});
 }
 accepted.sort((a,b)=>b.per10000-a.per10000||a.name.localeCompare(b.name));
 return {ranked:accepted,rejected,year:accepted[0]?.year||null,scope:'aggregate establishment density, not verified individual businesses'};
}
function newsQuery(term,area){
 if(/[<>@]/.test(str(term)+str(area)))throw Error('invalid_news_search');
 const a=str(term).replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').slice(0,70);
 const b=str(area).replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').slice(0,65);
 if(a.length<3||b.length<2)throw Error('invalid_news_search');
 return '"'+a+'" "'+b+'"';
}
async function opportunitySignals({sector='',area=''}={},opts={}){
 const query=newsQuery(sector,area);
 const url=GDELT+'?'+new URLSearchParams({query,mode:'artlist',format:'json',maxrecords:'8',timespan:'3months',sort:'datedesc'});
 const data=await json(url,opts),articles=Array.isArray(data?.articles)?data.articles:[];
 const seen=new Set(),signals=[];
 for(const row of articles){
  const link=http(row?.url),title=str(row?.title).slice(0,250);
  if(!link||!title||seen.has(link))continue;
  seen.add(link);
  signals.push({title,url:link,source:'GDELT DOC / '+str(row.domain).slice(0,90),publishedAt:str(row.seendate).slice(0,20)||null,claimStatus:'unverified_lead'});
 }
 return {query,signals,checkedAt:new Date().toISOString(),sourceUrl:url,note:'News is an investigation lead, not proof of company needs.'};
}
/* On-demand research only: articles matching a public business name are candidates, not entity verification. */
async function companySignals(record,opts={}){
 const name=str(record?.name).slice(0,90),area=str(opts.area).slice(0,65);
 if(name.length<3||area.length<2)throw Error('insufficient_company_context');
 const report=await opportunitySignals({sector:name,area},opts);
 return {...report,businessName:name,identityVerified:false,warning:'A news title containing this name does not prove the company identity or a buyer need.'};
}
/* Optional private server must return verified aggregate records, never contacts. */
async function territoryContext({city='',category='',country='',lat=null,lon=null}={},opts={}){
 const base=http(opts.endpoint||root.BUSCA_CLIENTES_INTEL_BASE);
 if(!base)return {status:'not_configured',ranked:[],note:'City-level business density needs a licensed/authorized aggregate provider; no invented city scores.'};
 const url=new URL('/api/territories',base);
 url.searchParams.set('city',str(city).slice(0,100));
 url.searchParams.set('category',str(category).slice(0,60));
 url.searchParams.set('country',str(country).slice(0,2));
 if(Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&lat!==null&&lon!==null){url.searchParams.set('lat',String(lat));url.searchParams.set('lon',String(lon))}
 const data=await json(url.toString(),opts);
 const result=rankTerritories(data?.territories||[]);
 return {status:result.ranked.length?'available':'unavailable',...result};
}
root.BC_INTEL=Object.freeze({countryContext,opportunitySignals,companySignals,rankTerritories,territoryContext,classifyOwnership,companyEvidence});
})(typeof window!=='undefined'?window:globalThis);
