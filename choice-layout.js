/* Three isolated approval choices: rearrange original nodes, never clone/replace them. */
(function(){
'use strict';
function init(){
 const param=new URLSearchParams(location.search).get('choice');
 const choice=['a','b','c'].includes(param)?param:'a';
 const link=document.createElement('link');link.rel='stylesheet';link.href='./choice-'+choice+'.css';link.dataset.choiceCss=choice;document.head.append(link);
 document.documentElement.dataset.designChoice=choice;
 const hero=document.querySelector('.hero');
 const copy=hero?.querySelector('.hero-copy');
 const search=document.querySelector('.swiss-search');
 const rail=document.querySelector('.scope-features');
 const periscope=document.querySelector('#periscope');
 const detail=document.querySelector('#scopeDetail');
 const badge=document.querySelector('.pill');
 if(!hero||!copy||!rail||!periscope||!search)return;
 const labels={
  a:'01 · ORBITAL / DESCUBRIR',
  b:'02 · ATLAS / ACTUAR',
  c:'03 · NEBULA / EXPLORAR'
 };
 if(badge)badge.textContent=labels[choice];
 if(choice==='a'){
  copy.appendChild(rail); // Existing 3 original actionable features
 }else if(choice==='b'){
  copy.appendChild(search); // Existing real form, no cloning
 }else if(choice==='c'){
  hero.appendChild(periscope); // Existing actual sonar, not a mockup
  if(detail)hero.after(detail); // Preserve dedicated details outside hero
 }
 const originalIds=['globe','targetUI','periscope','radar','country','city','category','keyword','searchButton','results','showSaved','showResults','exportButton','scopeDetail'];
 for(const id of originalIds)if(document.querySelectorAll('#'+id).length!==1)console.error('Missing or duplicated original feature: '+id);
 document.documentElement.classList.add('choice-ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
