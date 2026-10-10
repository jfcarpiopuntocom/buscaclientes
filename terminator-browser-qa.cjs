const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('scan-screens',{recursive:true});
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit']])for(const mode of ['desktop','mobile']){
  const browser=await launcher.launch({headless:true,args:engine==='chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']:[]});
  const page=await browser.newPage({viewport:mode==='desktop'?{width:1440,height:980}:{width:390,height:844},reducedMotion:'no-preference'});
  const errors=[],upstream=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__scanTrace=[];
   document.addEventListener('DOMContentLoaded',()=>{
    const badge=document.querySelector('#scopeBadge'),globe=document.querySelector('#globe');
    if(!badge||!globe)return;
    const trace=()=>window.__scanTrace.push({time:Date.now(),status:badge.textContent,globe:globe.className});
    new MutationObserver(trace).observe(badge,{childList:true,subtree:true,characterData:true});
    new MutationObserver(trace).observe(globe,{attributes:true,attributeFilter:['class']});
    trace();
   },{once:true});
  });
  await page.route(/(overpass|nominatim|api.worldbank.org|api.gdeltproject.org)/,async route=>{
   upstream.push({time:Date.now(),url:route.request().url()});
   await route.fulfill({status:503,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:'{"error":"fixture_upstream_offline"}'});
  });
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded',timeout:40000});
  try{
   await page.waitForFunction(()=>window.__scanTrace?.some(x=>x.status==='SIN CONEXIÓN'),null,{timeout:26000});
  }catch(e){
   console.error('trace diagnosis',engine,mode,JSON.stringify(await page.evaluate(()=>({
    current:document.querySelector('#scopeBadge')?.textContent,
    trace:window.__scanTrace,script:typeof window.BC_TERMINATOR_SCAN,ready:document.readyState,
    errors:document.querySelector('#scopeEvidence')?.textContent,
    globe:document.querySelector('#globe')?.className
   }))).slice(0,6000));
   throw e;
  }
  const trace=await page.evaluate(()=>window.__scanTrace);
  const hunt=trace.findIndex(x=>x.status==='RASTREANDO'&&x.globe.includes('bc-hunting'));
  const lock=trace.findIndex(x=>x.status==='FIJANDO OBJETIVO'&&x.globe.includes('bc-locking'));
  const query=trace.findIndex((x,i)=>i>lock&&x.status==='CONSULTANDO'&&!x.globe.includes('bc-locking'));
  assert(hunt>=0&&lock>hunt&&query>lock,'Wrong order scan→lock→search '+JSON.stringify(trace.slice(0,18)));
  assert(lock===-1||trace[lock].time-trace[hunt].time>=1100,'Scanning phase skipped');
  assert(trace[query].time-trace[lock].time>=2400,'Zeroing-in phase interrupted');
  assert(upstream.length>0,'Query never started after geolock');
  assert(upstream.every(x=>x.time>=trace[query].time-40),'Provider was contacted before geolock finished');
  assert.equal(errors.length,0,'Javascript exceptions: '+errors.join('; '));
  const snapshot=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-innerWidth,
   canvas:!!document.querySelector('#globe canvas'),
   reticle:!!document.querySelector('#targetUI'),
   periscope:!!document.querySelector('#periscope'),
   radar:!!document.querySelector('#radar'),
   crm:!!document.querySelector('#showSaved'),
   layout:document.querySelector('#searchButton')?.closest('.panel')?.parentElement?.classList.contains('hero-copy')
  }));
  assert(snapshot.overflow<=8,'Horizontal overflow '+snapshot.overflow);
  for(const x of ['reticle','periscope','radar','crm','layout'])assert(snapshot[x],'Original component missing '+x);
  if(engine==='chromium')assert(snapshot.canvas,'WebGL canvas missing');
  if(engine==='chromium')await page.screenshot({path:'scan-screens/'+engine+'-'+mode+'-after-zero-in.png',timeout:20000});
  console.log('PASS',engine,mode,'phases',JSON.stringify({scan:trace[hunt].status,lock:trace[lock].status,query:trace[query].status,networkRequests:upstream.length}));
  await browser.close();
 }
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
