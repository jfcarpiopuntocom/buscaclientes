import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT=path.resolve(import.meta.dirname,'..');
const code=fs.readFileSync(path.join(ROOT,'terminator-scan.js'),'utf8');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'terminator-scan.css'),'utf8');
const atlasCss=fs.readFileSync(path.join(ROOT,'choice-b.css'),'utf8');
const swissCss=fs.readFileSync(path.join(ROOT,'swiss-army.css'),'utf8');
const classes=(events,id)=>({add:(...values)=>events.push([id,'add',...values]),remove:(...values)=>events.push([id,'remove',...values])});
function setup(reduce=false){
 const events=[],nodes=new Map();
 for(const id of ['globe','targetUI','targetCoords','scopeBadge','scopeHeadline','scopeCity','scopeEvidence','scopeDetailCity','stepGeo','stepQuery','cityMarker']){
  const item={classList:classes(events,id),_text:''};
  Object.defineProperty(item,'textContent',{get(){return this._text},set(value){this._text=String(value);events.push([id,'text',String(value)])}});
  nodes.set(id,item);
 }
 const window={matchMedia:()=>({matches:reduce})};
 const context={window,globalThis:window,document:{getElementById:id=>nodes.get(id)},setTimeout(fn,ms){events.push(['timer',ms]);queueMicrotask(fn)}};
 vm.runInNewContext(code,context,{timeout:1000});
 return {events,nodes,acquire:window.BC_TERMINATOR_SCAN};
}
test('Legacy inline application script must parse in entirety',()=>{
 const classic=[...html.matchAll(/<script([^>]*)>([\\s\\S]*?)<\\/script>/g)].filter(x=>x[1].trim()==='');
 assert.equal(classic.length,1,'Expected one legacy app inline script');
 assert.doesNotThrow(()=>new Function(classic[0][2]));
});
test('Preflight: no new forms, panels, or CRM mutations',()=>{
 assert.match(html,/<script src="\.\/terminator-scan\.js"><\/script>/);
 assert.match(html,/<link rel="stylesheet" href="\.\/terminator-scan\.css">/);
 assert.doesNotMatch(code,/localStorage|sessionStorage|fetch\(|\.innerHTML|querySelector.*createElement/);
 assert.match(html,/runPeriscope\(\)/);
 assert.match(html,/await window\.BC_TERMINATOR_SCAN\(choice,focusGlobeOnCity\);const data=await searchDirect/);
});
test('Terminator orders scan, true target lock, then returns to data request',async()=>{
 const {events,nodes,acquire}=setup(false);
 let called=0;
 const result=await acquire(['Cuenca, Ecuador','cafe',-2.9,-79],location=>{
  called++;
  events.push(['globe','focus',location[0],location[2],location[3]]);
 });
 assert.equal(called,1);
 assert.equal(result.target,'Cuenca, Ecuador');
 const huntIndex=events.findIndex(x=>x[0]==='globe'&&x[1]==='add'&&x[2]==='bc-hunting');
 const lockIndex=events.findIndex(x=>x[0]==='globe'&&x[1]==='add'&&x[2]==='bc-locking');
 const focusIndex=events.findIndex(x=>x[0]==='globe'&&x[1]==='focus');
 const queryIndex=events.findIndex(x=>x[0]==='scopeBadge'&&x[1]==='text'&&x[2]==='CONSULTANDO');
 assert(huntIndex>=0&&lockIndex>huntIndex&&focusIndex>lockIndex&&queryIndex>focusIndex);
 assert.deepEqual(Array.from(events.filter(x=>x[0]==='timer').map(x=>x[1])),[1450,3000]);
 assert.equal(nodes.get('scopeHeadline').textContent,'Buscando negocios en Cuenca, Ecuador…');
 assert.equal(nodes.get('stepQuery').textContent,'Consultando…');
 assert.match(nodes.get('scopeEvidence').textContent,/Objetivo fijado/);
 assert(events.some(x=>x[0]==='globe'&&x[1]==='remove'&&x.includes('bc-locking')));
});
test('Reduced-motion users see same phases in static HUD with short wait',async()=>{
 const {events,acquire}=setup(true);
 await acquire(['Quito, Ecuador','restaurant',-.18,-78.5],()=>events.push(['globe','focus']));
 assert.deepEqual(Array.from(events.filter(x=>x[0]==='timer').map(x=>x[1])),[250,350]);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/#globe\.bc-locking \.target-ui\.active/);
 assert.match(html,/hud\.classList\.add\('active'\); \/\/ Motion preference handled by CSS/);
});
test('Bad coordinates cannot trigger acquisitions',async()=>{
 const {acquire}=setup();
 await assert.rejects(acquire(['fake','cafe',NaN,10],()=>{}),/invalid_scan_target/);
 await assert.rejects(acquire(['fake','cafe',10,10]),/missing_globe_focus/);
});
test('Globe spin really centers target latitude and longitude',()=>{
 assert.match(html,/y:-\(lon\+90\)\*Math\.PI\/180/);
 assert.match(html,/x:Math\.max\(-1\.38,Math\.min\(1\.38,lat\*Math\.PI\/180\)\)/);
 for(const [lat,lon] of [[-2.9,-79],[30.26,-97.74],[40.71,-74],[51.51,-.12],[-33.9,151.2],[35.7,139.7]]){
  const toRad=Math.PI/180,phi=(90-lat)*toRad,theta=(lon+180)*toRad;
  const x=-Math.sin(phi)*Math.cos(theta),y=Math.cos(phi),z=Math.sin(phi)*Math.sin(theta);
  const ry=-(lon+90)*toRad,rx=lat*toRad;
  const xx=x*Math.cos(ry)+z*Math.sin(ry);
  const zz=-x*Math.sin(ry)+z*Math.cos(ry);
  const yy=y*Math.cos(rx)-zz*Math.sin(rx),finalz=y*Math.sin(rx)+zz*Math.cos(rx);
  assert(Math.abs(xx)<1e-8&&Math.abs(yy)<1e-8&&finalz>.999999,JSON.stringify({lat,lon,xx,yy,finalz}));
 }
});
test('No pink in final ATLAS visual styles',()=>{
 for(const [file,source] of [['choice-b.css',atlasCss],['swiss-army.css',swissCss],['terminator-scan.css',css]]){
  const regex=/#([a-f\d]{6})(?:[a-f\d]{2})?\b/gi;
  for(const match of source.matchAll(regex)){
   const rgb=[0,2,4].map(k=>parseInt(match[1].slice(k,k+2),16)/255);
   const [r,g,b]=rgb,max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;
   let h=0;if(d){if(max===r)h=((g-b)/d+6)%6*60;else if(max===g)h=((b-r)/d+2)*60;else h=((r-g)/d+4)*60}
   if(h>=300&&h<360&&max>.33&&d/max>.13)assert.fail(file+': magenta/pink '+match[0]);
  }
 }
});
