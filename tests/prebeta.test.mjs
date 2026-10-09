// Run locally with: node --test tests/prebeta.test.mjs
// Static regression checks; browser/network verification is a separate test.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const html=readFileSync(join(import.meta.dirname,'..','index.html'),'utf8');
const code=html.slice(html.indexOf('function makeCRMCSV(){'),html.indexOf('function exportCSV(){'));
function csv(saved){return new Function('saved',code+'return makeCRMCSV()')(saved)}
test('CSV has BOM and excludes fictional demos',()=>{const x=csv([{name:'Business',demo:false},{name:'Fictional',demo:true}]);assert.equal(x.rows.length,1);assert.equal(x.csv.charCodeAt(0),65279);assert.doesNotMatch(x.csv,/"Fictional"/)});
test('CSV escapes spreadsheet formulas, quotes and newlines',()=>{const x=csv([{name:'=1+1',notes:'a"b\nc',demo:false}]);assert.match(x.csv,/'=1\+1/);assert.match(x.csv,/a""b c/)});
test('Empty portfolio remains empty',()=>{assert.equal(csv([]).rows.length,0)});
test('Periscope keeps approved option 3 hierarchy',()=>{const hero=html.indexOf('class="hero"'),scope=html.indexOf('id="periscope"'),cards=html.indexOf('class="scope-features"');assert(hero>=0&&hero<scope&&scope<cards)});
test('CSV clipboard fallback wired',()=>{assert.match(html,/copyCsvButton/);assert.match(html,/addEventListener\('click',copyCRMCSV\)/)});
test('Activity view has no unapproved title',()=>{assert.doesNotMatch(html,/Periscopio Vivo|Así funciona la búsqueda/)});
test('Mobile flow fits with two-column cards',()=>{assert.match(html,/\.scope-track\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)});

test('Live lookup starts on arrival',()=>{assert.match(html,/addEventListener\('load',startLiveSearch/);assert.match(html,/addEventListener\('click',runPeriscope\)/)});
test('Only genuine results are persisted for 10 minutes',()=>{assert.match(html,/sessionStorage\.setItem\('bc-live-lookup-v1'/);assert.match(html,/Array\.isArray\(cache\.rows\)/);assert.match(html,/cache\.at<600000/)});
test('Spanish selection keeps Spain flag',()=>{assert.match(html,/flagcdn\.com\/es\.svg/);assert.doesNotMatch(html,/flagcdn\.com\/ec\.svg/)});