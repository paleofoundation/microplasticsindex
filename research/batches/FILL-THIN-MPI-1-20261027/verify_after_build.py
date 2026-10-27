import csv,hashlib,importlib.util,json,re,subprocess,sys,datetime as dt
from pathlib import Path
W=Path(__file__).resolve().parent;P=W/'checkout';B=W/'baseline-public';A=P/'public'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sel=json.loads((W/'evidence/selection.json').read_text())['selected'];paths={'/sources/'+s['id'] for s in sel};expected_files={p[1:]+'.html' for p in paths}|{'search-index.json'}
original=json.loads(subprocess.check_output(['git','show','9eab02843b516c339ea1bfc0c37886edcab91384:data/sources.json'],cwd=P));after=json.loads((P/'data/sources.json').read_text());assert len(original)==len(after)==49
assert (P/'data/sources.json').read_bytes()==(W/'proposed-sources.json').read_bytes()
changes=[]
for x,y in zip(original,after):
 changed=[k for k in set(x)|set(y) if x.get(k)!=y.get(k)]
 if changed:assert x['id'] in {s['id'] for s in sel} and changed==['findings'];changes.append(x['id'])
assert len(changes)==10
basefiles={str(p.relative_to(B)):sha(p) for p in B.rglob('*') if p.is_file()};afterfiles={str(p.relative_to(A)):sha(p) for p in A.rglob('*') if p.is_file()};assert basefiles.keys()==afterfiles.keys();changedfiles=[x for x in basefiles if basefiles[x]!=afterfiles[x]];assert set(changedfiles)==expected_files,changedfiles
beforeindex=json.loads((B/'search-index.json').read_text());afterindex=json.loads((A/'search-index.json').read_text());predicted=json.loads((W/'predicted-search-index.json').read_text());assert afterindex==predicted;assert len(beforeindex)==len(afterindex)==76
indexchanges=[]
for x,y in zip(beforeindex,afterindex):
 fields=[k for k in set(x)|set(y) if x.get(k)!=y.get(k)]
 if fields:assert x['path'] in paths and fields==['text'];indexchanges.append(x['path'])
assert set(indexchanges)==paths
protected=json.loads((W/'evidence/protected-baseline.json').read_text());protected_checks={}
for name,rec in protected.items():
 p=P/name;assert p.exists()==rec['exists'];assert not p.exists() or sha(p)==rec['sha256'];protected_checks[name]=rec
assert sha(P/'data/claims.json')==json.loads((W/'evidence/proposal-scope-check.json').read_text())['claims_json_sha256']
# Original-supplied artifacts are rechecked at the applied-byte checkpoint.
for r in json.loads((W/'evidence/source-locations.json').read_text()):assert sha(Path(r['path']))==r['sha256']
sys.path.insert(0,str(W.parent/'fill-audit-2/deps'));import requests
spec=importlib.util.spec_from_file_location('audit','/Users/kmfp/ops/site-fill/thin_audit.py');ad=importlib.util.module_from_spec(spec);spec.loader.exec_module(ad);assert sha(Path(ad.__file__))=='2b25ab36f6591acbe49ddaf856f04399f32497b5d00a36315506d7e27be460fc'
cfg=dict(min_words=400,max_thin_cites=2,claim_min_hits=3,exempt=set(ad.DEFAULT_EXEMPT.split(',')),stub_re=re.compile(ad.DEFAULT_STUB_RE,re.I),claim_re=re.compile(ad.DEFAULT_CLAIM_RE,re.I));metrics=[];prospective={r['url']:r for r in json.loads((W/'evidence/UNAPPLIED-prospective-thin-audit.json').read_text())['rows']};beforeaudit={r['url']:r for r in json.loads((W/'evidence/before-local-thin-audit.json').read_text())['rows']}
for s in sel:
 p=A/'sources'/f"{s['id']}.html";assert sha(p)==prospective[s['url']]['prospective_html_sha256']
 response=requests.Response();response.status_code=200;response.headers={'content-type':'text/html'};response.url=s['url'];response._content=p.read_bytes();response.encoding='utf-8';row=ad.analyze(s['url'],response,cfg);before=beforeaudit[s['url']]
 for key in ['words','citations','thin','thin_reasons']:assert row[key]==prospective[s['url']][key]
 metrics.append(dict(url=s['url'],before_words=before['words'],after_words=row['words'],before_thin=before['thin'],after_thin=row['thin'],before_reasons=before['thin_reasons'],after_reasons=row['thin_reasons'],before_citation_links=before['citations'],after_citation_links=row['citations'],source_families=1,html_sha256=sha(p)))
(W/'evidence/after-local-thin-audit.json').write_text(json.dumps(dict(scope='Actual local post-application build; not live deployment',adapter_sha256=sha(Path(ad.__file__)),thresholds='400/2/3 unchanged',rows=metrics),indent=2)+'\n')
with (W/'evidence/before-after.csv').open('w',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=list(metrics[0]),lineterminator='\n');writer.writeheader();writer.writerows(metrics)
receipt=dict(checked_utc=dt.datetime.now(dt.timezone.utc).isoformat(),state='PASS scoped integration guards; scientific/release approval pending',base='9eab02843b516c339ea1bfc0c37886edcab91384',source_records=49,selected_records_changed=changes,unchanged_records=39,changed_field_only='findings',claims=80,claims_bytes_unchanged=True,protected_PR2=protected_checks,public_files=len(basefiles),changed_public_files=changedfiles,all_other_public_files_byte_identical=len(basefiles)-len(changedfiles),index_count=76,index_changed_paths=indexchanges,index_changed_field_only='text',index_order_metadata_urls_schema_unchanged=True,index_exact_unapplied_proposal_match=True,actual_html_matches_prospective_hashes=True,artifact_hashes_rechecked=True,analyzer_unchanged=True,live_effect=False,remaining_thin=[r for r in metrics if r['after_thin']=='yes'])
(W/'evidence/applied-build-scope-check.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
