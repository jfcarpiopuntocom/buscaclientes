// BuscaClientes contact-enrichment Worker. Public business websites only.
// Explicit per-website scans, max 3 pages, strict origin boundary, no redirects.
const HEADERS={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'https://jfcarpiopuntocom.github.io','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','cache-control':'no-store'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const allowedHost=host=>{const h=host.toLowerCase();return h.includes('.')&&!(/(^localhost$|\.localhost$|\.local$|\.internal$|\.test$|\.invalid$|\.example$|\.onion$|\.arpa$|\.lan$|\.home$|\.corp$)/.test(h))&&!/^\d+\.\d+\.\d+\.\d+$/.test(h)&&!h.includes(':')&&!h.startsWith('xn--')&&!/^(metadata|instance-data|169\.254)/.test(h)};
function siteUrl(value,origin){
 if(typeof value!=='string'||value.length>600)throw Error('invalid_url');
 const u=new URL(value,origin);
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port||(origin&&u.origin!==origin)||!allowedHost(u.hostname))throw Error('invalid_url');
 u.hash='';return u;
}
const withTimeout=async(url,ms=6000)=>{
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),ms);
 try{return await fetch(url,{redirect:'manual',signal:c.signal,headers:{'Accept':'text/html, text/plain;q=0.8','User-Agent':'BuscaClientesContactBot/1.0 (+https://jfcarpiopuntocom.github.io/buscaclientes/)'},cf:{cacheTtl:0}})}
 finally{clearTimeout(timer)}
};
async function limitedText(u){
 const response=await withTimeout(u.toString());
 if(!response.ok||response.status>=300)return null;
 const ct=response.headers.get('content-type')||'';
 if(!/text\/(html|plain)/i.test(ct))return null;
 const declared=Number(response.headers.get('content-length')||0);
 if(declared>180000)return null;
 const body=await response.text();return body.length<=180000?body:null;
}
function robotsAllows(contents,path){
 const groups=contents.split(/\r?\n/);let active=false,seenSpecific=false;const rules=[];
 for(const line0 of groups){const line=line0.split('#')[0].trim();if(!line)continue;
 const sep=line.indexOf(':');if(sep<0)continue;const k=line.slice(0,sep).toLowerCase().trim(),v=line.slice(sep+1).trim();
 if(k==='user-agent'){active=(v==='*'||/BuscaClientesContactBot/i.test(v));if(/BuscaClientesContactBot/i.test(v)){seenSpecific=true;rules.length=0;}else if(seenSpecific)active=false;}
 if(active&&(k==='allow'||k==='disallow')&&v)rules.push({k,v});
 }
 const applicable=rules.filter(r=>path.startsWith(r.v)).sort((a,b)=>b.v.length-a.v.length);return !applicable.length||applicable[0].k==='allow';
}
function decodeEntities(s){return s.replace(/&amp;/gi,'&').replace(/&#64;|&commat;/gi,'@').replace(/&#46;|&period;/gi,'.').replace(/&nbsp;/gi,' ')}
function extract(html,base){
 const cleaned=decodeEntities(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' '));
 const emails=new Set(),phones=new Set(),paths=new Set();
 const emailRx=/\b[A-Z0-9._%+-]{1,60}@[A-Z0-9.-]{2,100}\.[A-Z]{2,20}\b/gi;
 for(const m of cleaned.matchAll(emailRx)){const e=m[0].toLowerCase();if(!/(example\.|domain\.|test\.|wixpress|sentry|cloudflare|noreply|no-reply)/i.test(e)&&emails.size<12)emails.add(e)}
 for(const m of cleaned.matchAll(/href\s*=\s*["']mailto:([^"'?\s]+)/gi)){try{const e=decodeURIComponent(m[1]).toLowerCase();if(emailRx.test(e))emails.add(e)}catch{}emailRx.lastIndex=0}
 for(const m of cleaned.matchAll(/href\s*=\s*["']tel:([^"'\s]+)/gi)){const p=decodeURIComponent(m[1]).replace(/[^\d+().\s-]/g,'').trim();if(p.replace(/\D/g,'').length>=7&&phones.size<8)phones.add(p)}
 const textOnly=cleaned.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
 for(const m of textOnly.matchAll(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}/g)){
 const p=m[0].trim(),digits=p.replace(/\D/g,'');if(digits.length>=9&&digits.length<=15&&phones.size<8&&(/[+()]/.test(p)||/\s|[-.]/.test(p)))phones.add(p)
 }
 for(const m of cleaned.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi)){
 try{const u=siteUrl(m[1],base.origin);if(u.origin!==base.origin)continue;if(/\b(contact|about|impressum|kontakt|contato|contacto|acerca|sobre-nos|atendimento|reach-us)\b/i.test(u.pathname)&&u.pathname!==base.pathname)paths.add(u.pathname)}catch{}
 }
 return {emails:[...emails],phones:[...phones],paths:[...paths].slice(0,5)};
}
export default {async fetch(request,env){
 if(request.method==='OPTIONS')return new Response(null,{headers:HEADERS});
 if(request.method!=='POST'||new URL(request.url).pathname!=='/api/enrich')return reply({error:'not_found'},404);
 if(Number(request.headers.get('content-length')||0)>1200)return reply({error:'oversize'},413);
 const origin=request.headers.get('origin');if(origin&&origin!=='https://jfcarpiopuntocom.github.io')return reply({error:'origin_denied'},403);
 let body;try{body=await request.json()}catch{return reply({error:'invalid_json'},400)}
 let site;try{site=siteUrl(body.website)}catch{return reply({error:'invalid_website'},400)}
 // Explicit bounded action, never scan an entire domain. Optional KV helps cache and throttle.
 const key='enrich:'+site.origin,now=Date.now();
 if(env?.CACHE){const prior=await env.CACHE.get(key,{type:'json'});if(prior&&now-prior.at<86400000)return reply({...prior.result,cached:true})}
 try{
 let robots=null;
 try{robots=await limitedText(new URL('/robots.txt',site.origin))}catch{return reply({error:'robots_unavailable'},503)}
 if(robots===null)return reply({error:'robots_unavailable'},503);
 if(!robotsAllows(robots,site.pathname))return reply({error:'robots_disallowed'},403);
 const pages=[site];let emails=new Set(),phones=new Set(),scanned=[];
 const home=await limitedText(site);if(home===null)return reply({error:'website_unavailable'},502);
 let data=extract(home,site);data.emails.forEach(e=>emails.add(e));data.phones.forEach(p=>phones.add(p));scanned.push(site.toString());
 const common=['/contact','/contact-us','/contacto','/contato','/about','/about-us','/kontakt','/impressum'];
 const candidates=[...new Set([...data.paths,...common])].filter(p=>robotsAllows(robots,p)).slice(0,2);
 for(const path of candidates){const u=siteUrl(path,site.origin);try{const html=await limitedText(u);if(!html)continue;data=extract(html,u);data.emails.forEach(e=>emails.add(e));data.phones.forEach(p=>phones.add(p));scanned.push(u.toString())}catch{}}
 const result={website:site.origin,emails:[...emails].slice(0,12),phones:[...phones].slice(0,8),pages:scanned,source_type:'business_website',checked_at:new Date().toISOString(),verified:false};
 if(env?.CACHE)await env.CACHE.put(key,JSON.stringify({at:now,result}),{expirationTtl:86400});
 return reply(result)
 }catch{return reply({error:'enrichment_failed'},502)}
}};
