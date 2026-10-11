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
   const dashHeadline=await dashboard.evaluate(()=>({
    textDecoration:getComputedStyle(document.querySelector('.intro h1 em')).textDecorationLine,
    color:getComputedStyle(document.querySelector('.intro h1 em')).color
   }));
   assert.equal(dashHeadline.textDecoration,'none','Dashboard headline still underlined');
   // Shell014 CSP hotfix: selected language is reflected by an EXTERNAL script,
   // not an inline block rejected by dashboard's strict script-src self policy.
   assert.equal(await dashboard.locator('header .brand').getAttribute('aria-label'),'BuscaClientes');
   await dashboard.evaluate(()=>localStorage.setItem('bc-lang','pt'));
   await dashboard.reload({waitUntil:'load',timeout:30000});
   assert.equal(await dashboard.locator('header .brand').getAttribute('aria-label'),'EncontraClientes');
   assert.equal(await dashboard.locator('header .brand strong').textContent(),'EncontraClientes');
   await dashboard.evaluate(()=>localStorage.setItem('bc-lang','en'));
   await dashboard.reload({waitUntil:'load',timeout:30000});
   assert.equal(await dashboard.locator('header .brand strong').textContent(),'FindClients');
   await dashboard.evaluate(()=>localStorage.setItem('bc-lang','es'));
   await dashboard.reload({waitUntil:'load',timeout:30000});
   assert.equal(await dashboard.locator('header .brand strong').textContent(),'BuscaClientes');


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
   if(name==='chromium'&&!mobile){
    const many=[...fixtures,...Array.from({length:18},(_,i)=>({
      id:'near-'+i,name:'Nearby '+(i+1),category:'cafe',lat:-2.898,lon:-79.004,source:'OSM',stage:'new'
    }))];
    await dashboard.evaluate(rows=>localStorage.setItem('bc-crm-durable-v1',JSON.stringify(rows)),many);
    await dashboard.reload({waitUntil:'load',timeout:30000});
    await dashboard.waitForFunction(()=>document.querySelector('#kTotal')?.textContent==='21');
    await dashboard.locator('#geoMap [data-bc-marker].clustered').first().click();
    assert.equal(await dashboard.locator('#bcMapDetail .bc-map-contact').count(),15);
    await dashboard.locator('#bcMapDetail .bc-map-more').click();
    assert.equal(await dashboard.locator('#bcMapDetail .bc-map-contact').count(),19);
    await dashboard.evaluate(rows=>localStorage.setItem('bc-crm-durable-v1',JSON.stringify(rows)),fixtures);
    await dashboard.reload({waitUntil:'load',timeout:30000});
    await dashboard.waitForFunction(()=>document.querySelector('#kTotal')?.textContent==='3');
   }

   assert.equal(await dashboard.locator('#contactRows tr').count(),3);
   assert.equal(await dashboard.locator('.force .status').first().innerText(),'MUESTRA OBSERVADA');
   assert.deepEqual(await dashboard.locator('.force .status').allInnerTexts(),['MUESTRA OBSERVADA','NO MEDIDO','NO MEDIDO','NO MEDIDO','NO MEDIDO']);
   assert.equal(await dashboard.locator('#geoMap circle').count(),3);

   // Shell 011: pins become keyboard-accessible evidence clusters without mutating CRM.
   assert.equal(await dashboard.locator('#bcMapFilters button').count(),5);
   assert.equal(await dashboard.locator('#geoMap [data-bc-marker]').count(),3);
   assert.match(await dashboard.locator('#bcMapCount').innerText(),/3 contactos ubicados/);
   await dashboard.locator('#bcMapFilters [data-map-filter="web"]').click();
   assert.equal(await dashboard.locator('#geoMap [data-bc-marker]').count(),1);
   assert.match(await dashboard.locator('#bcMapCount').innerText(),/1 contactos ubicados/);
   await dashboard.locator('#geoMap [data-bc-marker]').first().click();
   assert.match(await dashboard.locator('#bcMapDetail').innerText(),/Cafetería Cuenca/);
   assert.match(await dashboard.locator('#bcMapDetail').innerText(),/Fuente: OSM/);
   await dashboard.locator('#bcMapFilters [data-map-filter="all"]').click();
   assert.equal(await dashboard.locator('#geoMap [data-bc-marker]').count(),3);
   await dashboard.locator('#geoMap [data-bc-marker]').first().focus();
   await dashboard.keyboard.press('Enter');
   assert.equal(await dashboard.locator('#geoMap [data-bc-marker][aria-pressed=true]').count(),1);
   // Keep the atlas overlay from the prior shell independent of map interaction.

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
   // Demo is illustrative: it must never enter business intelligence statistics.
   await app.locator('#sampleButton').click();
   const sample=await app.evaluate(()=>window.BC_DASHBOARD_SOURCE());
   assert.equal(sample.results.length,0,'Fictional demo leaked into dashboard sample');
   assert(!JSON.stringify(sample).includes('Sample Handmade Studio'));

   // 008: city selector, HUD, focus and source must share a real target.
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().name && document.querySelector('#city').value===window.BC_CITY_STATE().name,{timeout:35000});
   const first=await app.evaluate(()=>({form:document.querySelector('#city').value,state:window.BC_CITY_STATE(),category:document.querySelector('#category').value}));
   assert.equal(first.form,first.state.name,'Random city left the visible selector behind');
   assert.equal(first.category,first.state.category,'Random sector differs from selector');
   assert.equal(first.state.status,'located','Chosen randomized city must have verified coordinates');
   await app.waitForFunction(()=>document.querySelector('#cityMarker')?.textContent?.includes(document.querySelector('#city').value.toUpperCase().slice(0,20)),{timeout:12000});
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
   await app.route(/nominatim\.openstreetmap\.org\/search/,route=>route.fulfill({
    status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},
    body:JSON.stringify([{lat:'30.2672',lon:'-97.7431',display_name:'Austin, Texas, USA',address:{country_code:'us'},type:'city'}])
   }));
   // Blur/selection alone must focus Austin correctly, without pressing Explorar.
   await app.locator('#city').press('Tab');
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().status==='located'&&window.BC_CITY_STATE().name==='Austin, Texas, USA',{timeout:20000});
   assert.equal(await app.locator('#city').inputValue(),'Austin, Texas, USA');
   await app.locator('#searchButton').click();
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().status==='located'&&window.BC_CITY_STATE().name==='Austin, Texas, USA',{timeout:20000});
   const live=await app.evaluate(()=>window.BC_CITY_STATE());
   assert(Math.abs(live.lat-30.2672)<.0001&&Math.abs(live.lon+97.7431)<.0001,'Manual Austin geocode not applied');
   assert.equal(await app.locator('#city').inputValue(),live.name);
   assert.equal((await app.locator('#cityMarker').innerText()).includes('AUSTIN'),true);
   assert.equal(await app.locator('#country').inputValue(),'US');
   // Shell012: the Ecuador country target has a physical coordinate inside Ecuador.
   await app.locator('#country').selectOption('EC');
   await app.waitForFunction(()=>window.BC_CITY_STATE?.().name==='Ecuador'&&window.BC_CITY_STATE().status==='located',{timeout:9000});
   const ecuador=await app.evaluate(()=>window.BC_CITY_STATE());
   assert(ecuador.lat < -1 && ecuador.lat > -6);
   assert(ecuador.lon < -75 && ecuador.lon > -82);
   assert.match(await app.locator('#cityMarker').innerText(),/PAÍS: ECUADOR/);
   await app.locator('#city').fill('Ecuador');
   await app.locator('#searchButton').click();
   assert.match(await app.locator('#status').innerText(),/Elige una ciudad/);
   assert.equal((await app.evaluate(()=>window.BC_CITY_STATE())).name,'Ecuador');
   await app.locator('#country').selectOption('US');


   await dashboard.waitForFunction(()=>document.querySelector('#liveState')?.dataset.live==='yes',{timeout:25000});
   assert.equal(await dashboard.locator('#kSaved').innerText(),'3');
   assert.equal(await app.locator('.shell-version').innerText(),'v1.0 shell 014');
   await dashboard.locator('#refresh').click();
   await dashboard.waitForFunction(()=>document.querySelector('#liveState')?.dataset.live==='yes',{timeout:8000});
   assert.equal(errors.length,0,'Dashboard JS errors: '+errors.join('; '));
   const appData=await app.evaluate(()=>JSON.stringify(window.BC_DASHBOARD_SOURCE()));
   assert(!appData.includes('fake_executive'),'No fictitious contacts');

   if(name==='chromium'&&!mobile){
    // Shell 013: a failed enriched-contact write MUST retain CRM bytes and in-memory fields.
    const probe=await app.evaluate(()=>{
     const before=localStorage.getItem('bc-crm-durable-v1');
     const contact=window.BC_DASHBOARD_SOURCE().saved.find(x=>x.website);
     if(!contact)return {missing:true};
     const original=JSON.stringify(contact);
     const evidence=window.BC_CONTACT_EVIDENCE.normalize({
      emails:['public@cafecuenca.example'],phones:[],pages:['https://cafecuenca.example/contact']
     },contact.website,'remote');
     const write=Storage.prototype.setItem;
     try{
      Storage.prototype.setItem=function(key,value){
       if(key==='bc-crm-durable-v1')throw new DOMException('Denied','QuotaExceededError');
       return write.call(this,key,value);
      };
      return {ok:window.applyContactEvidence(contact,evidence),before,after:localStorage.getItem('bc-crm-durable-v1'),
       old:original,now:JSON.stringify(contact)};
     }finally{Storage.prototype.setItem=write}
    });
    assert(!probe.missing,'Missing saved contact fixture for evidence rollback test');
    assert.equal(probe.ok,false,'Evidence was accepted despite failed durable write');
    assert.equal(probe.before,probe.after,'Stored CRM changed on failed enrichment');
    assert.equal(probe.old,probe.now,'In-memory CRM changed on failed enrichment');
    // Dashboard link must really open "Mi cartera" rather than leaving Results active.
    const deeplink=await context.newPage();
    await deeplink.goto(origin+'/index.html?view=saved#radar',{waitUntil:'domcontentloaded',timeout:40000});
    await deeplink.waitForFunction(()=>document.querySelector('#showSaved')?.classList.contains('active'),{timeout:15000});
    assert.equal(await deeplink.locator('#showSaved').getAttribute('class').then(c=>c.includes('active')),true);
    await deeplink.close();
   }

   console.log('PASS shell006',name,mobile?'mobile':'desktop',JSON.stringify({saved:3,geolocated:3,live:true,overflow,forces:5}));
   await context.close();await browser.close();
  }
 }finally{await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
