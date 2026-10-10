/* Optional, NOT deployed: Census county comparator for BuscaClientes.
   Requires secret CENSUS_API_KEY and edge rate limiting before exposure.
   Never accepts person, contact, company or CRM data. No writes. */
const YEAR='2023';
const NAICS=Object.freeze({
 cafe:'72',restaurant:'72',bakery:'31',bookstore:'45',boutique:'44',
 gift_shop:'45',florist:'45',jewelry:'45',hardware:'44',furniture:'44',
 toys:'45',electronics:'44',supermarket:'44',convenience:'44',perfumery:'45',
 architect:'54',accountant:'54',lawyer:'54',consultant:'54',engineer:'54',
 real_estate:'53',insurance:'52',financial_advisor:'52',
 it_services:'54',designer:'54',photographer:'54',veterinary:'54',
 hotel:'72',fitness:'71',gallery:'71'
});
function reply(data,status=200,origin=''){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 return new Response(JSON.stringify(data),{status,headers});
}
async function getJson(url,timeout=11000){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeout);
 try{const res=await fetch(url,{signal:abort.signal,headers:{Accept:'application/json'}});
  if(!res.ok)throw Error('upstream_'+res.status);return await res.json();
 }finally{clearTimeout(timer)}
}
function tableRows(data,headers){
 if(!Array.isArray(data)||!Array.isArray(data[0]))throw Error('upstream_schema');
 const names=data[0];
 if(!headers.every(x=>names.includes(x)))throw Error('upstream_fields');
 return data.slice(1).filter(Array.isArray).map(values=>Object.fromEntries(names.map((x,i)=>[x,values[i]])));
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin')||'';
  const allowed=String(env.ALLOWED_ORIGIN||'');
  if(origin&&origin!==allowed)return reply({error:'origin_not_allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':allowed,
   'Access-Control-Allow-Methods':'GET, OPTIONS',
   'Access-Control-Allow-Headers':'Content-Type',
   'Vary':'Origin'
  }});
  if(request.method!=='GET'||url.pathname!=='/api/territories')return reply({error:'not_found'},404,origin);
  if(!env.CENSUS_API_KEY||!allowed)return reply({error:'not_configured'},503,origin);
  const lat=Number(url.searchParams.get('lat')),lon=Number(url.searchParams.get('lon'));
  const country=url.searchParams.get('country'),category=url.searchParams.get('category');
  const naics=NAICS[category];
  if(country!=='US'||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<18||lat>72||lon> -65||lon< -180||!naics)return reply({error:'unsupported_geography_or_sector'},422,origin);
  try{
   const geo='https://geocoding.geo.census.gov/geocoder/geographies/coordinates?'+new URLSearchParams({
    x:String(lon),y:String(lat),benchmark:'Public_AR_Current',vintage:'Current_Current',format:'json'
   });
   const g=await getJson(geo,9500);
   const county=g?.result?.geographies?.Counties?.[0],state=String(county?.STATE||''),countyCode=String(county?.COUNTY||'');
   if(!/^\d{2}$/.test(state)||!/^\d{3}$/.test(countyCode))return reply({error:'county_not_identified'},404,origin);
   const key=String(env.CENSUS_API_KEY);
   const cbpPublic='https://api.census.gov/data/'+YEAR+'/cbp?'+new URLSearchParams({
    get:'NAME,ESTAB',for:'county:*',in:'state:'+state,NAICS2017:naics,LFO:'001',EMPSZES:'001'
   });
   const popPublic='https://api.census.gov/data/'+YEAR+'/acs/acs5?'+new URLSearchParams({
    get:'NAME,B01003_001E',for:'county:*',in:'state:'+state
   });
   const addKey=u=>u+'&key='+encodeURIComponent(key);
   const [cbp,pop]=await Promise.all([getJson(addKey(cbpPublic)),getJson(addKey(popPublic))]);
   const establishments=tableRows(cbp,['NAME','ESTAB','state','county']);
   const populations=tableRows(pop,['NAME','B01003_001E','state','county']);
   const populationByCounty=new Map(populations.map(x=>[x.state+x.county,Number(x.B01003_001E)]));
   const territories=establishments.flatMap(x=>{
    const n=Number(x.ESTAB),p=populationByCounty.get(x.state+x.county);
    if(!Number.isFinite(n)||n<0||!Number.isFinite(p)||p<=0)return [];
    return [{name:x.NAME,state:x.state,county:x.county,level:'county',naics,year:Number(YEAR),
      establishments:n,population:p,sourceUrl:cbpPublic,populationSourceUrl:popPublic}];
   });
   return reply({status:'ok',territories,selectedCounty:state+countyCode,naics,
    caveat:'Sector is a broad two-digit NAICS group, not the exact selected business category. Aggregate paid-employer establishments, not named prospects.'},200,origin);
  }catch{return reply({error:'upstream_unavailable',territories:[]},503,origin)}
 }
};
export const TEST_EXPORTS={NAICS,tableRows};
