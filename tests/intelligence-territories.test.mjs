import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../intelligence-territories-worker.js';

const base='https://intel.example/api/territories?country=US&category=cafe&lat=30.26&lon=-97.74';
const origin='https://jfcarpiopuntocom.github.io';
const env={ALLOWED_ORIGIN:origin,CENSUS_API_KEY:'TOP_SECRET_ONLY_SERVER'};
const request=(url=base,from=origin,method='GET')=>new Request(url,{method,headers:{Origin:from}});
test('Census key is required and never reflected',async()=>{
 const res=await worker.fetch(request(),{ALLOWED_ORIGIN:origin});
 assert.equal(res.status,503);
 assert.doesNotMatch(await res.text(),/TOP_SECRET/);
});
test('CORS blocks unwanted callers and does not advertise wildcard',async()=>{
 const res=await worker.fetch(request(base,'https://bad.example'),env);
 assert.equal(res.status,403);
 assert.equal(res.headers.get('access-control-allow-origin'),null);
});
test('Reject unsupported locations, categories and methods before upstream work',async()=>{
 const a=await worker.fetch(request(base.replace('category=cafe','category=unknown')),env);
 assert.equal(a.status,422);
 const b=await worker.fetch(request(base.replace('country=US','country=EC')),env);
 assert.equal(b.status,422);
 const c=await worker.fetch(request(base,origin,'POST'),env);
 assert.equal(c.status,404);
});
test('Successful county responses include both sources, not the secret or CRM data',async()=>{
 const saved=globalThis.fetch;
 let count=0;
 globalThis.fetch=async url=>{
  count++;
  const u=String(url);
  if(u.includes('geocoder/geographies'))return new Response(JSON.stringify({result:{geographies:{Counties:[{STATE:'48',COUNTY:'453'}]}}}),{status:200});
  if(u.includes('/cbp?'))return new Response(JSON.stringify([
   ['NAME','ESTAB','state','county'],['Travis County, Texas','400','48','453'],['Bastrop County, Texas','80','48','021']
  ]),{status:200});
  if(u.includes('/acs/acs5?'))return new Response(JSON.stringify([
   ['NAME','B01003_001E','state','county'],['Travis County, Texas','1000000','48','453'],['Bastrop County, Texas','100000','48','021']
  ]),{status:200});
  throw Error('Unexpected upstream '+u);
 };
 try{
  const response=await worker.fetch(request(),env),body=await response.text(),json=JSON.parse(body);
  assert.equal(response.status,200);
  assert.equal(count,3);
  assert.equal(json.selectedCounty,'48453');
  assert.equal(json.naics,'72');
  assert.equal(json.territories.length,2);
  assert(json.territories.every(x=>x.populationSourceUrl.includes('acs/acs5')));
  assert(json.territories.every(x=>x.sourceUrl.includes('cbp')));
  assert.doesNotMatch(body,/TOP_SECRET_ONLY_SERVER|&key=/);
  assert.match(json.caveat,/broad two-digit NAICS/);
 }finally{globalThis.fetch=saved}
});
