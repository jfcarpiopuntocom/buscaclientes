/* Best-effort rollback of all touched keys; never announce a saved contact before durable writes succeed. */
(function(root){'use strict';
function commit(storage,entries){
 const previous=[];let written=0;try{
  for(const [key] of entries)previous.push([key,storage.getItem(key)]);
  for(const [key,value] of entries){storage.setItem(key,String(value));written++}
  return {ok:true,rolledBack:true};
 }catch(error){
  let rolledBack=true;
  for(let i=written-1;i>=0;i--){
   const [key,old]=previous[i];
   try{if(old===null)storage.removeItem(key);else storage.setItem(key,old)}catch{rolledBack=false}
  }
  return {ok:false,rolledBack,error:String(error?.message||error)};
 }
}
root.BC_CRM_TX=Object.freeze({commit});
})(typeof window!=='undefined'?window:globalThis);
