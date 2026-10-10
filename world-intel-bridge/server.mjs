// Optional World Intelligence MCP gateway. Designed for separate secured server deployment.
// Only two read-only MCP tools are available here; no contact records or personal data.
import http from 'node:http';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const HOST='127.0.0.1'; // MUST stay loopback; proxy owns HTTPS and public rate limiting
const PORT=Number(process.env.PORT||8789);
const ORIGIN=process.env.ALLOWED_ORIGIN||'https://jfcarpiopuntocom.github.io';
const BEARER=process.env.INTERNAL_BEARER_TOKEN||'';
if(BEARER.length<24)throw new Error('INTERNAL_BEARER_TOKEN (24+ characters) required; do not expose MCP as unauthenticated public gateway');
const PYTHON=process.env.WORLD_INTEL_PYTHON||'python';
const limits=new Map();
let client;
function respond(res,status,body,origin=false){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff',...(origin?{'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin'}:{})});
 res.end(JSON.stringify(body));
}
function clean(v,max=90){const t=String(v||'').trim();return t.length<=max&&!/[<>@]/.test(t)?t:null}
function href(v){try{let x=new URL(String(v));return x.protocol==='https:'?x.href:null}catch{return null}}
async function call(name,args){
 if(!['intel_world_bank_indicators','intel_gdelt_search'].includes(name))throw Error('not_allowlisted');
 const response=await client.callTool({name,arguments:args});
 if(response.isError)throw Error('mcp_error');
 const txt=response.content?.find(x=>x.type==='text')?.text||'';
 if(!txt||txt.length>400000)throw Error('invalid_mcp_payload');
 const data=JSON.parse(txt);
 if(data.error||data.degraded)throw Error('upstream_degraded');
 return data;
}
async function main(){
 client=new Client({name:'buscaclientes-readonly-world-intel',version:'0.1.0'});
 const transport=new StdioClientTransport({command:PYTHON,args:['-m','world_intel_mcp.server'],env:process.env});
 await client.connect(transport);
 const available=await client.listTools();
 for(const name of ['intel_world_bank_indicators','intel_gdelt_search'])
   if(!available.tools.some(x=>x.name===name))throw Error('missing_tool_'+name);
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin||'';
  if(origin&&origin!==ORIGIN){respond(res,403,{error:'origin_not_allowed'});return}
  if(req.method==='OPTIONS'){
    res.writeHead(204,{'Access-Control-Allow-Origin':ORIGIN,
      'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Authorization','Vary':'Origin'});
    res.end();return;
  }
  if(req.method!=='GET'){respond(res,405,{error:'read_only'},!!origin);return}
  const url=new URL(req.url||'/', 'http://'+HOST+':'+PORT);
  if(url.pathname==='/health'){respond(res,200,{service:'world-intel-mcp',connected:true,scope:'read-only'});return}
  if(url.pathname!=='/api/world-intel'){respond(res,404,{error:'not_found'},!!origin);return}
  if(BEARER&&req.headers.authorization!=='Bearer '+BEARER){respond(res,401,{error:'unauthorized'},!!origin);return}
  const key=req.socket.remoteAddress||'unknown';
  const now=Date.now(),hits=(limits.get(key)||[]).filter(t=>now-t<60000);
  if(hits.length>=12){respond(res,429,{error:'rate_limited'},!!origin);return}
  hits.push(now);
  if(limits.size>1000)limits.clear(); // bounded local rate limiter, edge WAF mandatory
  limits.set(key,hits);
  const kind=url.searchParams.get('kind');
  try{
   if(kind==='macro'){
    const country=clean(url.searchParams.get('country'),2)?.toUpperCase();
    if(!country||!/^[A-Z]{2}$/.test(country)){respond(res,422,{error:'invalid_country'},!!origin);return}
    const ids=['NY.GDP.MKTP.KD.ZG','FP.CPI.TOTL.ZG','SP.POP.TOTL'];
    const data=await call('intel_world_bank_indicators',{country,indicators:ids});
    const facts=ids.map((id,i)=>{
      const item=(data.indicators||[]).find(x=>x.id===id);
      const v=(item?.values||[]).find(x=>x.value!==null&&Number.isFinite(Number(x.value))&&/^\d{4}$/.test(String(x.year)));
      const source='https://api.worldbank.org/v2/country/'+country+'/indicator/'+id+'?format=json';
      return v?{indicator:id,label:['GDP growth','Consumer inflation','Population'][i],
        unit:['% annual','% annual','people'][i],value:Number(v.value),year:Number(v.year),
        level:'country',country,source:'World Bank via World Intelligence MCP',sourceUrl:source}
        :{indicator:id,status:'unavailable',country,sourceUrl:source};
    });
    respond(res,200,{kind,provider:'world-intel-mcp',country,geographyLevel:'country',facts,
      fetchedAt:data.fetched_at||null,warning:'Country statistics do not identify individual businesses.'},!!origin);return;
   }
   if(kind==='signals'){
    const sector=clean(url.searchParams.get('sector'),75),city=clean(url.searchParams.get('city'),70);
    if(!sector||!city||sector.length<3||city.length<2){respond(res,422,{error:'invalid_query'},!!origin);return}
    const query='"'+sector.replace(/["\\]/g,'')+'" "'+city.replace(/["\\]/g,'')+'"';
    const data=await call('intel_gdelt_search',{query,mode:'artlist',limit:8});
    const signals=(Array.isArray(data.articles)?data.articles:[]).flatMap(x=>{
      const u=href(x.url),title=clean(x.title,240);
      return u&&title?[{title,url:u,publishedAt:String(x.seendate||'').slice(0,20),
        source:'GDELT via World Intelligence MCP',claimStatus:'unverified_lead'}]:[];
    }).slice(0,8);
    respond(res,200,{kind,provider:'world-intel-mcp',query,signals,
      checkedAt:data.timestamp||null,note:'News is an investigation lead, not a buyer need.'},!!origin);return;
   }
   respond(res,422,{error:'unsupported_kind'},!!origin);
  }catch(e){respond(res,503,{error:'upstream_unavailable',kind},!!origin)}
 });
 server.listen(PORT,HOST,()=>process.stderr.write('Read-only world-intel MCP gateway on '+HOST+':'+PORT+'\n'));
 process.on('SIGINT',()=>{server.close();client.close().catch(()=>{});});
}
main().catch(e=>{process.stderr.write('MCP unavailable: '+e.message+'\n');process.exit(1)});
