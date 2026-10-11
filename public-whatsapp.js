/* Published establishment WhatsApp only. Never infer WhatsApp from a phone number.
   Never send messages or include pre-filled content automatically. */
(function(root){'use strict';
function link(value){
 const raw=String(value??'').trim();if(raw.length<8||raw.length>170)return '';
 let number=raw;
 if(/^https?:\/\//i.test(raw)){
  try{
   const u=new URL(raw);
   if(u.username||u.password||u.protocol!=='https:')return '';
   const host=u.hostname.toLowerCase();
   if(host==='wa.me'&&/^\/\d{8,15}\/?$/.test(u.pathname)&&!u.search)return 'https://wa.me/'+u.pathname.replace(/\D/g,'');
   if(host==='api.whatsapp.com'&&u.pathname==='/send'&&u.searchParams.has('phone')&&u.searchParams.size===1){
     number='+'+u.searchParams.get('phone');
   }else return '';
  }catch{return ''}
 }
 if(!/^\+[\d() .-]{7,22}$/.test(number))return '';
 const digits=number.replace(/\D/g,'');
 return digits.length>=8&&digits.length<=15&&digits[0]!=='0'?'https://wa.me/'+digits:'';
}
root.BC_WHATSAPP=Object.freeze({link});
})(typeof window!=='undefined'?window:globalThis);
