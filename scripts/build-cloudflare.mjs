/* Cloudflare Pages public asset builder. Never publish repository source tree.
 * Output contains ONLY client-visible assets from a reviewed allowlist.
 * Minification is a readability deterrent, NOT security or proof of paid access.
 * Usage: node scripts/build-cloudflare.mjs [--minify]
 * --minify requires dev dependency esbuild.
 */
import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname,extname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'dist');
const files=[
  "404.html",
  "about.html",
  "dashboard.html",
  "help.html",
  "index.html",
  "kit-libre.html",
  "planes.html",
  "privacy.html",
  "terms.html",
  "personal/index.html",
  "atlas-layout.js",
  "brand-i18n.js",
  "city-coherence.js",
  "config.js",
  "contact-evidence.js",
  "crm-transaction.js",
  "dashboard-brand.js",
  "dashboard-bridge.js",
  "dashboard.js",
  "fusion.js",
  "geo-safe.js",
  "geo-scope.js",
  "gyro-motion.js",
  "intelligence.js",
  "map-explorer.js",
  "opportunity-matrix.js",
  "payment-launch.js",
  "payment-plan-config.js",
  "public-whatsapp.js",
  "swiss-ux.js",
  "terminator-scan.js",
  "territory-lab.js",
  "choice-b.css",
  "dashboard.css",
  "map-explorer.css",
  "shell-005-editorial.css",
  "shell-009-visual.css",
  "shell-010-elegance.css",
  "shell-014-ux.css",
  "shell-015-launch.css",
  "swiss-army.css",
  "terminator-scan.css",
  "territory-lab.css",
  "brand-globe.svg",
  "robots.txt",
  "sitemap.xml",
  "kit-libre.md"
];
if(new Set(files).size!==files.length)throw Error('Duplicate asset');
const minify=process.argv.includes('--minify');
const esbuild=minify?await import('esbuild'):null;
await rm(OUT,{recursive:true,force:true});
let bytesIn=0,bytesOut=0;
for(const rel of files){
 if(!/^[a-zA-Z0-9_./-]+$/.test(rel)||rel.startsWith('.')||rel.includes('..'))throw Error('Unsafe asset path '+rel);
 let src=await readFile(join(ROOT,rel),'utf8');
 bytesIn+=Buffer.byteLength(src);
 if(minify&&rel.endsWith('.js')){
   const r=await esbuild.transform(src,{loader:'js',target:'es2020',minify:true,sourcemap:false,legalComments:'none'});
   src=r.code;
 }else if(minify&&rel.endsWith('.html')){
   // Only classic inline script (leave JSON script blocks and external references unchanged).
   const rx=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
   const matches=[...src.matchAll(rx)];
   for(const m of matches.reverse()){
     const attrs=m[1],raw=m[2];
     if(/\bsrc\s*=|\btype\s*=\s*["']?(?!text\/javascript|module)/i.test(attrs)||!raw.trim())continue;
     const code=(await esbuild.transform(raw,{loader:'js',target:'es2020',minify:true,sourcemap:false,legalComments:'none'})).code;
     src=src.slice(0,m.index)+m[0].replace(raw,code)+src.slice(m.index+m[0].length);
   }
 }
 const dest=join(OUT,rel);
 await mkdir(dirname(dest),{recursive:true});
 await writeFile(dest,src);
 bytesOut+=Buffer.byteLength(src);
}
const forbidden=['worker.js','enrich-worker.js','intelligence-territories-worker.js','paypal-worker.js','paypal-schema.sql','personal/personal-schema.sql','SHELL-016-GUTSY-RESEARCH.md','.github/workflows/pages.yml'];
for(const name of forbidden)if(files.includes(name))throw Error('Server-only artifact included: '+name);
console.log(JSON.stringify({status:'OK',minify,fileCount:files.length,bytesIn,bytesOut,out:OUT}));
