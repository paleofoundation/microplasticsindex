import datetime, difflib, hashlib, json, re, shutil
from pathlib import Path
from html import escape
from additions import items

W = Path(__file__).resolve().parent
P = W.parent / 'fill-thin-mpi-1/checkout'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
before = (P/'data/sources.json').read_text()
sources = json.loads(before)
by = {s['id']: s for s in sources}
selected = json.loads((W/'evidence/selection.json').read_text())['selected']
assert set(items) == {r['id'] for r in selected}
after = before
receipts = []
for sid, paragraphs in items.items():
    s = by[sid]
    extra = ''
    for n, (locator, text) in enumerate(paragraphs, 1):
        assert not any(x in text for x in ['\u2013', '\u2014'])
        assert not re.search(r'\d|\bpartners\b', text, re.I)
        extra += f'<p>{escape(text, quote=False)} <a href="{escape(s["url"], quote=True)}">Source: {escape(locator)}</a>.</p>'
        receipts.append(dict(id=f'{sid}-P{n}', source_id=sid, source_url=s['url'], source_sha256=s['sha256'], locator=locator, paraphrase=text, new_quantified_scientific_result=False))
    old = json.dumps(s['findings'], ensure_ascii=False)
    new = json.dumps(s['findings']+extra, ensure_ascii=False)
    assert after.count(old) == 1
    after = after.replace(old, new, 1)
proposed = json.loads(after)
changes = []
for x, y in zip(sources, proposed):
    fields = [k for k in set(x)|set(y) if x.get(k) != y.get(k)]
    if fields:
        assert x['id'] in items and fields == ['findings']
        changes.append(x['id'])
assert len(changes) == 10
(W/'proposed-sources.json').write_text(after)
(W/'UNAPPLIED-source-findings.patch').write_text(''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile='a/data/sources.json', tofile='b/data/sources.json')))
(W/'evidence/proposed-additions.json').write_text(json.dumps(receipts, indent=2, ensure_ascii=False)+'\n')
if not (W/'baseline-public').exists():
    shutil.copytree(P/'public', W/'baseline-public')
index = json.loads((W/'baseline-public/search-index.json').read_text())
predicted = json.loads(json.dumps(index))
claims = {c['id']: c for c in json.loads((P/'data/claims.json').read_text())}
resolve = lambda x: re.sub(r'\{\{claim:([a-z0-9-]+)\}\}', lambda m: '<span>'+escape(claims[m.group(1)]['display'], quote=False)+'</span>', x)
strip = lambda x: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', resolve(x))).strip()
indexchanges = []
for entry in predicted:
    sid = entry['path'].split('/')[-1]
    if entry['path'] != '/sources/'+sid or sid not in items:
        continue
    old = strip(by[sid]['findings'])
    new = strip(next(s for s in proposed if s['id'] == sid)['findings'])
    assert entry['text'].count(old) == 1
    original = entry['text']
    entry['text'] = entry['text'].replace(old, new, 1)
    indexchanges.append(dict(path=entry['path'], field='text', before_sha256=hashlib.sha256(original.encode()).hexdigest(), after_sha256=hashlib.sha256(entry['text'].encode()).hexdigest(), before_text=original, proposed_text=entry['text']))
assert len(indexchanges) == 10
(W/'evidence/UNAPPLIED-search-index-text-deltas.json').write_text(json.dumps(indexchanges, indent=2, ensure_ascii=False)+'\n')
(W/'predicted-search-index.json').write_text(json.dumps(predicted, separators=(',', ':'), ensure_ascii=False))
prior = json.loads((W.parent/'fill-thin-mpi-1/evidence/selection.json').read_text())['selected']
assert not {s['id'] for s in prior} & set(items)
protected = json.loads((W/'evidence/MPI1-protected-files.json').read_text())
assert all(sha(P/path) == digest for path, digest in protected.items())
gate = dict(created_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), state='PROPOSAL ONLY; no checkout data/public mutation', base='939fc8e7c06ecb8cfd059cbb05fbb91737540db8', request_A=dict(path='data/sources.json', reason='MPI1 34-file prohibition literally includes this shared file; require explicit narrow exception for next10 record findings only', base_file_sha256=sha(P/'data/sources.json'), selected_ids=list(items), changed_field_only='findings', patch_sha256=sha(W/'UNAPPLIED-source-findings.patch'), candidate_sha256=sha(W/'proposed-sources.json'), additions_sha256=sha(W/'evidence/proposed-additions.json'), unchanged_source_objects=39, MPI1_ten_source_objects_unchanged=True, all_33_MPI1_packet_files_byte_identical=True, all_80_claim_bytes_unchanged=True), request_B=dict(path='public/search-index.json', field_only='text', selected_paths=[x['path'] for x in indexchanges], delta_receipt_sha256=sha(W/'evidence/UNAPPLIED-search-index-text-deltas.json'), unchanged_count=76, unchanged='Entry order, paths, other fields, schema; all unselected public bytes, sitemap, robots, nav, counts and templates', builder='Existing unchanged builder only after both grants and root original review'), constraints=dict(protected_PR2=['content/llms.txt','scripts/build.mjs','templates/site.mjs'], source_records=49, claims=80, no_new_scientific_quantities=True, no_hosted_PDFs=True, no_policy_or_analyzer_change=True, no_merge_deploy_publish=True))
(W/'evidence/GATE-PROPOSAL.json').write_text(json.dumps(gate, indent=2)+'\n')
print(json.dumps(dict(paragraphs=len(receipts), gate_sha256=sha(W/'evidence/GATE-PROPOSAL.json'), patch_sha256=sha(W/'UNAPPLIED-source-findings.patch'), additions_sha256=sha(W/'evidence/proposed-additions.json'), index_delta_sha256=sha(W/'evidence/UNAPPLIED-search-index-text-deltas.json')), indent=2))
