/* Browser acceptance — Shell017 CRM-first. No PayPal calls, no real customer data.
 * Run: npm install --no-save playwright@1.56.1 && npx playwright install chromium webkit
 * then node shell-017-browser-qa.cjs
 */
const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http');
const assert=require('node:assert/strict');
const root=__dirname,output=path.join(root,'shell-017-evidence');
fs.mkdirSync(output,{recursive:true});
const types={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch{res.writeHead(400).end();return}
 const rel=decodeURIComponent(u.pathname==='/'
  ?'/index.html':u.pathname);
 const file=path.resolve(root,'.'+rel);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end('Not found');return;
 }
 res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res)
});
const fixture=[
 {id:'osm-node-101',name:'Café Prisma',category:'cafe',address:'Cuenca Centro',phone:'+593991234567',email:'hola@prisma.example',website:'https://prisma.example',source:'https://www.openstreetmap.org/node/101',stage:'new',notes:'Primera reunión',created:'2026-10-10T10:00:00Z',lat:-2.90,lon:-79.0},
 {id:'osm-node-102',name:'Taller Aurora',category:'artisan',address:'Cuenca Norte',stage:'contacted',notes:'Interés en catálogo',created:'2026-10-09T10:00:00Z',lat:-2.88,lon:-79.01},
 {id:'osm-node-103',name:'Librería Brújula',category:'bookstore',address:'Cuenca Sur',stage:'followup',notes:'Volver a contactar',created:'2026-10-08T10:00:00Z',followUpAt:'2026-01-01',lat:-2.92,lon:-79.03}
];
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port;
 try{
  for(const [type,browserType,viewport] of [
   ['chromium',chromium,{width:1440,height:900}],
   ['webkit',webkit,{width:390,height:844}]
  ]){
   const browser=await browserType.launch({headless:true});
   const context=await browser.newContext({viewport,deviceScaleFactor:1});
   await context.addInitScript(({records})=>{
    if(!localStorage.getItem('bc-crm-durable-v1'))localStorage.setItem('bc-crm-durable-v1',JSON.stringify(records));
    localStorage.setItem('bc-lang','es')
   },{records:fixture});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push('pageerror: '+e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
   const response=await page.goto(url+'/dashboard.html',{waitUntil:'networkidle',timeout:30000});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>document.getElementById('crmTotalHero')?.textContent==='3',null,{timeout:8000});
   assert.equal(await page.locator('#tabCRM').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#workspaceCRM').isVisible(),true);
   assert.equal(await page.locator('#workspaceIntel').isVisible(),false);
   assert.equal(await page.locator('#crmCards .crm-contact-card').count(),3);
   await page.getByRole('button',{name:/Café Prisma/}).click();
   await page.locator('#crmDetail').getByRole('heading',{name:'Café Prisma'}).waitFor();
   await page.locator('input[name=nextAction]').fill('Escribir sobre exposición de productos');
   await page.locator('input[name=followUpAt]').fill('2026-10-15');
   await page.locator('textarea[name=notes]').fill('Primera reunión. Interés en alianza local.');
   await page.locator('select[name=stage]').selectOption('qualified');
   await page.locator('#crmEditForm button[type=submit]').click();
   await page.getByText('Cambios guardados en este navegador').waitFor();
   const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('bc-crm-durable-v1')));
   assert.equal(rows.length,fixture.length,'lost contact on update');
   assert.equal(rows[0].notes,'Primera reunión. Interés en alianza local.');
   assert.equal(rows[0].nextAction,'Escribir sobre exposición de productos');
   assert.equal(rows[0].followUpAt,'2026-10-15');
   assert.equal(rows[0].stage,'qualified');
   assert.equal(rows[1].notes,fixture[1].notes,'unrelated contact overwritten');
   assert.equal(await page.locator('#workspaceCRM #contacts').count(),1);
   await page.screenshot({path:path.join(output,type+'-crm-first.png'),fullPage:true});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert(overflow<6,'horizontal overflow '+type+' +'+overflow+' px');
   await page.locator('#tabIntel').click();
   assert.equal(await page.locator('#workspaceIntel').isVisible(),true);
   assert.equal(await page.locator('#workspaceCRM').isVisible(),false);
   for(const id of ['resumen','mapa','territorio','porter','geoMap','forces','researchForm'])
    assert.equal(await page.locator('#workspaceIntel #'+id).count(),1,'lost research module '+id);
   await page.locator('#researchCity').fill('Cuenca');
   await page.locator('#researchCategory').selectOption('cafe');
   await page.locator('#researchKeyword').fill('artesanal');
   await page.screenshot({path:path.join(output,type+'-intelligence.png'),fullPage:true});
   await page.locator('#researchForm button[type=submit]').click();
   await page.waitForURL(/bcCity=Cuenca/, {timeout:30000});
   assert.equal(await page.locator('#city').inputValue(),'Cuenca','city not prefilled in existing search');
   assert.equal(await page.locator('#keyword').inputValue(),'artesanal','keyword not prefilled');
   assert.equal(await page.locator('#category').inputValue(),'cafe','sector not prefilled');
   assert.deepEqual(errors,[],'browser errors in '+type+': '+JSON.stringify(errors));
   await browser.close();
   console.log('PASS '+type+' CRM, editing, 2 tabs, map + advanced search prefill and no overflow');
  }
 }finally{server.closeAllConnections?.();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});
