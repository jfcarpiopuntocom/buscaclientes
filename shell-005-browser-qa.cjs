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
   const geo=await page.locator('#globe canvas').evaluate(el=>{
     const r=el.getBoundingClientRect(),g=el.parentElement?.getBoundingClientRect(),style=getComputedStyle(el);
     return {x:r.x,y:r.y,width:r.width,height:r.height,parentWidth:g?.width,parentHeight:g?.height,display:style.display,visibility:style.visibility};
   });
   console.log('GLOBE GEOMETRY',browserName,mobile?'mobile':'desktop',JSON.stringify(geo));
   assert(geo.width>=150&&geo.height>=150&&geo.display!=='none'&&geo.visibility!=='hidden','Globe cannot be seen: '+JSON.stringify(geo));
   // Full-screen screenshots don't require auto-scrolling an offscreen canvas on mobile.
   // Desktop additionally verifies exact stillness on the WebGL canvas pixels.
   if(!mobile){
     const before=await page.locator('#globe canvas').screenshot();
     await page.waitForTimeout(950);
     const after=await page.locator('#globe canvas').screenshot();
     assert(before.equals(after),'Canvas keeps repainting/drifting after gyro lock');
   }
   const headline=await page.evaluate(()=>{
    const el=document.querySelector('.hero h1 em'),pseudo=getComputedStyle(el,'::after');
    const rule=getComputedStyle(document.querySelector('.hero .swiss-search .section-title'),'::after');
    return {headline:pseudo.content,display:pseudo.display,underline:getComputedStyle(el).textDecorationLine,ruleTransform:rule.transform,ruleHeight:rule.height};
   });
   assert(headline.display==='none'||headline.headline==='none','Headline orange underline still rendered: '+JSON.stringify(headline));
   assert.equal(headline.underline,'none');
   assert(headline.ruleTransform==='none'||headline.ruleTransform.startsWith('matrix(1, 0, 0, 1,'),'Editorial rule was tilted: '+JSON.stringify(headline));
   const snap=await page.evaluate(()=>({
    shell:document.querySelector('.shell-version')?.textContent?.trim(),
    title:document.title,
    overflow:document.documentElement.scrollWidth-innerWidth,
    gyro:window.__gyroSettled[0],nativeCanvas:!!document.querySelector('#globe canvas'),
    validControls:['periscope','radar','searchButton','showSaved','showResults','exportButton','copyCsvButton','scopeTry'].every(id=>document.querySelectorAll('#'+id).length===1),
    editorial:!!document.querySelector('link[href="./shell-005-editorial.css"]'),
    formAtHero:document.querySelector('#searchButton')?.closest('.panel')?.parentElement?.classList.contains('hero-copy')
   }));
   assert.match(snap.shell,/^v1\.0 shell 0(?:0[56789]|1[012345])$/,'Prior globe-stabilization regression remains valid on next shell');
   assert.equal(snap.title,'BuscaClientes: el mundo está lleno de clientes');
   assert(snap.nativeCanvas&&snap.validControls&&snap.editorial&&snap.formAtHero,JSON.stringify(snap));
   assert(snap.overflow<=8,'viewport overflow: '+snap.overflow);

   // Shell 014: exact same SVG, international wordmarks and a free, human-sized help.
   const logoSource=await page.locator('header .brand .bc-brand-symbol').getAttribute('src');
   assert.equal(logoSource,'./brand-globe.svg');
   await page.locator('#lang').selectOption('en');
   assert.equal(await page.locator('header .brand').getAttribute('aria-label'),'FindClients');
   assert.equal(await page.locator('header .brand .wordmark').textContent(),'FindClients');
   assert.match(await page.locator('.hero h1').innerText(),/clients\./);
   await page.locator('#lang').selectOption('pt');
   assert.equal(await page.locator('header .brand .wordmark').textContent(),'EncontraClientes');
   assert.match(await page.locator('#bcHelpToggle').innerText(),/Ajuda/);
   await page.locator('#bcHelpToggle').click();
   assert.equal(await page.locator('#bcFreeKit').getAttribute('href'),'./kit-libre.html');
   assert(await page.locator('#bcHelpText').isVisible());
   const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert(mobileOverflow<=8,'i18n brand/help horizontal overflow: '+mobileOverflow);
   await page.locator('#lang').selectOption('es');
   assert.equal(await page.locator('header .brand .wordmark').textContent(),'BuscaClientes');
   assert.equal(await page.locator('header .brand .bc-brand-symbol').getAttribute('src'),logoSource);
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
