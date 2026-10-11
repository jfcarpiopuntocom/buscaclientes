/* Shell014: same approved vector, language from same-origin preference.
   External script because dashboard CSP forbids inline JavaScript. */
(function(){'use strict';let lang='es';
 try{const stored=localStorage.getItem('bc-lang');if(['es','en','pt'].includes(stored))lang=stored}catch{}
 if(window.BC_BRAND){const name=window.BC_BRAND.apply(lang);document.title=name+': '+window.BC_BRAND.descriptors[lang]+' · '+({es:'Mi CRM',en:'My CRM',pt:'O meu CRM'}[lang]);}
})();
