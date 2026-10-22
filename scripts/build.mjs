import {readFile,mkdir,writeFile,rm,cp} from 'node:fs/promises';
import {SITE,BRAND,DATE,IMAGE,esc,document,article} from '../templates/site.mjs';
const read = async p => JSON.parse(await readFile(p,'utf8'));
const pages = await read('content/pages.json');
const sources = await read('data/sources.json');
const claims = await read('data/claims.json');
const map = new Map(sources.map(s=>[s.id,s]));
const all=[];
await rm('public',{recursive:true,force:true});
await mkdir('public',{recursive:true});
await cp('assets','public/assets',{recursive:true});
export function resolve(body, page) {
  const refs=[];
  // Claims enter the document before citations are numbered.
  body=body.replace(/\{\{claim:([a-z0-9-]+)\}\}/g,(_,id)=>{
    const c=claims.find(c=>c.id===id);
    if(!c || c.status!=='verified' || !map.has(c.source)) throw Error('Unverified claim '+id);
    if(!c.locator || !c.units || !c.conditions || !c.source_sha256) throw Error('Incomplete provenance '+id);
    return `<span data-claim="${id}">${esc(c.display)}</span>`;
  });
  body=body.replace(/\{\{cite:([a-z0-9-]+)\}\}/g,(_,id)=>{
    if(!map.has(id)) throw Error('Unknown source '+id);
    if(!refs.includes(id)) refs.push(id);
    const n=refs.indexOf(id)+1;
    return `<sup class="cite"><a href="#ref-${n}" aria-label="Reference ${n}">${n}</a></sup>`;
  });
  if(refs.length){body+=`<h2 id="references">References</h2><ol>${refs.map((id,i)=>{const s=map.get(id);return `<li id="ref-${i+1}"><a href="/sources/${id}">${esc(s.title)}</a><span class="hmi-ref-meta">${esc(s.authors)} · ${esc(s.journal)} · ${esc(s.year)}${s.doi?` · <a href="https://doi.org/${esc(s.doi)}">DOI: ${esc(s.doi)}</a>`:` · <a href="${esc(s.url)}">Official source</a>`}</span><span class="hmi-ref-tag">${esc(s.type)}</span></li>`;}).join('')}</ol>`;}
  return body;
}
async function emit(page,body,home=false) {
 const html=document(page,home?body:article(page,body));
 const filename=page.path==='/'?'index.html':page.path.slice(1)+'.html';
 await mkdir('public/'+filename.split('/').slice(0,-1).join('/'),{recursive:true});
 await writeFile('public/'+filename,html);
 all.push({...page,text:body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),filename});
}
const home={path:'/',title:BRAND,description:'Research on microplastics in products and ingredients, with study-specific results, methods, and source references.'};
const rows=[['Plastic food storage','Tubs, bags, wraps, and containers: release measurements, methods, and the limits of the evidence.','/products/plastic-food-storage','Product category'],['Baby wipes','Fiber shedding, polymer identification, and the cross-contaminant report.','/products/baby-wipes','Product category'],['Infant feeding bottles','Water-contact and cap-abrasion studies, with preparation conditions kept visible.','/products/infant-feeding-bottles','Product category'],['Tea bags','What bag-material and brewing experiments can establish.','/products/tea-bags','Product category'],['Bottled water','Study-specific water measurements and analytical limits.','/ingredients/bottled-water','Ingredient category'],['Salt','Occurrence studies, polymer confirmation, and sampling context.','/ingredients/salt','Ingredient category'],['How particles are measured','Why size windows, polymer identification, and measurement units change what a result means.','/testing','Methods'],['Regulatory context','What the verified agency material says, with the source and scope identified.','/regulations','Reference'],['The source archive','Study findings, analytical methods, and limitations behind the category pages.','/sources','Source records']];
const researchCount=sources.filter(s=>s.type==='Research article').length;
const homeBody=`<div id="quartz-root" class="page proof proof-home"><main class="proof-main" id="main-content" tabindex="-1"><div class="wiki-content hmi-v3-home"><section class="hmi-v3-hero hero-band--illustrated" aria-label="${BRAND}"><img class="hero-background" src="${IMAGE}" alt="Unmarked laboratory glassware and a notebook on a research desk." width="2164" height="721" fetchpriority="high"><div class="hmi-v3-hero-inner"><div class="hmi-v3-hero-copy"><h1>Microplastics <span>Reference Library</span></h1><p class="hmi-v3-hero-dek">Research on microplastics in products and ingredients. Explore what studies measured, how the methods differ, and where the evidence stops.</p><div class="search hmi-v3-hero-search"><button class="search-button hmi-v3-hero-search-button" type="button" data-search-open><span class="hmi-v3-hero-search-label">Search products, ingredients, methods, or sources</span><span class="hmi-v3-hero-search-go">Search</span></button></div></div><div class="hmi-v3-ledger" aria-label="Library at a glance"><div class="hmi-v3-ledger-head"><span class="hmi-v3-ledger-title">Library at a glance</span><span class="hmi-v3-ledger-refresh">UPDATED ${DATE}</span></div><div class="hmi-v3-ledger-body"><div class="hmi-v3-ledger-row"><span class="hmi-v3-ledger-k">Categories indexed</span><span class="hmi-v3-ledger-v">${pages.filter(p=>['Products','Ingredients','Topics'].includes(p.collection)&&p.kind!=='Directory').length}</span></div><div class="hmi-v3-ledger-row"><span class="hmi-v3-ledger-k">Research articles referenced</span><span class="hmi-v3-ledger-v">${researchCount}</span></div><div class="hmi-v3-ledger-row"><span class="hmi-v3-ledger-k">Current focus</span><span class="hmi-v3-ledger-v">Food storage</span></div><p class="hmi-v3-ledger-note">Counts describe this selected collection. Category pages identify direct findings, contextual evidence, and gaps.</p></div><a class="hmi-v3-ledger-coverage" href="/products">Explore the collection <span aria-hidden="true">→</span></a></div></div></section><section class="hmi-v3-start" aria-label="Start here"><div class="hmi-v3-start-inner"><div class="hmi-v3-kicker">Start here</div>${rows.map(([t,d,u,n])=>`<a class="hmi-v3-start-row" href="${u}"><span class="hmi-v3-start-t">${t}</span><span class="hmi-v3-start-d">${d}</span><span class="hmi-v3-start-n">${n}</span></a>`).join('')}</div></section><section class="hmi-v3-split" aria-label="What this reference is"><div class="hmi-v3-split-inner"><div class="hmi-v3-split-head"><h2>What this reference is</h2><div class="hmi-v3-rule"></div></div><div class="hmi-v3-split-body"><p>A particle count is useful only alongside the material, test conditions, size range, and analytical method that produced it. The library keeps those details together so a result from a laboratory test retains its context.</p><p>Each literature page connects the findings to the original papers and explains their limitations. A measured release under a specific test condition does not, by itself, establish exposure during everyday use or a health effect.</p><p>Start with plastic food storage, then explore food, beverages, personal-care products, and exposure context. Each category identifies the papers it uses and the questions they leave open.</p></div></div></section><section class="hmi-v3-registries" aria-label="Browse the library"><div class="hmi-v3-registries-inner">${[['Products','Food-contact and household products.','/products'],['Ingredients','Food and beverage occurrence studies.','/ingredients'],['Topics','Indoor, wildlife, and human exposure context.','/topics'],['Testing','Methods and measurement context.','/testing'],['Sources','The papers behind the findings.','/sources']].map(([t,d,u])=>`<a class="hmi-v3-registry" href="${u}"><span class="hmi-v3-registry-t">${t}</span><span class="hmi-v3-registry-d">${d}</span></a>`).join('')}</div></section></div></main></div>`;
await emit(home,homeBody,true);
for(const p of pages) await emit(p,resolve(p.body,p));
for(const s of sources) {
 const p={path:'/sources/'+s.id,title:s.title,description:s.description,kind:s.type,collection:'Sources',scope:s.scope||'Source record',actions:[['Findings','#findings'],['Original source',s.doi?'https://doi.org/'+s.doi:s.url]]};
 const related=pages.filter(p=>p.body?.includes('{{cite:'+s.id+'}}'));
 let body=`<p>${esc(s.description)}</p><h2 id="source-details">Source details</h2><p>${esc(s.authors)}. ${esc(s.journal)}. ${esc(s.year)}.</p><p>${s.doi?`<a href="https://doi.org/${esc(s.doi)}">DOI: ${esc(s.doi)}</a>`:`<a href="${esc(s.url)}">Official source</a>`}</p><h2 id="findings">Findings</h2>${s.findings}<h2 id="methods">Methods and scope</h2><p>${esc(s.methods)}</p><h2 id="limitations">What this source can support</h2><p>${esc(s.fitness)}</p><p>${esc(s.limitations)}</p><h2 id="related-evidence">Related evidence</h2><p>${related.map(p=>`<a href="${p.path}">${esc(p.shortTitle||p.title)}</a>`).join(' · ') || '<a href="/sources">Source archive</a>'}</p>`;
 const reported=claims.filter(c=>c.source===s.id);
 if(reported.length) body+=`<h2 id="reported-values">Reported values and source locations</h2><div class="hmi-table-scroll" role="region" aria-label="Reported values with original document locations" tabindex="0"><table><thead><tr><th>Reported value</th><th>Measurement basis</th><th>Conditions and size context</th><th>Original document location</th></tr></thead><tbody>${reported.map(c=>`<tr><td>{{claim:${c.id}}}</td><td>${esc(c.statistic)}</td><td>${esc(c.conditions)}<br>${esc(c.size_window)}</td><td>${esc(c.locator)}</td></tr>`).join('')}</tbody></table></div>`;
 if(s.sha256) body+=`<details><summary>Source provenance</summary><p>Primary PDF SHA-256: <code>${esc(s.sha256)}</code></p><p>The source record identifies the scope and limits of the primary-document review. Follow the DOI or official source link for the original document; this site does not redistribute the PDF.</p></details>`;
 await emit(p,resolve(body,p));
}
const sourcePage={path:'/sources',title:'Source archive',description:'The original studies and official agency material supporting the current collection.',kind:'Directory',actions:[['Browse sources','#sources']]};
await emit(sourcePage,`<h2 id="sources">Sources in this collection</h2><p>Each record distinguishes reported findings, methods, and the uses the source can support.</p><div class="mpi-directory">${sources.map(s=>`<a href="/sources/${s.id}">${esc(s.title)}<span>${esc(s.authors)} · ${esc(s.year)} · ${esc(s.type)}</span></a>`).join('')}</div>`);
const searchPage={path:'/search',title:'Search the library',description:'Find reviewed product, ingredient, testing, and source pages.',kind:'Search',actions:[['Browse products','/products'],['Browse sources','/sources']]};
await emit(searchPage,`<h2 id="search">Find a page</h2><p><button class="hmi-topnav-search-trigger" type="button" data-search-open>Open search</button></p><p>Search the published collection by topic or method. Categories still awaiting evidence review are excluded.</p><p><a href="/products">Browse product pages</a> or <a href="/sources">browse sources</a>.</p>`);
await writeFile('public/search-index.json',JSON.stringify(all.map(({path,title,description,text})=>({path,title,description,text}))));
await writeFile('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${all.map(p=>`<url><loc>${SITE+esc(p.path)}</loc><lastmod>${DATE}</lastmod></url>`).join('')}</urlset>`);
await writeFile('public/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /lint\nDisallow: /batch-reports\nSitemap: ${SITE}/sitemap.xml\n`);
const notFound={path:'/404',title:'Page not found',description:'This page is not in the Microplastics Reference Library collection.',kind:'Reference',actions:[['Home','/'],['Products','/products']]};
await writeFile('public/404.html',document(notFound,article(notFound,'<h2 id="not-found">Page not found</h2><p>Browse <a href="/products">Products</a> or <a href="/sources">Sources</a> to find a reviewed page.</p>')).replace('content="index,follow"','content="noindex,follow"'));
await writeFile('public/build-manifest.json',JSON.stringify({built:DATE,site:SITE,pages:all.map(({path,filename})=>({path,filename})),sources:sources.map(({id,sha256})=>({id,sha256})),claimCount:claims.length},null,2));
console.log(`Built ${all.length} pages, ${sources.length} source records, ${claims.length} verified claims.`);
