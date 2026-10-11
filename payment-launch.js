/* Customer-facing plan preview. Safe by default; PayPal checkout can only
   surface after LIVE verified, backend entitlements ready and exact PayPal subscription URL. */
(function(root){'use strict';
const dict={
 es:{title:'Explora sin prisa. Avanza a tu ritmo.',intro:'Descubre establecimientos en ciudades de todo el mundo, organiza tus hallazgos y decide cómo dar el siguiente paso.',
  free:'Gratis',available:'Disponible ahora',freeBody:'Explora negocios por ciudad y categoría. Selecciona hasta siete contactos cada semana y organiza tu cartera en este navegador.',
  personal:'Personal',team:'Equipos',coming:'En preparación',pending:'Las suscripciones estarán disponibles próximamente.',open:'Suscribirme mediante PayPal',kit:'El kit es gratuito para todo el mundo, sin compra ni cuenta.',kitButton:'Leer y descargar el kit',disclosure:'La exploración es gratuita. Los límites actuales se aplican en este navegador; las prestaciones de suscripción no están habilitadas todavía.',manage:'¿Ya tienes una suscripción PayPal? Consúltala o cancélala desde tu cuenta de PayPal.',
  back:'Volver a explorar',safety:'Cada ficha procede de fuentes públicas que pueden estar incompletas. No garantizamos respuestas, ventas ni ingresos.'},
 en:{title:'Explore freely. Move at your own pace.',intro:'Discover establishments in cities worldwide, organize what you find and choose your next step.',
  free:'Free',available:'Available now',freeBody:'Explore local businesses by city and category. Select up to seven contacts each week and keep a local browser notebook.',
  personal:'Personal',team:'Teams',coming:'In preparation',pending:'Subscriptions will become available soon.',open:'Subscribe with PayPal',kit:'The kit is free for everyone, with no purchase or account.',kitButton:'Read and download the kit',disclosure:'Exploration is free. Current limits are browser-local; paid subscriber features are not enabled yet.',manage:'Already have a PayPal subscription? View or cancel it from your PayPal account.',
  back:'Return to exploration',safety:'Listings come from public sources that may be incomplete. No replies, sales or earnings are guaranteed.'},
 pt:{title:'Explora livremente. Avança ao teu ritmo.',intro:'Descobre estabelecimentos em cidades do mundo inteiro, organiza o que encontras e escolhe o próximo passo.',
  free:'Gratuito',available:'Disponível agora',freeBody:'Explora negócios por cidade e atividade. Seleciona até sete contactos por semana e organiza a tua carteira neste navegador.',
  personal:'Pessoal',team:'Equipas',coming:'Em preparação',pending:'As subscrições estarão disponíveis em breve.',open:'Subscrever através do PayPal',kit:'O kit é gratuito para todas as pessoas, sem compra ou conta.',kitButton:'Ler e descarregar o kit',disclosure:'A exploração é gratuita. Os limites atuais são locais ao navegador; as funcionalidades pagas ainda não estão ativas.',manage:'Já tens uma subscrição PayPal? Consulta-a ou cancela-a na tua conta PayPal.',
  back:'Voltar à exploração',safety:'Os dados vêm de fontes públicas que podem estar incompletas. Não garantimos respostas, vendas ou rendimentos.'}
};
function validateSubscriptionUrl(value){
 if(typeof value!=='string'||value.length>450)return null;
 try{
  const u=new URL(value.trim());
  if(u.protocol!=='https:'||u.username||u.password||u.hash||!['paypal.com','www.paypal.com'].includes(u.hostname.toLowerCase()))return null;
  if(u.pathname!=='/webapps/billing/plans/subscribe'||u.searchParams.size!==1)return null;
  const id=u.searchParams.get('plan_id');
  if(!id||!/^P-[A-Z0-9]{8,45}$/.test(id))return null;
  return Object.freeze({url:u.href,planId:id});
 }catch{return null}
}
function isReady(cfg,key){
 const o=cfg?.offers?.[key];
 if(!cfg||cfg.live!==true||cfg.paypalVerified!==true||cfg.entitlementBackendReady!==true||!o)return false;
 const parsed=validateSubscriptionUrl(o.url);
 return !!(parsed&&parsed.planId===o.planId&&typeof o.priceText==='string'&&o.priceText.trim());
}
function update(lang){
 const l=Object.hasOwn(dict,lang)?lang:'es',t=dict[l];
 document.documentElement.lang=l;
 const brand=root.BC_BRAND?.apply(l)||'BuscaClientes';const name=root.BC_BRAND?.names?.[l];const pieces=document.querySelectorAll('.bc-plan-brand .wordmark span');if(name&&pieces.length===2){pieces[0].textContent=name[0];pieces[1].textContent=name[1]};document.querySelector('.bc-plan-brand')?.setAttribute('aria-label',brand);
 document.title=brand+' · '+({es:'Planes',en:'Plans',pt:'Planos'}[l]);
 document.querySelectorAll('[data-plan-i]').forEach(el=>{const value=t[el.dataset.planI];if(value)el.textContent=value});
 const langSelect=document.querySelector('#planLang');if(langSelect)langSelect.value=l;
 const cfg=root.BC_PLAN_CONFIG;
 for(const key of ['personal','team']){
  const card=document.querySelector('[data-plan-card="'+key+'"]');
  if(!card)continue;
  const badge=card.querySelector('[data-status]'),action=card.querySelector('[data-pay]');
  if(isReady(cfg,key)){
   const u=validateSubscriptionUrl(cfg.offers[key].url);
   badge.textContent=cfg.offers[key].priceText;
   action.textContent=t.open;
   action.href=u.url;action.hidden=false;action.rel='noopener noreferrer';action.target='_blank';
   card.dataset.checkout='live';
  }else{
   badge.textContent=t.coming;
   action.removeAttribute('href');action.hidden=true;card.dataset.checkout='disabled';
  }
 }
}
root.BC_PAYPAL_LAUNCH=Object.freeze({validateSubscriptionUrl,isReady,update});
if(typeof document!=='undefined'){
 let stored='es';try{const value=localStorage.getItem('bc-lang');if(['es','en','pt'].includes(value))stored=value}catch{}
 update(stored);
 document.querySelector('#planLang')?.addEventListener('change',e=>{
  const l=e.target.value;try{localStorage.setItem('bc-lang',l)}catch{}update(l);
 });
}
})(typeof window!=='undefined'?window:globalThis);
