/* Shell 016 — Policy decision engine ONLY. No client-side premium authorization.
 * Server must authenticate the caller and execute checks + insertion atomically in D1.
 * Never treat this module, localStorage, or a query parameter as proof of payment.
 */
export const PERSONAL_LIMITS=Object.freeze({weeklyAdds:250,cycleAdds:1000});
export const FREE_LIMITS=Object.freeze({weeklyAdds:7});
const date=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?d:null};
export function mondayUTC(input){
 const d=date(input);if(!d)throw new TypeError('Invalid timestamp');
 d.setUTCHours(0,0,0,0);
 d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
 return d.toISOString().slice(0,10);
}
const canonical=id=>typeof id==='string'&&id.length>=3&&id.length<=220
 && /^[a-zA-Z0-9][a-zA-Z0-9:_/.-]*$/.test(id)?id.toLowerCase():null;
export function checkPersonal(state={},command={}){
 const action=command.action||'save',now=date(command.now);
 if(!now)return Object.freeze({allowed:false,reason:'invalid_time'});
 // Reading and exporting all historical contacts are always allowed.
 if(action==='read'||action==='export'||action==='edit')
   return Object.freeze({allowed:true,charge:0,reason:'historical_access_retained'});
 if(action!=='save')return Object.freeze({allowed:false,reason:'unknown_action'});
 const id=canonical(command.contactId);
 if(!id)return Object.freeze({allowed:false,reason:'invalid_contact_id'});
 // A contact already saved must never be charged again, even after cancellation.
 const historicalIds=new Set((state.historicalIds||[]).map(canonical).filter(Boolean));
 if(historicalIds.has(id))return Object.freeze({allowed:true,charge:0,reason:'existing_contact'});
 if(state.entitlement!=='active')return Object.freeze({allowed:false,reason:'subscription_required'});
 const start=date(state.cycleStart),end=date(state.cycleEnd);
 if(!start||!end||!(start<end)||now<start||now>=end)
   return Object.freeze({allowed:false,reason:'billing_cycle_invalid_or_expired'});
 const rows=Array.isArray(state.additions)?state.additions:[];
 const cycleRows=rows.filter(x=>{const t=date(x.at);return t&&t>=start&&t<end});
 const currentMonday=mondayUTC(now);
 const weeklyRows=cycleRows.filter(x=>mondayUTC(x.at)===currentMonday);
 const total=new Set(cycleRows.map(x=>canonical(x.id)).filter(Boolean)).size;
 const weekly=new Set(weeklyRows.map(x=>canonical(x.id)).filter(Boolean)).size;
 if(total>=PERSONAL_LIMITS.cycleAdds)
   return Object.freeze({allowed:false,reason:'billing_cycle_limit',weekly,total,limits:PERSONAL_LIMITS});
 if(weekly>=PERSONAL_LIMITS.weeklyAdds)
   return Object.freeze({allowed:false,reason:'weekly_limit',weekly,total,limits:PERSONAL_LIMITS});
 return Object.freeze({allowed:true,charge:1,reason:'new_contact',weekly,total,limits:PERSONAL_LIMITS});
}
