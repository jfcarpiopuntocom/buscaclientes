const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('three-final',{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const baseref='file://'+path.resolve('choice-preview.html');
 for(const choice of ['a','b','c'])for(const mobile of [false,true]){
   const viewport=mobile?{width:390,height:844}:{width:1440,height:1000};
   const ctx=await browser.newContext({viewport,deviceScaleFactor:1,locale:'es-ES',reducedMotion:'reduce'});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(baseref+'?choice='+choice,{waitUntil:'domcontentloaded',timeout:40000});
   await page.waitForTimeout(4800);
   // The user has already requested an actual live view without hiding the original 3-D globe.
   const state=await page.evaluate(()=>({
     choice:document.documentElement.dataset.designChoice,canvas:!!document.querySelector('#globe canvas'),
     scanner:!!document.querySelector('#targetUI'),periscope:!!document.querySelector('#periscope'),
     radar:!!document.querySelector('#radar'),crm:!!document.querySelector('#showSaved'),
     form:!!document.querySelector('#searchButton'),filters:!!document.querySelector('#swissFilters'),
     theme:!!document.querySelector('link[data-choice-css]'),overflow:document.documentElement.scrollWidth-innerWidth,
     globebox:document.querySelector('#globe')?.getBoundingClientRect().height,
     top:document.querySelector('.hero')?.getBoundingClientRect().top,
     searchParent:document.querySelector('.swiss-search')?.parentElement?.className,
     scopeParent:document.querySelector('#periscope')?.parentElement?.className,
     railParent:document.querySelector('.scope-features')?.parentElement?.className
   }));
   console.log('CHECK',JSON.stringify(state),'errors',JSON.stringify(errors.slice(0,4)));
   assert.equal(state.choice,choice);for(const k of ['canvas','scanner','periscope','radar','crm','form','filters','theme'])assert.equal(state[k],true,'missing '+k);
   assert(state.overflow<=8,'horizontal overflow '+state.overflow);
   assert(state.globebox>200,'globe too small');
   if(choice==='a')assert.equal(state.railParent,'hero-copy');
   if(choice==='b')assert.equal(state.searchParent,'hero-copy');
   if(choice==='c')assert.match(state.scopeParent,/hero/);
   assert.equal(errors.length,0,'JS errors '+errors.join('; '));
   const filename='three-final/'+choice+'-'+(mobile?'mobile':'desktop')+'.png';
   await page.screenshot({path:filename,fullPage:true,timeout:30000});
   // Seed existing in-app fictional demo with original sample() logic; no real contacts.
   await page.evaluate(()=>sample());
   await page.waitForTimeout(600);
   assert.equal(await page.locator('#results .lead').count(),3);
   const target='three-final/'+choice+'-'+(mobile?'mobile':'desktop')+'-prospects.png';
   await page.screenshot({path:target,fullPage:true,timeout:30000});
   await ctx.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
