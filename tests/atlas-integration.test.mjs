import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';

const root=join(import.meta.dirname,'..');
const source=readFileSync(join(root,'intelligence.js'),'utf8');
const html=readFileSync(join(root,'index.html'),'utf8');
const atlas=readFileSync(join(root,'atlas-layout.js'),'utf8');

const init=(impl)=>{const box={URL,URLSearchParams,AbortController,setTimeout,clearTimeout,Date,console,Intl,fetch:impl};box.globalThis=box;vm.runInNewContext(source,box);return box.BC_INTEL};

test('Approved ATLAS B activated on real original home, not a second preview',()=>{
 assert.match(html,/<link rel="stylesheet" href="\.\/choice-b\.css">/);
 assert.match(html,/<script src="\.\/atlas-layout\.js" defer><\/script>/);
 assert.doesNotMatch(html,/choice-preview\.html|choice-a\.css|choice-c\.css/);
 for(const control of ['globe','targetUI','periscope','radar','city','category','keyword','ownership','leadSort','scopeDetail','showSaved','exportButton','copyCsvButton'])
  assert.match(html,new RegExp('id="'+control+'"'),'Original DOM: '+control);
 assert.match(atlas,/copy\.appendChild\(form\)/);
 assert.doesNotMatch(atlas,/innerHTML\s*=|localStorage|sessionStorage|fetch\(/);
});

test('Configured real MCP gateway is preferred and must send public country only',async()=>{
 const urls=[];
 const intel=init(async url=>{
  urls.push(String(url));
  return {ok:true,json:async()=>({
   kind:'macro',provider:'world-intel-mcp',country:'US',geographyLevel:'country',
   facts:[{indicator:'FP.CPI.TOTL.ZG',label:'Consumer inflation',value:2.4,unit:'% annual',year:2025,sourceUrl:'https://api.worldbank.org/v2/country/US/indicator/FP.CPI.TOTL.ZG'}]
  })};
 });
 const result=await intel.countryContext('US',{mcpBase:'https://mcp.test.example'});
 assert.equal(result.facts[0].value,2.4);
 assert.equal(urls.length,1);
 assert.match(urls[0],/^https:\/\/mcp\.test\.example\/api\/world-intel\?kind=macro&country=US$/);
 assert.doesNotMatch(urls[0],/email|phone|notes|contact/);
});

test('MCP outage falls back to original World Bank with honest provenance',async()=>{
 const urls=[],intel=init(async url=>{
  urls.push(String(url));
  if(String(url).startsWith('https://mcp.test.example'))throw new Error('offline');
  return {ok:true,json:async()=>[{},[{date:'2024',value:7.12}]]};
 });
 const result=await intel.countryContext('EC',{mcpBase:'https://mcp.test.example'});
 assert.equal(result.facts.length,3);
 assert(result.facts.every(f=>f.source==='World Bank Indicators API'&&f.year===2024));
 assert.equal(urls.length,4);
});

test('MCP signals remain unverified leads, not a verified company',async()=>{
 const intel=init(async()=>({ok:true,json:async()=>({kind:'signals',provider:'world-intel-mcp',query:'coffee Austin',signals:[{title:'Expansion announced',url:'https://news.example/a',claimStatus:'unverified_lead'}]})}));
 const result=await intel.opportunitySignals({sector:'coffee',area:'Austin'},{mcpBase:'https://mcp.test.example'});
 assert.equal(result.signals.length,1);
 assert.equal(result.signals[0].claimStatus,'unverified_lead');
});

test('Census adapter explicitly says unconfigured instead of inventing a city rank',async()=>{
 const intel=init(async()=>{throw new Error('must_not_call_without_url')});
 const result=await intel.territoryContext({country:'US',city:'Austin',category:'cafe'});
 assert.equal(result.status,'not_configured');
 assert.equal(result.ranked.length,0);
});
