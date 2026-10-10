/* ATLAS approved: reuse the exact original form, globe and sonar; no cloned panels. */
(function(){
'use strict';
function apply(){
 const hero=document.querySelector('.hero');
 const copy=hero?.querySelector('.hero-copy');
 const form=document.querySelector('.swiss-search');
 if(!hero||!copy||!form)return;
 if(!copy.contains(form))copy.appendChild(form);
 const badge=document.querySelector('header .pill');
 if(badge)badge.textContent='✦ WORLD INTELLIGENCE';
 document.documentElement.dataset.designChoice='b';
 const core=['globe','targetUI','periscope','radar','country','city','category','keyword','searchButton','results','showSaved','showResults','exportButton','scopeDetail'];
 for(const id of core)if(document.querySelectorAll('#'+id).length!==1)console.error('ATLAS missing core control',id);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0),{once:true});
else setTimeout(apply,0);
})();
