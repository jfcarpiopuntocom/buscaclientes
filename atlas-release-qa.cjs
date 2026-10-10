const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const engines=[['Chromium',chromium],['WebKit',webkit]];
(async()=>{
 fs.mkdirSync('atlas-artifacts',{recursive:true});
 for(const [name,launcher] of engines){
 const browser=await launcher.launch({headless:true,args:name==='Chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']:[]});
 for(const mode of ['desktop','mobile']){
  const mobile=mode==='mobile';
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:980},deviceScaleFactor:1,locale:'es-ES',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForTimeout(2500);
  const state=await page.evaluate(()=>{
   const one=id=>document.querySelectorAll('#'+id).length===1;
   const form=document.querySelector('#searchButton')?.closest('.panel');
   return {layout:form?.parentElement?.classList.contains('hero-copy'),globe:one('globe'),scan:one('targetUI'),periscope:one('periscope'),radar:one('radar'),crm:one('showSaved'),export:one('exportButton'),nativeCanvas:!!document.querySelector('#globe canvas'),advanced:one('swissFilters'),overflow:document.documentElement.scrollWidth-innerWidth};
  });
  console.log('ATLAS state',name,mode,JSON.stringify(state),'errors',errors.slice(0,4));
  for(const prop of ['layout','globe','scan','periscope','radar','crm','export','advanced'])assert.equal(state[prop],true,'Missing '+prop+' on '+name+'/'+mode);
  assert(state.overflow<=8,'Horizontal overflow '+name+' '+mode+' = '+state.overflow);
  if(name==='Chromium')assert(state.nativeCanvas,'No WebGL canvas in Chromium');
  assert.equal(errors.length,0,'Script errors '+errors.join('\n'));
  const search=page.locator('#city');
  await page.locator('.scope-features>[role=button]').first().click();
  assert.equal(await search.evaluate(e=>document.activeElement===e),true,'Toolbar search shortcut lost');
  await page.locator('.scope-features>[role=button]').nth(2).click();
  assert(await page.locator('#showSaved').evaluate(e=>e.classList.contains('active')),'CRM shortcut lost');
  await page.locator('.scope-features>[role=button]').nth(1).click();
  assert(await page.locator('#showResults').evaluate(e=>e.classList.contains('active')),'Radar shortcut lost');
  const adv=page.locator('#swissFilters');
  await adv.locator('summary').click();
  assert.equal(await adv.locator('#ownership option').count(),4);
  await adv.locator('summary').click();
  const evidence=page.locator('#scopeEvidence');
  await evidence.click();
  assert(await page.locator('#scopeDetail').isVisible(),'Periscope detail does not expand');
  // Fixtures replace the outbound public data calls here, never a live network claim.
  await page.evaluate(()=>{
   window.BC_INTEL.countryContext=async()=>({facts:[{label:'Inflation',value:2.25,unit:'% annual',year:2025,sourceUrl:'https://api.worldbank.org/v2/country/US/indicator/FP.CPI.TOTL.ZG'}]});
   window.BC_INTEL.opportunitySignals=async()=>({signals:[{title:'Sample source signal',url:'https://publisher.example/a'}]});
   window.BC_INTEL.territoryContext=async()=>({status:'not_configured',ranked:[]});
   document.querySelector('#scopeEvidence').click();
   document.querySelector('#scopeEvidence').click();
   return true;
  });
  await page.waitForTimeout(150);
  // Demo is explicitly synthetic and must be non-persistent; never claim real sales leads.
  await page.evaluate(()=>sample());
  await page.waitForTimeout(250);
  const num=await page.locator('#results .lead').count();
  assert.equal(num,3,'Original 3 synthetic demo cards are missing');
  const badge=page.locator('#results .lead-class').first();
  await badge.click();
  assert.equal(await page.locator('.swiss-company-proof').count(),1,'Evidence must live in existing lead card');
  if(name==='Chromium'){
    await page.screenshot({path:'atlas-artifacts/atlas-'+mode+'.png',fullPage:true,timeout:30000});
  }
  await context.close();
 }
 await browser.close();
 }
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
