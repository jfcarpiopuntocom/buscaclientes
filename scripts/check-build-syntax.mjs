/* Validate each deployed JS asset and every executable inline HTML script.
 * Import maps are JSON, not JS. Module blocks need module syntax parser.
 * This is a syntax gate, not a browser/visual or subscription QA gate.
 */
import {readFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url);
let tested=0;
async function walk(dir){
 for(const ent of await readdir(dir,{withFileTypes:true})){
  const file=join(dir,ent.name);
  if(ent.isDirectory()){await walk(file);continue}
  if(ent.name.endsWith('.js')){
   const source=await readFile(file,'utf8');
   try{new vm.Script(source,{filename:file})}catch(e){throw Error('JS syntax failure '+file+': '+e.message)}
   tested++;
  }
  if(ent.name.endsWith('.html')){
   const source=await readFile(file,'utf8');
   for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    const attrs=m[1], code=m[2];
    if(/\bsrc\s*=/i.test(attrs)||/\btype\s*=\s*["']?importmap/i.test(attrs)||!code.trim())continue;
    if(/\btype\s*=\s*["']?module/i.test(attrs)){
     const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:code,encoding:'utf8'});
     if(result.status!==0)throw Error('Module syntax failure '+file+': '+result.stderr.slice(0,400));
    } else {
     try{new vm.Script(code,{filename:file+':inline'})}catch(e){throw Error('Inline syntax failure '+file+': '+e.message)}
    }
    tested++;
   }
  }
 }
}
await walk(new URL('../dist/',import.meta.url));
console.log(JSON.stringify({status:'PASS',javascript_blocks_tested:tested}));
