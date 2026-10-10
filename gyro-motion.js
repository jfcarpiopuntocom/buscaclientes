/* Shell 005: gyro-like spring settles precisely, then becomes motionless.
   Physics inspired by Motion spring stiffness/damping/mass; zero runtime dependencies.
   Not a looping easing animation: it reaches a finite rest state.
   No DOM/network/CRM access; suitable for deterministic unit tests. */
(function(root){
'use strict';
const TWO_PI=2*Math.PI;
const nearest=(current,target)=>current+Math.atan2(Math.sin(target-current),Math.cos(target-current));
function create({stiffness=72,damping=18,restDelta=.0012,restSpeed=.002,mass=1}={}){
 const values={x:0,y:0,z:7.3};
 const velocity={x:0,y:0,z:0};
 let goal=null,locked=false,steps=0;
 function setTarget(raw,immediate=false){
  if(!raw||!Object.values(raw).every(Number.isFinite))throw Error('invalid_gyro_target');
  goal={x:raw.x,y:nearest(values.y,raw.y),z:raw.z};
  locked=false;steps=0;
  if(immediate){Object.assign(values,goal);Object.assign(velocity,{x:0,y:0,z:0});locked=true;goal=null}
 }
 function tick(seconds){
  if(!goal||locked)return {values:{...values},settled:locked,changed:false};
  // Guard tab suspension and frame jitter; no overshoot from gigantic deltas.
  const dt=Math.min(.045,Math.max(.004,Number(seconds)||.016));
  for(const key of ['x','y','z']){
   const acceleration=((goal[key]-values[key])*stiffness-damping*velocity[key])/mass;
   velocity[key]+=acceleration*dt;
   values[key]+=velocity[key]*dt;
  }
  steps++;
  const atRest=['x','y','z'].every(k=>Math.abs(values[k]-goal[k])<restDelta&&Math.abs(velocity[k])<restSpeed);
  if(atRest||steps>900){
   Object.assign(values,goal);Object.assign(velocity,{x:0,y:0,z:0});
   goal=null;locked=true;
  }
  return {values:{...values},settled:locked,changed:true};
 }
 return {setTarget,tick,values,velocity,get locked(){return locked},get active(){return !!goal}};
}
root.BC_GYRO=Object.freeze({create,nearest,TWO_PI});
})(typeof window!=='undefined'?window:globalThis);
