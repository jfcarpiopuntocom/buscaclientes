/* BuscaClientes Shell 015. NO payment links, prices or entitlements are active.
   Never put client secrets, access tokens, private customer data in public config. */
(function(root){'use strict';
root.BC_PLAN_CONFIG=Object.freeze({
 live:false,
 paypalVerified:false,
 entitlementBackendReady:false,
 offers:Object.freeze({
  personal:Object.freeze({url:'',planId:'',label:'Personal',priceText:''}),
  team:Object.freeze({url:'',planId:'',label:'Equipos',priceText:''})
 })
});
})(typeof window!=='undefined'?window:globalThis);
