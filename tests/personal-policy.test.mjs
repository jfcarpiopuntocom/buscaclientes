import test from 'node:test';
import assert from 'node:assert/strict';
import {checkPersonal,mondayUTC,PERSONAL_LIMITS,FREE_LIMITS} from '../personal/plan-policy.mjs';
const at='2026-10-10T17:00:00Z';
const base={entitlement:'active',cycleStart:'2026-10-01T00:00:00Z',cycleEnd:'2026-11-01T00:00:00Z',historicalIds:[],additions:[]};
const cmd=(contactId='osm:node:333',now=at)=>({action:'save',contactId,now});
const add=(n,t,offset=1)=>Array.from({length:n},(_,i)=>({id:'osm:node:'+(offset+i),at:t}));
test('Free remains seven per week; Personal is 250/week + 1000/cycle',()=>{
 assert.equal(FREE_LIMITS.weeklyAdds,7);assert.deepEqual(PERSONAL_LIMITS,{weeklyAdds:250,cycleAdds:1000});
});
test('Monday UTC resets independent of browser locale',()=>{
 assert.equal(mondayUTC('2026-10-11T23:59:59Z'),'2026-10-05');
 assert.equal(mondayUTC('2026-10-12T00:00:00Z'),'2026-10-12');
 assert.throws(()=>mondayUTC('tomorrow'));
});
test('New contact requires active paid entitlement and valid bounded cycle',()=>{
 assert.equal(checkPersonal({...base,entitlement:'inactive'},cmd()).reason,'subscription_required');
 assert.equal(checkPersonal({...base,cycleEnd:at},cmd()).reason,'billing_cycle_invalid_or_expired');
 assert.equal(checkPersonal({...base,cycleStart:'2026-10-11T00:00:00Z'},cmd()).reason,'billing_cycle_invalid_or_expired');
 assert.equal(checkPersonal(base,cmd()).charge,1);
});
test('Saving an existing contact costs nothing including after cancellation',()=>{
 const previous={...base,entitlement:'cancelled',historicalIds:['osm:node:333']};
 assert.deepEqual({allowed:checkPersonal(previous,cmd()).allowed,charge:checkPersonal(previous,cmd()).charge},{allowed:true,charge:0});
 assert.equal(checkPersonal(previous,cmd('osm:node:other')).allowed,false);
});
test('Export, read, edit never consume credit and never erase existing data',()=>{
 for(const action of ['read','export','edit']){
  const s={...base,entitlement:'expired',additions:add(1300,at)};
  assert.equal(checkPersonal(s,{action,now:at}).charge,0);
  assert.equal(checkPersonal(s,{action,now:at}).allowed,true);
 }
});
test('weekly 250th allowed, 251st refused; past weeks do not count toward this week',()=>{
 const day='2026-10-09T13:00:00Z';
 const s={...base,additions:add(249,day)};
 assert.equal(checkPersonal(s,cmd('osm:node:900')).allowed,true);
 const full={...base,additions:add(250,day)};
 assert.equal(checkPersonal(full,cmd('osm:node:900')).reason,'weekly_limit');
 const next=checkPersonal(full,cmd('osm:node:900','2026-10-12T12:00:00Z'));
 assert.equal(next.allowed,true);assert.equal(next.total,250);assert.equal(next.weekly,0);
});
test('full 1000 credits in billing cycle refuses 1001 even across five ISO weeks',()=>{
 const weekStamps=['2026-10-01T12:00:00Z','2026-10-05T12:00:00Z','2026-10-12T12:00:00Z','2026-10-19T12:00:00Z'];
 const records=weekStamps.flatMap((t,i)=>add(250,t,1+i*250));
 assert.equal(checkPersonal({...base,additions:records},cmd('osm:node:2000','2026-10-26T12:00:00Z')).reason,'billing_cycle_limit');
});
test('same id repeated in history does not inflate unique count',()=>{
 const duplicates=add(249,'2026-10-09T12:00:00Z');
 const s={...base,additions:[...duplicates,...duplicates]};
 const result=checkPersonal(s,cmd('osm:node:900'));
 assert.equal(result.allowed,true);assert.equal(result.weekly,249);
});
test('invalid commands, IDs or dates always fail closed',()=>{
 for(const op of [{action:'save',now:at,contactId:'<script>'},{action:'charge',now:at},
 {action:'save',now:'invalid',contactId:'osm:node:1'}]){
  assert.equal(checkPersonal(base,op).allowed,false);
 }
});
