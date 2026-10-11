import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const base=join(import.meta.dirname,'..');
const src=readFileSync(join(base,'gyro-motion.js'),'utf8');
const html=readFileSync(join(base,'index.html'),'utf8');
const css=readFileSync(join(base,'shell-005-editorial.css'),'utf8');
const script=html.split('<script>')[1]?.split('</script>')[0];
const context={window:{},console};vm.runInNewContext(src,context);
const create=context.window.BC_GYRO.create;

test('shell 005 has one approved public identity, brand, slogan and contacts language',()=>{
 assert.match(html,/<title>BuscaClientes: el mundo está lleno de clientes<\/title>/);
 assert.match(html,/v1\.0 shell 0(?:0[56789]|1[012])/); // former shell must remain valid after strictly numbered progression
 assert.doesNotMatch(html,/v1\.0 shell 004/);
 assert.doesNotMatch(html,/prospect(?:os|o|s)?\b/i);
 assert.match(html,/7 contactos revelados gratis cada semana/);
 assert.match(html,/function save\(r,isDemo\)/);
 assert.doesNotMatch(html,/BUSCA_CLIENTES_GUMROAD_LINK|\/api\/license/);
 assert.doesNotThrow(()=>new Function(script),'existing inline CRM must still parse');
});
test('gyro settles exactly and has zero residual movement after lock',()=>{
 const a=create({stiffness:66,damping:17,mass:1});
 a.values.y=.7;a.values.x=.2;a.values.z=7.3;
 a.setTarget({x:-.05,y:-2.4,z:5.55});
 let step=0,landed=null;
 for(;step<800;step++){const frame=a.tick(1/40);if(frame.settled){landed=frame.values;break}}
 assert(landed&&step<300,'globe must settle in finite time');
 assert.equal(a.locked,true);assert.equal(a.active,false);
 const freeze=JSON.stringify(a.values);
 for(let i=0;i<250;i++)assert.equal(a.tick(1/40).changed,false);
 assert.equal(JSON.stringify(a.values),freeze,'after lock no movement whatsoever');
 for(const v of Object.values(a.velocity))assert.equal(v,0);
});
test('next scan can choose a different target, even across date-line',()=>{
 const a=create();
 a.values.y=3.13;
 a.setTarget({x:.4,y:-3.13,z:5.55});
 assert(Math.abs(a.values.y-a.tick(.025).values.y)<.1,'shortest rotation around date line');
 let limit=0;while(!a.locked&&limit++<800)a.tick(.025);
 assert(a.locked);
 const oldY=a.values.y;
 a.setTarget({x:-.7,y:2.7,z:6});
 assert.equal(a.locked,false);
 for(let i=0;i<400&&!a.locked;i++)a.tick(.025);
 assert(a.locked);assert(Math.abs(a.values.y-oldY)>.2);
});
test('reduced-motion target has immediate exact fixed orientation',()=>{
 const a=create();a.setTarget({x:0.3,y:1.4,z:5.55},true);
 assert(a.locked);assert(!a.active);
 assert.deepEqual(Object.values(a.values).map(x=>Math.round(x*100)),[30,140,555]);
 assert.equal(a.tick(.025).changed,false);
 assert.match(html,/gyro\.setTarget\([^;]+reduceMotion\.matches/);
});
test('globe renders when active, but stops painting when settled',()=>{
 assert.match(html,/if\(globeHasTarget&&!globeLocked\)/);
 assert.match(html,/if\(needsPaint\)\{composer\.render\(\);if\(globeLocked\)needsPaint=false/);
 assert.match(html,/bc:globe-scan/);
 assert.match(html,/bc:globe-stabilized/);
 assert.match(html,/needsPaint=true\}\)\.observe\(wrap\)/);
 assert.match(html,/v1\.0 shell 0(?:0[56789]|1[012])/); // former shell must remain valid after strictly numbered progression
});
test('selective orange, cobalt, crimson, petrol and ice, never another panel',()=>{
 for(const hex of ['#0b1730','#2353a4','#a4233f','#168c97','#e7ecf4','#ff6900'])assert(css.toLowerCase().includes(hex));
 assert.match(css,/\.hero h1 em::after/);
 assert.match(css,/#radar \.section-title::after/);
 assert.doesNotMatch(css,/\.pink|magenta|#f69dcf|#f39fc9/i);
 assert.doesNotMatch(css,/(?:display:\s*none).*(?:#periscope|#radar|#results)/);
});
test('390px mobile keeps native globe and canvas full-width despite inherited start alignment',()=>{
 assert.match(css,/@media\(max-width:740px\)\{\.hero\{align-items:stretch!important;width:100%\}/);
 assert.match(css,/\.hero \.globe-wrap\{width:100%;flex:none;min-width:0\}/);
});
test('untouched CRM exports and user storage remain durable and escaped',()=>{
 assert.match(html,/localStorage\.setItem\('bc-crm-durable-v1'/);
 assert.match(html,/function makeCRMCSV/);
 assert.match(html,/function exportCSV/);
 assert.match(html,/function copyCRMCSV/);
 assert.match(html,/if\(\/\^\[=\+@-\]\/\.test\(v\)\)/);
});
