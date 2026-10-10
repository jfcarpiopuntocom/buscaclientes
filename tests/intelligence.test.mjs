import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';

const base=join(import.meta.dirname,'..');
const source=readFileSync(join(base,'intelligence.js'),'utf8');
const ui=readFileSync(join(base,'intelligence-ui.js'),'utf8');
const html=readFileSync(join(base,'index.html'),'utf8');
function intel(fetchImpl=async()=>({ok:false,status:503})){
 const box={fetch:fetchImpl,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,Date,console,Intl};
 box.globalThis=box;
 vm.runInNewContext(source,box,{timeout:500});
 return box.BC_INTEL;
}
const rec=(x={})=>({name:'Little shop',source:'https://www.openstreetmap.org/node/123',...x});
test('No brand alone establishes legal control',()=>{
 const x=intel();
 assert.equal(x.classifyOwnership(rec({brand:'Corporate logo',brandWikidata:'Q12'})).classification,'unknown');
 assert.equal(x.classifyOwnership(rec({franchise:'no'})).classification,'unknown');
 assert.equal(x.classifyOwnership(rec({operatorType:'private'})).classification,'unknown');
});
test('Explicit chain signals and independent signal remain separate',()=>{
 const x=intel();
 assert.equal(x.classifyOwnership(rec({brand:'Starbucks'})).classification,'chain');
 assert.equal(x.classifyOwnership(rec({franchise:'yes'})).classification,'chain');
 assert.equal(x.classifyOwnership(rec({operatorType:'independent'})).classification,'independent');
 assert.equal(x.classifyOwnership(rec({isIndependent:true,branch:'Main Street'})).classification,'unknown');
 assert(x.classifyOwnership(rec({isIndependent:true,branch:'Main Street'})).reasonCodes.includes('conflicting_evidence'));
});
test('Company evidence never pretends identity proof and never mutates CRM',()=>{
 const x=intel(),r=rec({website:'https://shop.example',brandWikidata:'Q42',email:'private@example.com'});
 const before=JSON.stringify(r),d=x.companyEvidence(r);
 assert.equal(JSON.stringify(r),before);
 assert.equal(d.identityVerified,false);
 assert.equal(d.sourceEvidence.length,3);
 assert(d.sourceEvidence.every(e=>e.verified===false));
 assert(!JSON.stringify(d).includes('private@example.com'));
});
test('Only comparable county aggregates are ranked',()=>{
 const x=intel(),link='https://api.census.gov/data/2023/cbp';
 const rows=[
 {name:'A County',year:2023,naics:'72',level:'county',sourceUrl:link,establishments:20,population:1000},
 {name:'B County',year:2023,naics:'72',level:'county',sourceUrl:link,establishments:10,population:2000},
 {name:'Older',year:2022,naics:'72',level:'county',sourceUrl:link,establishments:500,population:1},
 {name:'No source',year:2023,naics:'72',level:'county',establishments:5,population:100}
 ];
 const result=x.rankTerritories(rows);
 assert.deepEqual(Array.from(result.ranked,r=>r.name),['A County','B County']);
 assert.equal(result.rejected.length,2);
 assert.equal(result.ranked[0].per10000,200);
});
test('No invented city density without server configuration',async()=>{
 let called=0;const x=intel(async()=>{called++;throw Error('should not fetch')});
 const d=await x.territoryContext({city:'Austin',country:'US'});
 assert.equal(d.status,'not_configured');assert.equal(called,0);
});
test('World Bank observation includes source, year, country scope',async()=>{
 const seen=[],x=intel(async u=>{
 seen.push(String(u));
 return {ok:true,json:async()=>[{},[{date:'2025',value:4.5},{date:'2024',value:2}]]}
 });
 const d=await x.countryContext('EC');
 assert.equal(d.geographyLevel,'country');
 assert.equal(d.facts.length,3);
 assert(d.facts.every(f=>f.value===4.5&&f.year===2025&&f.country==='EC'&&f.sourceUrl.startsWith('https://api.worldbank.org/')));
 assert.equal(seen.length,3);
});
test('Unreachable World Bank degrades honestly',async()=>{
 const x=intel(async()=>{throw Error('offline')});
 const d=await x.countryContext('US');
 assert.equal(d.facts.length,3);
 assert(d.facts.every(f=>f.status==='unavailable'));
 await assert.rejects(x.countryContext('%%%'),/invalid_country/);
});
test('GDELT news is source-linked, deduplicated, and only a lead',async()=>{
 let url='',x=intel(async u=>{url=String(u);return {ok:true,json:async()=>({articles:[
 {title:'Store opens',url:'https://publisher.example/a',domain:'publisher.example',seendate:'20261001T080000Z'},
 {title:'Duplicate',url:'https://publisher.example/a'},
 {title:'Injected',url:'javascript:alert(1)'},
 {title:'No source',url:''}
 ]})}});
 const r=await x.opportunitySignals({sector:'bookstore',area:'Austin'});
 assert.match(url,/api.gdeltproject.org/);
 assert.equal(r.signals.length,1);
 assert.equal(r.signals[0].claimStatus,'unverified_lead');
 assert.equal(r.signals[0].url,'https://publisher.example/a');
});
test('Untrusted query is bounded and never transmits contact data',async()=>{
 let url='';const x=intel(async u=>{url=String(u);return {ok:true,json:async()=>({articles:[]})}});
 await x.opportunitySignals({sector:'bakery',area:'Austin@example.org<script>alert()</script>'});
 assert.doesNotMatch(url,/@example\.org|script|<|>/);
});
test('Opt-in UI never automatically fetches intelligence on load',()=>{
 assert.match(ui,/addEventListener\('toggle'/);
 assert.match(ui,/if\(!detail\.open\|\|busy\)return/);
 assert.match(ui,/\.textContent=w\.loading/);
 assert.match(ui,/noopener noreferrer/);
 assert.match(html,/<script src="\.\/intelligence\.js"><\/script>/);
 assert.match(html,/window\.BC_INTEL_CONTEXT=\(\)=>/);
 assert.match(html,/bc-crm-durable-v1/);
 assert.match(html,/if\(window\.BC_INTEL\)return window\.BC_INTEL\.classifyOwnership/);
});
test('Read-only client does not persist or post contacts',()=>{
 assert.doesNotMatch(source,/localStorage|sessionStorage|XMLHttpRequest|method:\s*['"]POST|\.push\(r\)/);
 assert.doesNotMatch(ui,/localStorage\.setItem|sessionStorage\.setItem|method:\s*['"]POST/);
});