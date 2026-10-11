import test from 'node:test';
import assert from 'node:assert/strict';
import {checkPersonal,mondayUTC,PERSONAL_LIMITS,FREE_LIMITS} from '../personal/plan-policy.mjs';
const at='2026-10-10T17:00:00Z';
const base={entitlement:'active',cycleStart:'2026-10-01T00:00:00Z',cycleEnd:'2026-11-01T00:00:00Z',historicalIds:[],additions:[]};
const cmd=(contactId='osm:node:333',now=at)=>({action:'save',contactId,now});
const add=(n,t,offset=1)=>Array.from({length:n},(_,i)=>({id:'osm:node:'+(offset+i),at:t}));
test('Free stays seven weekly; Personal has ONE straightforward 1000/cycle quota',()=>{
 assert.equal(FREE_LIMITS.weeklyAdds,7);assert.deepEqual(PERSONAL_LIMITS,{cycleAdds:1000});
 assert.equal(Object.hasOwn(PERSONAL_LIMITS,'weeklyAdds'),false);
});
test('Free UTC week boundary stays calculable',()=>{
 assert.equal(mondayUTC('2026-10-11T23:59:59Z'),'2026-10-05');
 assert.equal(mondayUTC('2026-10-12T00:00:00Z'),'2026-10-12');
 assert.throws(()=>mondayUTC('tomorrow'));
});
test('new Personal contacts require verified active subscription state and current cycle',()=>{
 assert.equal(checkPersonal({...base,entitlement:'inactive'},cmd()).reason,'subscription_required');
 assert.equal(checkPersonal({...base,cycleEnd:at},cmd()).reason,'billing_cycle_invalid_or_expired');
 assert.equal(checkPersonal({...base,cycleStart:'2026-10-11T00:00:00Z'},cmd()).reason,'billing_cycle_invalid_or_expired');
 assert.equal(checkPersonal(base,cmd()).charge,1);
});
test('already-saved contacts are free even after cancellation',()=>{
 const old={...base,entitlement:'cancelled',historicalIds:['osm:node:333']};
 assert.equal(checkPersonal(old,cmd()).charge,0);
 assert.equal(checkPersonal(old,cmd('osm:node:new')).allowed,false);
});
test('export, read and edit historical CRM always allowed, even after expiry',()=>{
 for(const action of ['read','export','edit']) {
   const result=checkPersonal({...base,entitlement:'expired'}, {action,now:at});
   assert.equal(result.allowed,true);assert.equal(result.charge,0);
 }
});
test('no weekly Personal trap: 251 or 900 saves in same week still within 1000 per cycle',()=>{
 const rows=add(900,'2026-10-09T12:00:00Z');
 const result=checkPersonal({...base,additions:rows},cmd('osm:node:9999'));
 assert.equal(result.allowed,true);assert.equal(result.total,900);
});
test('1000th allowed and 1001st denied regardless of week boundaries',()=>{
 const nineNineNine=add(999,'2026-10-09T12:00:00Z');
 assert.equal(checkPersonal({...base,additions:nineNineNine},cmd('osm:node:9999')).allowed,true);
 const thousand=add(1000,'2026-10-09T12:00:00Z');
 assert.equal(checkPersonal({...base,additions:thousand},cmd('osm:node:9999')).reason,'billing_cycle_limit');
});
test('monthly cycle resets only when PayPal-verified server cycle shifts',()=>{
 const past=add(1000,'2026-10-09T12:00:00Z');
 const next={...base,cycleStart:'2026-11-01T00:00:00Z',cycleEnd:'2026-12-01T00:00:00Z',additions:past};
 const res=checkPersonal(next,cmd('osm:node:9999','2026-11-02T12:00:00Z'));
 assert.equal(res.allowed,true);assert.equal(res.total,0);
});
test('duplicate contact ids cannot inflate cycle quota',()=>{
 const rows=add(950,at);
 const res=checkPersonal({...base,additions:[...rows,...rows]},cmd('osm:node:9000'));
 assert.equal(res.total,950);
});
test('invalid actions, ids and dates fail closed',()=>{
 for(const op of [{action:'save',now:at,contactId:'<script>'},{action:'charge',now:at},
   {action:'save',now:'invalid',contactId:'osm:node:1'}]){
   assert.equal(checkPersonal(base,op).allowed,false);
 }
});
