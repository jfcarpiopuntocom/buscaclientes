/* Shell 014: same unchanged vector artwork, localized wordmark as accessible TEXT. */
(function(root){'use strict';
const names=Object.freeze({es:Object.freeze(['Busca','Clientes']),en:Object.freeze(['Find','Clients']),pt:Object.freeze(['Encontra','Clientes'])});
// Full user-approved product identity, independent of the immutable globe SVG.
const descriptors=Object.freeze({es:'Búsqueda + CRM',en:'Search Satellite + CRM',pt:'Busca + CRM'});
function apply(lang,doc=document){
 const key=Object.hasOwn(names,lang)?lang:'es';
 const name=names[key].join('');
 const word=doc.querySelector('.brand .wordmark');
 if(word){const spans=word.querySelectorAll('span');if(spans.length===2){spans[0].textContent=names[key][0];spans[1].textContent=names[key][1]}}
 const dashboard=doc.querySelector('header .brand strong');
 if(!word&&dashboard){dashboard.replaceChildren(doc.createTextNode(names[key][0]));const suffix=doc.createElement('span');suffix.textContent=names[key][1];dashboard.appendChild(suffix)}
 const descriptor=doc.querySelector('.bc-product-descriptor');
 if(descriptor)descriptor.textContent=descriptors[key];
 const header=doc.querySelector('header .brand');
 if(header){header.setAttribute('aria-label',name);if(descriptor?.id)header.setAttribute('aria-describedby',descriptor.id)}
 const planHeader=doc.querySelector('.bc-plan-brand');if(planHeader&&descriptor?.id)planHeader.setAttribute('aria-describedby',descriptor.id);
 return name;
}
root.BC_BRAND=Object.freeze({names,descriptors,apply});
})(typeof window!=='undefined'?window:globalThis);
