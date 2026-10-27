import csv, datetime, hashlib, importlib.util, json, re, sys
from pathlib import Path
from html import escape

W=Path(__file__).resolve().parent
P=W.parent/'fill-thin-mpi-1/checkout'
sys.path.insert(0,str(W.parent/'fill-audit-2/deps'))
import requests
spec=importlib.util.spec_from_file_location('audit','/Users/kmfp/ops/site-fill/thin_audit.py')
ad=importlib.util.module_from_spec(spec)
spec.loader.exec_module(ad)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(Path(ad.__file__))=='2b25ab36f6591acbe49ddaf856f04399f32497b5d00a36315506d7e27be460fc'
cfg=dict(min_words=400,max_thin_cites=2,claim_min_hits=3,exempt=set(ad.DEFAULT_EXEMPT.split(',')),stub_re=re.compile(ad.DEFAULT_STUB_RE,re.I),claim_re=re.compile(ad.DEFAULT_CLAIM_RE,re.I))
before={s['id']:s for s in json.loads((P/'data/sources.json').read_text())}
after={s['id']:s for s in json.loads((W/'proposed-sources.json').read_text())}
selected=json.loads((W/'evidence/selection.json').read_text())['selected']
rows=[]
(W/'prospective-public/sources').mkdir(parents=True,exist_ok=True)
for s in selected:
    sid=s['id']
    old=(W/'baseline-public/sources'/f'{sid}.html').read_text()
    assert after[sid]['findings'].startswith(before[sid]['findings'])
    extra=after[sid]['findings'][len(before[sid]['findings']):]
    marker='<h2 id="methods">Methods and scope</h2>'
    assert old.count(marker)==1
    new=old.replace(marker,extra+marker,1)
    (W/'prospective-public/sources'/f'{sid}.html').write_text(new)
    metrics=[]
    for text in [old,new]:
        response=requests.Response();response.status_code=200;response.headers={'content-type':'text/html'};response.url=s['url'];response._content=text.encode();response.encoding='utf-8'
        metrics.append(ad.analyze(s['url'],response,cfg))
    b,a=metrics
    assert b['words']==s['before_words']
    rows.append(dict(url=s['url'],before_words=b['words'],prospective_words=a['words'],before_citation_links=b['citations'],prospective_citation_links=a['citations'],before_thin=b['thin'],prospective_thin=a['thin'],before_reasons=b['thin_reasons'],prospective_reasons=a['thin_reasons'],source_families=1,baseline_html_sha256=hashlib.sha256(old.encode()).hexdigest(),prospective_html_sha256=hashlib.sha256(new.encode()).hexdigest()))
receipt=dict(checked_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='UNAPPLIED scratch-only HTML prediction from unchanged source renderer; not actual build, not live',adapter_sha256=sha(Path(ad.__file__)),thresholds='400/2/3 unchanged',rows=rows)
(W/'evidence/UNAPPLIED-prospective-thin-audit.json').write_text(json.dumps(receipt,indent=2)+'\n')
with (W/'evidence/UNAPPLIED-before-after.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');writer.writeheader();writer.writerows(rows)
print(json.dumps([dict(id=r['url'].split('/')[-1],before=r['before_words'],prospective=r['prospective_words'],citations=r['prospective_citation_links'],thin=r['prospective_reasons']) for r in rows],indent=2))
