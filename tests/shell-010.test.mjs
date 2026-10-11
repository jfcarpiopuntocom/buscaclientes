import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const base=read('shell-005-editorial.css'),home=read('index.html'),dash=read('dashboard.html'),report=read('dashboard.css'),elegance=read('shell-010-elegance.css'),brand=read('shell-009-visual.css');
test('hero orange headline underline deleted at source, not concealed by rotation',()=>{
 assert.match(base,/\.hero h1 em::after\{content:none;display:none\}/);
 assert.doesNotMatch(base,/rotate\(-1\.5deg\)/);
 assert.match(elegance,/\.hero h1 em::before,\.hero h1 em::after/);
});
test('dashboard headline no longer has underlining or orange decoration',()=>{
 assert.match(report,/h1 em\{font-style:normal;text-decoration:none;color:var\(--cobalt\)\}/);
 assert.doesNotMatch(report,/text-decoration-color:var\(--orange\)/);
 assert.match(elegance,/#dashboard \.intro h1 em/);
});
test('other orange editorial rules are 0 degrees and horizontal',()=>{
 for(const t of ['.hero .swiss-search .section-title::after','#radar .section-title::after'])assert(base.includes(t));
 assert.match(elegance,/transform:none!important;rotate:0deg!important;skew:0deg!important/);
 assert.doesNotMatch(elegance,/rotate\(-[0-9]/);
});
test('app and dashboard both opt into the polish without overwriting existing chrome',()=>{
 for(const page of [home,dash])assert.match(page,/href="\.\/shell-010-elegance\.css"/);
 assert.match(home,/v1\.0 shell 010/);assert.match(dash,/v1\.0 shell 010/);
 assert.match(home,/src="\.\/brand-globe\.svg"/);assert.match(dash,/src="\.\/brand-globe\.svg"/);
 assert.match(brand,/\.wordmark::after/);
});
test('existing discovery logic, region focus, CRM, quota, and disclaimer preserved',()=>{
 for(const re of [/function persistCRM\(/,/function makeCRMCSV\(/,/window\.BC_DASHBOARD_SOURCE/,/BC_GYRO\.create/,/bc:globe-focus/,/cityTruth\.draft/,/const quotaKey=/,/worldMarker:'El mundo está lleno de clientes'/])assert.match(home,re);
 assert.match(dash,/Muestra, no censo/);assert.match(dash,/no una promesa de rendimiento/);
});
test('legible keyboard/motion/mobile, less neon, without behavioral scripts',()=>{
 assert.match(elegance,/input:focus-visible/);assert.match(elegance,/@media\(max-width:740px\)/);assert.match(elegance,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(elegance,/<script|@keyframes/);
});
