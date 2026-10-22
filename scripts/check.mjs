import {readFile,access} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const manifest=await read('public/build-manifest.json');
const sources=await read('data/sources.json');
const claims=await read('data/claims.json');
const sourceMap=new Map(sources.map(s=>[s.id,s]));
const claimMap=new Map(claims.map(c=>[c.id,c]));
const coverage=await read('data/category-queue.json');
const screening=await read('data/library-screening.json');
const audit=await read('data/library-hash-audit.json');
const pages=new Map();
for(const p of [...manifest.pages,{path:'/404',filename:'404.html'}])pages.set(p.path,await readFile('public/'+p.filename,'utf8'));
assert.equal(sourceMap.size,sources.length,'Duplicate sources');
assert.equal(claimMap.size,claims.length,'Duplicate claims');
assert.equal(coverage.categories.length,17,'All requested category pages required');
assert.equal(new Set(coverage.categories.map(c=>c.route)).size,17,'Unique category routes required');
for(const c of coverage.categories)assert(pages.has(c.route),'Missing category '+c.route);
const key=r=>r.folder+'/'+r.filename;
assert.equal(audit.length,433,'Authoritative PDF inventory changed');
assert.equal(new Set(screening.records.map(key)).size,audit.length,'Each PDF needs a screening disposition');
const screened=new Map(screening.records.map(r=>[key(r),r]));
for(const a of audit){assert(a.hash_match&&a.pdf_magic,'Primary PDF audit '+key(a));assert.equal(screened.get(key(a))?.sha256,a.sha256,'Screening artifact '+key(a));}
for(const c of claims){const s=sourceMap.get(c.source);assert(s,'Missing source '+c.source);assert.equal(c.status,'verified');assert.equal(c.source_sha256,s.sha256);for(const f of ['units','conditions','locator','size_window','display','statistic'])assert(c[f],`${c.id} lacks ${f}`);}
let links=0,claimUses=0;
for(const [path,html] of pages){
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'Exactly one h1: '+path);
 assert(html.includes('lang="en-US"'),'American English locale');
 assert(html.includes(`rel="canonical" href="https://microplasticsindex.com${path}"`),'Canonical '+path);
 assert(!/\u2014/.test(html),'Em dash '+path);
 assert(!/heavymetalindex|Heavy Metal Index|heavymetalcertified|\/ingredients\/ingredients\//i.test(html),'Legacy content '+path);
 assert(!/contaminantstandards\.vercel\.app/.test(html),'Staging report URL '+path);
 assert(!/href="[^\"]*(?:\/lint|\/batch-reports|\/api\/evidence-packet|\/certification)/i.test(html),'Forbidden route '+path);
 assert(!/\{\{[^}]+\}\}/.test(html),'Unresolved token '+path);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'Duplicate DOM id '+path);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(https?:|mailto:|data:)/.test(url))continue;
  assert(url.startsWith('/')||url.startsWith('#'),'Relative URL '+url+' on '+path);
  const [target,fragment]=url.split('#');
  const route=target||path;
  if(route.startsWith('/assets/'))await access('public'+route);
  else {assert(pages.has(route),'Broken route '+route+' on '+path);if(fragment)assert(pages.get(route).includes(`id="${fragment}"`),'Broken fragment '+url+' on '+path);}
  links++;
 }
 for(const [,id] of html.matchAll(/data-claim="([^"]+)"/g)){assert(claimMap.has(id),'Unregistered numeric claim '+id);claimUses++;}
 const citations=[...html.matchAll(/<sup class="cite"><a href="#ref-(\d+)"/g)].map(m=>Number(m[1]));
 const first=[...new Set(citations)];assert.deepEqual(first,first.map((_,i)=>i+1),'Citation first-appearance numbering '+path);
}
for(const forbidden of ['lint.html','batch-reports.html','api/evidence-packet.html','certification.html']){let exists=true;try{await access('public/'+forbidden);}catch{exists=false;}assert(!exists,'Forbidden output '+forbidden);}
const sitemap=await readFile('public/sitemap.xml','utf8');
assert(!/heavymetalindex|localhost|vercel\.app/.test(sitemap));
for(const p of manifest.pages)assert(sitemap.includes('<loc>https://microplasticsindex.com'+p.path+'</loc>'));
const robots=await readFile('public/robots.txt','utf8');assert(robots.includes('Sitemap: https://microplasticsindex.com/sitemap.xml'));
assert.equal(manifest.site,'https://microplasticsindex.com');
console.log(`PASS: ${pages.size} HTML pages; ${links} internal links/assets; ${claimUses} source-bound measurement uses; canonical, sitemap, robots, citation order, legacy removal, and forbidden routes.`);
