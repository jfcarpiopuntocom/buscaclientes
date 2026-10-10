const {chromium,webkit}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=process.cwd();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json','.webp':'image/webp'};
const fixtures=[
 {id:'osm-100',name:'Cafetería Cuenca',category:'cafe',lat:-2.898,lon:-79.004,website:'cafecuenca.example',stage:'new',source:'OSM'},
 {id:'osm-101',name:'Tienda Central',category:'shop',lat:-2.900,lon:-79.011,phone:'+593 7 300 4000',stage:'contacted',source:'OSM'},
 {id:'osm-102',name:'Estudio Sur',category:'design',lat:-2.905,lon:-79.008,stage:'qualified',source:'OSM'}
];
(async()=>{
 const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent((request.url||'/').split('?')[0]);
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)){response.writeHead(403);return response.end('forbidden')}
  fs.readFile(file,(e,buf)=>{if(e){response.writeHead(404);return response.end('not found')}response.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});response.end(buf)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync('shell-006-evidence',{recursive:true});
 try{
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])for(const mobile of [false,true]){
   const browser=await engine.launch({headless:true,args:name==='chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']:[]});
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:920},reducedMotion:'reduce'});
   const dashboard=await context.newPage(),errors=[];
   dashboard.on('pageerror',e=>errors.push(e.message));
   await dashboard.goto(origin+'/dashboard.html',{waitUntil:'load',timeout:30000});
   await dashboard.waitForFunction(()=>document.querySelector('#kTotal')?.textContent==='0');
   assert.match(await dashboard.locator('#liveState').innerText(),/Cartera local/);
   assert.equal(await dashboard.locator('#forces .force').count(),5);
   assert.equal(await dashboard.locator('#contactRows tr').count(),1);
   await dashboard.evaluate(rows=>localStorage.setItem('bc-crm-durable-v1',JSON.stringify(rows)),fixtures);
   await dashboard.reload({waitUntil:'load',timeout:30000});
   await dashboard.waitForFunction(()=>document.querySelector('#kTotal')?.textContent==='3');
   assert.equal(await dashboard.locator('#kSaved').innerText(),'3');
   assert.equal(await dashboard.locator('#kContact').innerText(),'2');
   assert.equal(await dashboard.locator('#kGeo').innerText(),'3');
   assert.equal(await dashboard.locator('#contactRows tr').count(),3);
   assert.equal(await dashboard.locator('.force .status').first().innerText(),'MUESTRA OBSERVADA');
   assert.deepEqual(await dashboard.locator('.force .status').allInnerTexts(),['MUESTRA OBSERVADA','NO MEDIDO','NO MEDIDO','NO MEDIDO','NO MEDIDO']);
   assert.equal(await dashboard.locator('#geoMap circle').count(),3);
   // Shell 007 additive gate: fixed-frame atlas on the same verified CRM fixture.
   assert.equal(await dashboard.locator('#tlGrid .tl-cell').count(),9);
   assert.equal(await dashboard.locator('#tlEvidence .tl-evidence').count(),5);
   assert.equal((await dashboard.locator('#tlGrid .tl-cell strong').allTextContents()).map(Number).reduce((a,b)=>a+b,0),3);
   await dashboard.locator('#tlSector').selectOption('cafe');
   assert.match(await dashboard.locator('#tlCount').innerText(),/1 contactos ubicados/);
   assert.match(await dashboard.locator('#tlDetails').innerText(),/Cafetería Cuenca/);
   await dashboard.locator('#tlOverlayToggle').check();
   assert.equal(await dashboard.locator('#tlOverlay rect').count(),1);
   await dashboard.locator('#tlSector').selectOption('shop');
   assert.match(await dashboard.locator('#tlDetails').innerText(),/Tienda Central/);
   await dashboard.locator('#tlSector').selectOption('');
   assert.equal((await dashboard.locator('#tlGrid .tl-cell strong').allTextContents()).map(Number).reduce((a,b)=>a+b,0),3);

   assert((await dashboard.locator('#mapStatus').innerText()).includes('Muestra geográfica'));
   const overflow=await dashboard.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert(overflow<=8,'Dashboard horizontal overflow '+overflow);
   await dashboard.locator('#filter').fill('Tienda');
   assert.equal(await dashboard.locator('#contactRows tr').count(),1);
   await dashboard.locator('#filter').fill('');
   if(name==='chromium')await dashboard.screenshot({path:'shell-006-evidence/'+(mobile?'mobile':'desktop')+'.png',fullPage:true,timeout:30000});
   // The app must remain the authority. An open tab sends the real local CRM
   // over the same-origin BroadcastChannel; no backend/API/secret involved.
   const app=await context.newPage();
   await app.route(/(overpass|nominatim|api.worldbank.org|api.gdeltproject.org)/,route=>route.fulfill({status:503,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:'{"error":"offline_fixture"}'}));
   await app.goto(origin+'/index.html',{waitUntil:'domcontentloaded',timeout:40000});
   await app.waitForFunction(()=>typeof window.BC_DASHBOARD_SOURCE==='function'&&typeof window.BC_DASHBOARD_PUBLISH==='function',{timeout:35000});
   // 008: city selector, HUD, focus and source must share a real target.
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().name && document.querySelector('#city').value===window.BC_CITY_STATE().name,{timeout:35000});
   const first=await app.evaluate(()=>({form:document.querySelector('#city').value,state:window.BC_CITY_STATE(),category:document.querySelector('#category').value}));
   assert.equal(first.form,first.state.name,'Random city left the visible selector behind');
   assert.equal(first.category,first.state.category,'Random sector differs from selector');
   assert.equal(first.state.status,'located','Chosen randomized city must have verified coordinates');
   assert.equal((await app.locator('#cityMarker').innerText()).includes(first.form.toUpperCase().slice(0,20)),true);
   // New tab session with a trustworthy cached target cannot show Austin by default.
   await app.evaluate(()=>sessionStorage.setItem('bc-live-lookup-v1',JSON.stringify({city:'Port Townsend, Washington, USA',category:'boutique',rows:[],at:Date.now()})));
   await app.reload({waitUntil:'domcontentloaded',timeout:40000});
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().name==='Port Townsend, Washington, USA',{timeout:35000});
   assert.equal(await app.locator('#city').inputValue(),'Port Townsend, Washington, USA');
   assert.equal(await app.locator('#category').inputValue(),'boutique');
   assert.equal((await app.locator('#cityMarker').innerText()).includes('PORT TOWNSEND'),true);
   await app.locator('#city').fill('Austin, Texas, USA');
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().status==='unlocated');
   assert.match(await app.locator('#cityMarker').innerText(),/SIN UBICAR/);
   assert.match(await app.locator('#targetCoords').innerText(),/PENDIENTES/);
   // Geocoder succeeds, downstream OSM is deliberately unavailable:
   // map can focus exactly on the searched city without invented contacts.
   await app.route('**/nominatim.openstreetmap.org/search?**',route=>route.fulfill({
    status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},
    body:JSON.stringify([{lat:'30.2672',lon:'-97.7431',display_name:'Austin, Texas, USA'}])
   }));
   await app.locator('#searchButton').click();
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().status==='located'&&window.BC_CITY_STATE().name==='Austin, Texas, USA',{timeout:20000});
   const live=await app.evaluate(()=>window.BC_CITY_STATE());
   assert(Math.abs(live.lat-30.2672)<.0001&&Math.abs(live.lon+97.7431)<.0001,'Manual Austin geocode not applied');
   assert.equal(await app.locator('#city').inputValue(),live.name);
   assert.equal((await app.locator('#cityMarker').innerText()).includes('AUSTIN'),true);
   assert.equal(await app.locator('#country').inputValue(),'US');

   await dashboard.waitForFunction(()=>document.querySelector('#liveState')?.dataset.live==='yes',{timeout:25000});
   assert.equal(await dashboard.locator('#kSaved').innerText(),'3');
   assert.equal(await app.locator('.shell-version').innerText(),'v1.0 shell 008');
   await dashboard.locator('#refresh').click();
   await dashboard.waitForFunction(()=>document.querySelector('#liveState')?.dataset.live==='yes',{timeout:8000});
   assert.equal(errors.length,0,'Dashboard JS errors: '+errors.join('; '));
   const appData=await app.evaluate(()=>JSON.stringify(window.BC_DASHBOARD_SOURCE()));
   assert(!appData.includes('fake_executive'),'No fictitious contacts');
   console.log('PASS shell006',name,mobile?'mobile':'desktop',JSON.stringify({saved:3,geolocated:3,live:true,overflow,forces:5}));
   await context.close();await browser.close();
  }
 }finally{await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
