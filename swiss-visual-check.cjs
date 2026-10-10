const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const assert=require('node:assert/strict');
const url='file://'+path.resolve('index.html');
const mock=[
{id:'demo-1',name:'Sample Boutique (fictional)',address:'Demo street · Ojai, CA',lat:34.45,lon:-119.24,phone:'',email:'',website:'',source:'https://www.openstreetmap.org/'},
{id:'demo-2',name:'Sample Artisan Studio (fictional)',address:'Example avenue · Ojai, CA',lat:34.46,lon:-119.23,phone:'',email:'',website:'',source:'https://www.openstreetmap.org/'},
{id:'demo-3',name:'Sample Community Coffee (fictional)',address:'Demo square · Ojai, CA',lat:34.44,lon:-119.25,phone:'',email:'',website:'',source:'https://www.openstreetmap.org/'}
];
async function main(){
fs.mkdirSync('swiss-shots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
for(const [label,width,height] of [['desktop',1440,930],['mobile',390,844]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:'es-ES',reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(data=>{
  try{sessionStorage.setItem('bc-live-lookup-v1',JSON.stringify({city:'Ojai, California, USA',category:'cafe',rows:data,at:Date.now()}))}catch(e){}
 },mock);
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(6000);
 const state=await page.evaluate(()=>({
  globe:!!document.querySelector('#globe canvas'),
  reticle:!!document.querySelector('#targetUI'),
  periscope:!!document.querySelector('#periscope'),
  radar:!!document.querySelector('#radar'),
  advanced:!!document.querySelector('#swissFilters'),
  screenshotLoaded:!!document.querySelector('link[href="./swiss-army.css"]'),
  noIntelligencePopup:!document.querySelector('.bc-intel'),
  overflow:document.documentElement.scrollWidth-innerWidth,
  revealable:document.querySelector('#scopeDetail')?.hidden===true,
  globeHeight:document.querySelector('#globe')?.getBoundingClientRect().height
 }));
 console.log('state '+label,JSON.stringify(state),'errors',errors.slice(0,4));
 for(const k of ['globe','reticle','periscope','radar','advanced','screenshotLoaded','noIntelligencePopup','revealable'])assert.equal(state[k],true,'Missing '+k+' in '+label);
 assert(state.overflow<=8,'HORIZONTAL OVERFLOW '+label+' '+state.overflow);
 const tools=page.locator('.scope-features>div[role="button"]');
 assert.equal(await tools.count(),3,'Three existing cards become accessible command tools');
 await tools.nth(0).click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'city','Find businesses shortcuts focus original city field');
 await tools.nth(2).click();
 assert(await page.locator('#showSaved').evaluate(e=>e.classList.contains('active')),'Portfolio shortcut uses original CRM tab');
 await tools.nth(1).click();
 assert(await page.locator('#showResults').evaluate(e=>e.classList.contains('active')),'Contacts shortcut uses original Radar tab');

 const style=await page.locator('.scope-features').evaluate(e=>getComputedStyle(e).display);assert(['flex','grid'].includes(style));
 const note=await page.evaluate(()=>{const n=document.createElement('div');n.textContent='PREVISUALIZACIÓN · Los negocios de demostración son ficticios';n.style.cssText='position:fixed;z-index:999999;left:16px;bottom:15px;padding:8px 12px;border-radius:9px;background:#071a2aed;color:#d6ffc4;border:1px solid #79c897;font:700 12px system-ui';document.body.append(n);return true});
 await page.screenshot({path:'swiss-shots/01-'+label+'-overview.png',fullPage:true,timeout:30000});
 await page.evaluate(()=>sample());
 await page.waitForTimeout(550);
 if(label==='desktop'){
  assert.equal(await page.locator('#results .lead').count(),3);
  const badge=page.locator('#results .lead-class').first();
  await badge.click();assert.equal(await page.locator('.swiss-company-proof').count(),1);
  await page.screenshot({path:'swiss-shots/02-desktop-prospect-cards.png',fullPage:true,timeout:30000});
  const btn=page.locator('#scopeEvidence');await btn.click();assert.equal(await page.locator('#scopeDetail').isVisible(),true);
  await page.waitForTimeout(450);
  await page.screenshot({path:'swiss-shots/03-desktop-periscope-open.png',fullPage:true,timeout:30000});
  const details=page.locator('#swissFilters');await details.locator('summary').click();
  assert.equal(await details.getAttribute('open'),'');
  assert.equal(await details.locator('#ownership option').count(),4);
  await page.screenshot({path:'swiss-shots/04-desktop-filters-revealed.png',fullPage:true,timeout:30000});
 }else{
  assert.equal(await page.locator('#results .lead').count(),3);
  await page.screenshot({path:'swiss-shots/05-mobile-prospects.png',fullPage:true,timeout:30000});
 }
 await ctx.close();
}
await browser.close();
}
main().catch(e=>{console.error(e.stack||e);process.exit(1)});
