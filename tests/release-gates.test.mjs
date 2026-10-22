import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
async function fixture(fn){const dir=await mkdtemp(join(tmpdir(),'mpi-gate-'));try{for(const p of ['assets','content','data','scripts','templates'])await cp(p,join(dir,p),{recursive:true});await writeFile(join(dir,'package.json'),'{"type":"module"}');await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const run=(dir,script)=>spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8'});
test('a measurement with a different primary artifact hash cannot pass release checks',()=>fixture(async dir=>{
 const p=join(dir,'data/claims.json');const data=JSON.parse(await readFile(p));data[0].source_sha256='0'.repeat(64);await writeFile(p,JSON.stringify(data));
 assert.equal(run(dir,'scripts/build.mjs').status,0);assert.notEqual(run(dir,'scripts/check.mjs').status,0);
}));
test('candidate extraction cannot silently become a published numeric claim',()=>fixture(async dir=>{
 const p=join(dir,'data/claims.json');const data=JSON.parse(await readFile(p));data[0].status='candidate';await writeFile(p,JSON.stringify(data));
 const result=run(dir,'scripts/build.mjs');assert.notEqual(result.status,0);assert.match(result.stderr,/Unverified claim/);
}));
test('nested relative links and inherited ops destinations block release',()=>fixture(async dir=>{
 const p=join(dir,'content/pages.json');const data=JSON.parse(await readFile(p));data[0].body+='<p><a href="ingredients/ingredients/salt">Salt</a><a href="/api/evidence-packet">Packet</a></p>';await writeFile(p,JSON.stringify(data));
 assert.equal(run(dir,'scripts/build.mjs').status,0);const result=run(dir,'scripts/check.mjs');assert.notEqual(result.status,0);assert.match(result.stderr,/Forbidden route|Relative URL/);
}));
test('an unfinished regulatory section cannot pass the content checks',()=>fixture(async dir=>{
 const p=join(dir,'content/pages.json');const data=JSON.parse(await readFile(p));data[0].body+='<p>{{REGULATORY_CONTEXT}}</p>';await writeFile(p,JSON.stringify(data));
 assert.equal(run(dir,'scripts/build.mjs').status,0);const result=run(dir,'scripts/check.mjs');assert.notEqual(result.status,0);assert.match(result.stderr,/Unresolved token/);
}));
test('a screened PDF cannot silently disappear from the library audit',()=>fixture(async dir=>{
 const p=join(dir,'data/library-screening.json');const data=JSON.parse(await readFile(p));data.records.pop();await writeFile(p,JSON.stringify(data));
 assert.equal(run(dir,'scripts/build.mjs').status,0);const result=run(dir,'scripts/check.mjs');assert.notEqual(result.status,0);assert.match(result.stderr,/Each PDF needs a screening disposition/);
}));
