/* Genuine media only. OSM's image/wikimedia_commons tags are user data;
   never use arbitrary image hosts or imply an illustrative photo is a venue.
   Wikimedia Commons handles CDN redirection; file page provides license details.
   No bulk media API requests; lazy load visible cards only. */
(function(root){
'use strict';
const safeFile=s=>{const name=String(s||'').replace(/^File:/i,'').trim();return name.length>4&&name.length<180&&!/[\/\\<>"'\n\r]/.test(name)?name:null};
function fromOsm(t={}){
 const commons=safeFile(t.wikimedia_commons);
 let filename=commons;
 if(!filename&&typeof t.image==='string'){
  try{
   const u=new URL(t.image);
   if(u.protocol==='https:'&&u.hostname==='commons.wikimedia.org'&&u.pathname.startsWith('/wiki/File:'))
    filename=safeFile(decodeURIComponent(u.pathname.split('/wiki/')[1]));
   if(u.protocol==='https:'&&u.hostname==='upload.wikimedia.org'&&u.pathname.startsWith('/wikipedia/commons/'))
    return {src:u.href,attribution:'Wikimedia Commons',licenseUrl:'https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search='+encodeURIComponent(t.name||'')};
  }catch{}
 }
 if(!filename)return null;
 const file='File:'+filename;
 return {src:'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(filename)+'?width=620',attribution:'Wikimedia Commons · licencia en la fuente',licenseUrl:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(file).replace(/%3A/i,':')};
}
root.BC_PHOTOS=Object.freeze({fromOsm,safeFile});
})(typeof window!=='undefined'?window:globalThis);
