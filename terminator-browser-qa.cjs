const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('scan-screens',{recursive:true});
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]])for(const mode of ['desktop','mobile']){
  const browser=await launcher.launch({headless:true,args:engine==='chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']:[]});
  const page=await browser.newPage({viewport:mode==='desktop'?{width:1440,height:980}:{width:390,height:844},reducedMotion:'no-preference'});
  const errors=[],upstream=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/(overpass|nominatim|api.worldbank.org|api.gdeltproject.org)/,async route=>{
   upstream.push({time:Date.now(),url:route.request().url()});
   await route.fulfill({status:503,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:'{"error":"fixture_upstream_offline"}'});
  });
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>document.querySelector('#scopeBadge')?.textContent==='RASTREANDO',{timeout:20000});
  assert.equal(upstream.length,0,'Search fired before scan');
  assert(await page.locator('#globe.bc-hunting').count()===1,'Missing hunting stage');
  if(engine==='chromium')await page.screenshot({path:'scan-screens/'+engine+'-'+mode+'-hunting.png',timeout:18000});
  await page.waitForFunction(()=>document.querySelector('#scopeBadge')?.textContent==='FIJANDO OBJETIVO',{timeout:8000});
  assert.equal(upstream.length,0,'Search fired before zero-in');
  assert(await page.locator('#globe.bc-locking .target-ui.active').count()===1,'Missing lock stage');
  const target=await page.locator('#targetCoords').innerText();
  assert.match(target,/°.*°/,'Missing target coordinates');
  if(engine==='chromium')await page.screenshot({path:'scan-screens/'+engine+'-'+mode+'-locking.png',timeout:18000});
  await page.waitForFunction(()=>/CONSULTANDO|SIN CONEXIÓN|LISTO/.test(document.querySelector('#scopeBadge')?.textContent||''),{timeout:9000});
  await page.waitForFunction(()=>document.querySelector('#scopeBadge')?.textContent==='SIN CONEXIÓN',{timeout:15000});
  assert(upstream.length>0,'Query never started after geolock');
  assert.equal(errors.length,0,'JavaScript exceptions: '+errors.join('; '));
  const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert(horizontal<=8,'Mobile horizontal overflow '+horizontal);
  const snapshot=await page.evaluate(()=>({
   globe:!!document.querySelector('#globe canvas'),
   reticle:!!document.querySelector('#targetUI'),
   periscope:!!document.querySelector('#periscope'),
   crm:!!document.querySelector('#showSaved'),
   radar:!!document.querySelector('#radar'),
   layout:document.querySelector('#searchButton')?.closest('.panel')?.parentElement?.classList.contains('hero-copy')
  }));
  assert(Object.values(snapshot).every(Boolean),'Core elements lost: '+JSON.stringify(snapshot));
  console.log('scan PASS',engine,mode,JSON.stringify({upstreamRequests:upstream.length,horizontal,coords:target}));
  await browser.close();
 }
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
