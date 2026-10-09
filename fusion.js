// Lightweight source merger for BuscaClientes. No external libraries.
(function(){
function key(r){return String(r.website||r.name+"|"+Math.round(Number(r.lat||0)*1000)+"|"+Math.round(Number(r.lon||0)*1000)).toLowerCase().trim()}
function score(r){return (r.email?6:0)+(r.phone?4:0)+(r.website?3:0)}
function merge(rows){const m=new Map();for(const r of rows){if(!r||!r.name)continue;const k=key(r),old=m.get(k);if(!old)m.set(k,r);else if(score(r)>score(old))m.set(k,r)}return [...m.values()].sort((a,b)=>score(b)-score(a))}
async function wikidata(lat,lon,category){
const types={bookstore:"Q2001305",restaurant:"Q11707",cafe:"Q30022",gallery:"Q1007870",supermarket:"Q180846",pharmacy:"Q385377"};
if(!types[category])return [];
const q='SELECT ?item ?itemLabel ?location ?website WHERE { ?item wdt:P31 wd:'+types[category]+'; wdt:P625 ?location. SERVICE wikibase:around { ?item wdt:P625 ?location. bd:serviceParam wikibase:center "Point('+Number(lon)+' '+Number(lat)+')"^^geo:wktLiteral; wikibase:radius "9". } OPTIONAL { ?item wdt:P856 ?website. } SERVICE wikibase:label { bd:serviceParam wikibase:language "en,es,pt". }} LIMIT 25';
const c=new AbortController(),timer=setTimeout(()=>c.abort(),8500);
try{const response=await fetch('https://query.wikidata.org/sparql?'+new URLSearchParams({query:q,format:'json'}),{signal:c.signal,headers:{Accept:'application/sparql-results+json'}});if(!response.ok)return [];const data=await response.json();return (data.results?.bindings||[]).flatMap(b=>{const coord=b.location?.value?.match(/Point\((-?[0-9.]+) (-?[0-9.]+)\)/);if(!coord)return [];return [{id:b.item.value,name:b.itemLabel?.value||'',lat:+coord[2],lon:+coord[1],address:'',phone:'',email:'',website:b.website?.value||'',source:b.item.value,category}]}).filter(x=>x.name)}catch{return []}finally{clearTimeout(timer)}
}
window.BC_FUSION={merge,wikidata};
})();