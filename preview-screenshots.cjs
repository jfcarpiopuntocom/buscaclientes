const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
(async ()=>{
 fs.mkdirSync('screenshots',{recursive:true});
 const browser = await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 for(const key of ['a','b','c']){
  const context = await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1,locale:'es-ES',reducedMotion:'no-preference'});
  const page = await context.newPage();
  let errors=[]; page.on('pageerror',e=>errors.push(String(e.message).slice(0,200)));
  await page.goto('file://'+path.resolve('ui-'+key+'.html'),{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(6500);
  const markers=await page.evaluate(()=>({globe:!!document.querySelector('#globe'),scanner:!!document.querySelector('#targetUI'),periscope:!!document.querySelector('#periscope'),radar:!!document.querySelector('#radar'),addition:!!document.querySelector('.bc-intel-ui'),canvas:!!document.querySelector('#globe canvas')}));
  if(Object.values(markers).some(x=>!x))throw Error('Original visual missing in '+key+': '+JSON.stringify(markers)+' errors '+errors.join('; '));
  await page.screenshot({path:'screenshots/buscaclientes-'+key+'-full.png',fullPage:true,timeout:30000});
  await page.locator('#bc-proposal-'+key).scrollIntoViewIfNeeded();
  await page.screenshot({path:'screenshots/buscaclientes-'+key+'-detail.png',timeout:30000});
  console.log('option',key,JSON.stringify(markers), 'errors',errors.slice(0,5));
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
