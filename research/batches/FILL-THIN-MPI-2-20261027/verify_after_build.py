import csv, datetime, hashlib, importlib.util, json, re, subprocess, sys
from pathlib import Path
from html import unescape

W=Path(__file__).resolve().parent
P=W.parent/'fill-thin-mpi-1/checkout'
B=W/'baseline-public'
A=P/'public'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base='939fc8e7c06ecb8cfd059cbb05fbb91737540db8'
selected=json.loads((W/'evidence/selection.json').read_text())['selected']
ids={r['id'] for r in selected}
old=json.loads(subprocess.check_output(['git','show',base+':data/sources.json'],cwd=P))
new=json.loads((P/'data/sources.json').read_text())
assert (P/'data/sources.json').read_bytes()==(W/'proposed-sources.json').read_bytes()
assert len(old)==len(new)==49
changes=[]
for x,y in zip(old,new):
    fields=[k for k in set(x)|set(y) if x.get(k)!=y.get(k)]
    if fields:
        assert x['id'] in ids and fields==['findings']
        changes.append(x['id'])
assert set(changes)==ids
prior=json.loads((W/'evidence/MPI1-protected-files.json').read_text())
packet_checks={name:digest for name,digest in prior.items() if name!='data/sources.json'}
assert len(packet_checks)==33 and all(sha(P/name)==digest for name,digest in packet_checks.items())
assert sha(P/'data/claims.json')=='4301e29cc35dec81877a37fd7624825e0134973a79719a3e42f964b44238d574'
protected={'content/llms.txt':None,'scripts/build.mjs':'a881b278fa81c36f3ba9c15d47139e5ddc292bbcb567545d1639c53f2c828d8b','templates/site.mjs':'4aff52a0313f1d86d1905f8f52db98770914c710b5bd68c9345073bbe130a630'}
for name,digest in protected.items():
    assert not (P/name).exists() if digest is None else sha(P/name)==digest
beforefiles={str(p.relative_to(B)):sha(p) for p in B.rglob('*') if p.is_file()}
afterfiles={str(p.relative_to(A)):sha(p) for p in A.rglob('*') if p.is_file()}
assert beforefiles.keys()==afterfiles.keys()
changedpublic=[name for name in beforefiles if beforefiles[name]!=afterfiles[name]]
assert set(changedpublic)=={'sources/'+sid+'.html' for sid in ids}|{'search-index.json'}
assert json.loads((A/'search-index.json').read_text())==json.loads((W/'predicted-search-index.json').read_text())
beforeindex=json.loads((B/'search-index.json').read_text());afterindex=json.loads((A/'search-index.json').read_text())
assert len(beforeindex)==len(afterindex)==76
for x,y in zip(beforeindex,afterindex):
    fields=[k for k in set(x)|set(y) if x.get(k)!=y.get(k)]
    assert not fields or fields==['text'] and x['path'] in {'/sources/'+sid for sid in ids}
for r in json.loads((W/'evidence/source-locations.json').read_text()):
    assert sha(Path(r['path']))==r['sha256']
sys.path.insert(0,str(W.parent/'fill-audit-2/deps'))
import requests
from bs4 import BeautifulSoup
spec=importlib.util.spec_from_file_location('audit','/Users/kmfp/ops/site-fill/thin_audit.py');ad=importlib.util.module_from_spec(spec);spec.loader.exec_module(ad)
assert sha(Path(ad.__file__))=='2b25ab36f6591acbe49ddaf856f04399f32497b5d00a36315506d7e27be460fc'
cfg=dict(min_words=400,max_thin_cites=2,claim_min_hits=3,exempt=set(ad.DEFAULT_EXEMPT.split(',')),stub_re=re.compile(ad.DEFAULT_STUB_RE,re.I),claim_re=re.compile(ad.DEFAULT_CLAIM_RE,re.I))
predicted={r['url']:r for r in json.loads((W/'evidence/UNAPPLIED-prospective-thin-audit.json').read_text())['rows']}
additions=json.loads((W/'evidence/proposed-additions.json').read_text())
rows=[];projected=0
for s in selected:
    p=A/'sources'/f"{s['id']}.html";assert sha(p)==predicted[s['url']]['prospective_html_sha256']
    soup=BeautifulSoup(p.read_text(),'html.parser')
    for r in [x for x in additions if x['source_id']==s['id']]:
        hits=[q for q in soup.find_all('p') if q.get_text(' ',strip=True).startswith(r['paraphrase'])]
        assert len(hits)==1
        links=hits[0].find_all('a');assert len(links)==1 and links[0].get('href')==r['source_url'] and links[0].get_text()=='Source: '+r['locator'];projected+=1
    response=requests.Response();response.status_code=200;response.headers={'content-type':'text/html'};response.url=s['url'];response._content=p.read_bytes();response.encoding='utf-8'
    a=ad.analyze(s['url'],response,cfg);pr=predicted[s['url']]
    for k,pk in [('words','prospective_words'),('citations','prospective_citation_links'),('thin','prospective_thin'),('thin_reasons','prospective_reasons')]:assert a[k]==pr[pk]
    rows.append(dict(url=s['url'],before_words=pr['before_words'],after_words=a['words'],before_citation_links=pr['before_citation_links'],after_citation_links=a['citations'],before_thin=pr['before_thin'],after_thin=a['thin'],before_reasons=pr['before_reasons'],after_reasons=a['thin_reasons'],source_families=1,html_sha256=sha(p)))
assert projected==20
(W/'evidence/after-local-thin-audit.json').write_text(json.dumps(dict(scope='Actual local applied build, not live',adapter_sha256=sha(Path(ad.__file__)),rows=rows),indent=2)+'\n')
with (W/'evidence/before-after.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');writer.writeheader();writer.writerows(rows)
receipt=dict(checked_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),state='PASS scoped actual build; not scientific or release approval',base=base,source_records=49,selected_records_changed=changes,changed_field_only='findings',unchanged_source_objects=39,allMPI1_ten_source_objects_unchanged=True,MPI1_packet_files_frozen=33,all80claim_bytes_unchanged=True,PR2_protected=protected,public_file_set=len(beforefiles),changed_public_files=changedpublic,unselected_public_files_byte_identical=len(beforefiles)-len(changedpublic),index76count_order_metadata_urls_schema_unchanged=True,index10text_fields_exact_proposal=True,all20paraphrases_hrefs_locators_exact=True,source_artifact_hashes_freshly_rechecked=10,adapter_unchanged=True,actual_HTML_hashes_match_scratch_prediction=True,remaining_thin=[r for r in rows if r['after_thin']=='yes'],live_effect=False)
(W/'evidence/applied-build-scope-check.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2))
