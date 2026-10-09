const $=id=>document.getElementById(id);
$('scan').onclick=async()=>{
 $('status').textContent='Examinando la pestaña activa…';
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id||!/^https?:\/\//.test(tab.url||''))throw Error('Abre una web empresarial https://');
  const out=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
   const emails=new Set(),phones=new Set();
   const body=document.body?.innerText?.slice(0,180000)||'';
   for(const x of body.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,20}\b/gi)){if(emails.size<20)emails.add(x[0].toLowerCase())}
   for(const link of document.querySelectorAll('a[href^="mailto:"]')){const value=link.getAttribute('href').slice(7).split('?')[0].trim().toLowerCase();if(value.includes('@'))emails.add(value)}
   for(const link of document.querySelectorAll('a[href^="tel:"]')){const value=link.getAttribute('href').slice(4).trim();if(value.replace(/\D/g,'').length>=7)phones.add(value)}
   return {type:'buscaclientes-contact-evidence',website:location.origin,source:location.href,emails:[...emails].slice(0,20),phones:[...phones].slice(0,15),checked_at:new Date().toISOString(),verified:false};
  }});
  $('data').value=JSON.stringify(out[0]?.result||{},null,2);
  $('status').textContent='Listo. Datos de esta página: '+(out[0]?.result?.emails?.length||0)+' emails y '+(out[0]?.result?.phones?.length||0)+' teléfonos.';
 }catch(e){$('status').textContent='No fue posible: '+e.message}
};
$('copy').onclick=async()=>{if(!$('data').value)return;await navigator.clipboard.writeText($('data').value);$('status').textContent='Copiado. Pégalo en tu cartera de BuscaClientes.'};
