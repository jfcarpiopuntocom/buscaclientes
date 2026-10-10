const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
 fs.mkdirSync('shell-005-evidence',{recursive:true});
 for(const [browserName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,args:browserName==='Chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']:[]});
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},reducedMotion:'no-preference',locale:'es-ES'});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.__gyroSettled=[];
    window.addEventListener('bc:globe-stabilized',e=>window.__gyroSettled.push({time:performance.now(),coords:e.detail}));
   });
   await page.route(/(overpass|nominatim|api.worldbank.org|api.gdeltproject.org)/,route=>route.fulfill({status:503,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:'{"error":"offline_fixture"}'}));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded',timeout:40000});
   await page.waitForFunction(()=>window.__gyroSettled?.length>=1,{timeout:20000});
   const before=await page.locator('#globe canvas').screenshot();
   await page.waitForTimeout(950);
   const after=await page.locator('#globe canvas').screenshot();
   assert(before.equals(after),'Canvas keeps repainting/drifting after gyro lock');
   const snap=await page.evaluate(()=>({
    shell:document.querySelector('.shell-version')?.textContent?.trim(),
    title:document.title,
    overflow:document.documentElement.scrollWidth-innerWidth,
    gyro:window.__gyroSettled[0],nativeCanvas:!!document.querySelector('#globe canvas'),
    validControls:['periscope','radar','searchButton','showSaved','showResults','exportButton','copyCsvButton','scopeTry'].every(id=>document.querySelectorAll('#'+id).length===1),
    editorial:!!document.querySelector('link[href="./shell-005-editorial.css"]'),
    formAtHero:document.querySelector('#searchButton')?.closest('.panel')?.parentElement?.classList.contains('hero-copy')
   }));
   assert.equal(snap.shell,'v1.0 shell 005');
   assert.equal(snap.title,'BuscaClientes: el mundo está lleno de clientes');
   assert(snap.nativeCanvas&&snap.validControls&&snap.editorial&&snap.formAtHero,JSON.stringify(snap));
   assert(snap.overflow<=8,'viewport overflow: '+snap.overflow);
   assert.equal(errors.length,0,errors.join(';'));
   if(browserName==='Chromium'){
    await page.screenshot({path:'shell-005-evidence/'+(mobile?'mobile':'desktop')+'.png',fullPage:true,timeout:30000});
   }
   console.log('shell 005 VERIFIED',browserName,mobile?'mobile':'desktop',JSON.stringify(snap));
   await page.close();
  }
  await browser.close();
 }
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
