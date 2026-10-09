const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'no-store' };
const CATS = {
  gift_shop: '["shop"="gift"]', boutique: '["shop"="clothes"]', artisan: '["craft"]', jewelry: '["shop"="jewelry"]',
  florist:'["shop"="florist"]', bookstore:'["shop"="books"]', beauty:'["shop"="beauty"]', hairdresser:'["shop"="hairdresser"]',
  bakery:'["shop"="bakery"]', cafe:'["amenity"="cafe"]', restaurant:'["amenity"="restaurant"]', marketplace:'["amenity"="marketplace"]',
  convenience:'["shop"="convenience"]', furniture:'["shop"="furniture"]', pet:'["shop"="pet"]', toys:'["shop"="toys"]',
  hardware:'["shop"="hardware"]', stationery:'["shop"="stationery"]', shoes:'["shop"="shoes"]', antiques:'["shop"="antiques"]',
  craft_store:'["shop"="craft"]', gallery:'["tourism"="gallery"]', bicycle:'["shop"="bicycle"]', sports:'["shop"="sports"]',
  electronics:'["shop"="electronics"]', mobile_phone:'["shop"="mobile_phone"]', laundry:'["shop"="laundry"]',
  pharmacy:'["amenity"="pharmacy"]', dentist:'["amenity"="dentist"]', optician:'["shop"="optician"]',
  car_repair:'["shop"="car_repair"]', garden:'["shop"="garden_centre"]', alcohol:'["shop"="alcohol"]',
  supermarket:'["shop"="supermarket"]', deli:'["shop"="deli"]', coffee:'["shop"="coffee"]', perfumery:'["shop"="perfumery"]'
};
const respond = (data, status=200) => new Response(JSON.stringify(data), {status,headers:JSON_HEADERS});
const timeoutFetch = async (url, init, ms=12500) => { const a=new AbortController(); const t=setTimeout(()=>a.abort(),ms); try{return await fetch(url,{...init,signal:a.signal})}finally{clearTimeout(t)} };
const clean = x => (x||'').trim().slice(0,90);
export default {
 async fetch(req, env){
  if(req.method==='OPTIONS') return new Response('',{headers:{...JSON_HEADERS,'access-control-allow-methods':'GET, OPTIONS'}});
  const url = new URL(req.url);
  if(url.pathname==='/api/health') return respond({ok:true,source:'OSM Overpass',demo:false});
  if(url.pathname!=='/api/search') return respond({error:'Not found'},404);
  const city=clean(url.searchParams.get('city'));
  const category=url.searchParams.get('category')||'gift_shop';
  const keyword=clean(url.searchParams.get('keyword'));
  if(!city || !CATS[category]) return respond({error:'Invalid city or category'},400);
  if(keyword && !/^[\p{L}\p{N}\s.,'&-]{1,90}$/u.test(keyword)) return respond({error:'Invalid keyword'},400);
  try {
   const geoURL='https://nominatim.openstreetmap.org/search?'+new URLSearchParams({q:city,format:'json',limit:'1',addressdetails:'1'});
   const geoResponse=await timeoutFetch(geoURL,{headers:{'user-agent':'BuscaClientes/0.1 (+https://jfcarpio.com; contact: contact@jfcarpio.com)','accept-language':'en'}},10000);
   if(!geoResponse.ok) return respond({error:'Geocoder temporarily unavailable'},503);
   const places=await geoResponse.json();
   if(!places.length) return respond({error:'City not found'},404);
   const p=places[0], lat=Number(p.lat), lon=Number(p.lon);
   const radius=10000; // 10km radius; city selected, never whole country
   const q=`[out:json][timeout:22];(nwr${CATS[category]}(around:${radius},${lat},${lon}););out center 100;`;
   const overpass=await timeoutFetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',body:new URLSearchParams({data:q}),headers:{'content-type':'application/x-www-form-urlencoded'}},25000);
   if(!overpass.ok) return respond({error:'Map data provider unavailable',status:overpass.status},503);
   const data=await overpass.json();
   let rows=(data.elements||[]).map(e=>{
    const t=e.tags||{}, c=e.center||e;
    const website=t.website||t['contact:website']||'', phone=t.phone||t['contact:phone']||'', email=t.email||t['contact:email']||'';
    return {id:`osm-${e.type}-${e.id}`,name:t.name||t.brand||'',category,lat:c.lat,lon:c.lon,address:[t['addr:housenumber'],t['addr:street'],t['addr:city']].filter(Boolean).join(' '),website,phone,email,source:`https://www.openstreetmap.org/${e.type}/${e.id}`};
   }).filter(e=>e.name && Number.isFinite(e.lat) && Number.isFinite(e.lon));
   if(keyword) {const k=keyword.toLocaleLowerCase();rows=rows.filter(r=>(r.name+' '+r.address).toLocaleLowerCase().includes(k))}
   rows=rows.slice(0,80);
   return respond({results:rows,city:{name:p.display_name,lat,lon},provider:'OpenStreetMap',attribution:'© OpenStreetMap contributors (ODbL)',disclaimer:'Email/phone only when published in source. Search radius 10km.'});
  }catch(e){return respond({error:'Search timed out or provider unavailable. Try again.', detail:undefined},503)}
 }
};
