const burger = document.querySelector('.hmi-topnav-burger');
burger?.addEventListener('click', () => {
  const expanded = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', String(expanded));
  burger.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  document.querySelector('#hmi-topnav-menu').classList.toggle('open', expanded);
});
document.querySelector('.snav-toggle')?.addEventListener('click', event => {
  const el = event.currentTarget;
  el.setAttribute('aria-expanded', String(el.getAttribute('aria-expanded') !== 'true'));
});
document.querySelectorAll('[data-copy-citation]').forEach(button => button.addEventListener('click', async () => {
  const text = button.closest('section').querySelector('p').textContent;
  const status = button.closest('section').querySelector('[data-copy-status]');
  try {await navigator.clipboard.writeText(text); status.textContent = ' Citation copied.';}
  catch {status.textContent = ' Select and copy the citation above.';}
}));
const dialog = document.querySelector('.mpi-search');
const query = document.querySelector('#index-query');
const results = document.querySelector('.mpi-search-results');
let index;
let opener;
async function search() {
  try {
    index ??= await fetch('/search-index.json').then(r => {if (!r.ok) throw Error('Search unavailable');return r.json();});
    const terms = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const score = item => terms.reduce((n,t) => n + (item.title.toLowerCase().includes(t)?4:0) + (item.description.toLowerCase().includes(t)?2:0),0);
    const matches = index.filter(item => terms.every(t => (item.title+' '+item.description+' '+item.text).toLowerCase().includes(t))).sort((a,b)=>score(b)-score(a)).slice(0,15);
    results.replaceChildren();
    if (!matches.length) {results.textContent = 'No reviewed pages match this search.';return;}
    for (const item of matches) {
      const a = document.createElement('a'); a.href = item.path; a.textContent = item.title;
      const small = document.createElement('small'); small.textContent = item.description; a.append(small); results.append(a);
    }
  } catch {results.textContent = 'Search is unavailable. Browse Products or Sources from the navigation.';}
}
document.querySelectorAll('[data-search-open]').forEach(button => button.addEventListener('click', () => {
  opener=button;dialog.showModal();query.focus();search();
}));
document.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('close', () => opener?.focus());
query?.addEventListener('input', search);
const observer = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) {
    document.querySelectorAll('.snav a.sec').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+e.target.id));
  }
}, {rootMargin:'-15% 0px -65% 0px'});
document.querySelectorAll('article h2[id]').forEach(h => observer.observe(h));
