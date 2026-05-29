import {lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {Reveal} from '../components/Reveal';
import {PropertyCard} from '../components/PropertyCard';

// subtle interactive golden-dust backdrop (three.js) — its own lazy chunk
const Hero3D = lazy(() => import('../components/Hero3D').then(m => ({default: m.Hero3D})));

const PAGE = 12;
const TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];
const BHKS = ['1', '2', '3', '4', '5'];
const SORTS = [
  {value: 'newest', label: 'Newest'},
  {value: 'price_asc', label: 'Price: Low → High'},
  {value: 'price_desc', label: 'Price: High → Low'},
];

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

const field =
  'rounded-xl bg-transparent px-4 py-3 text-sm text-fg outline-none placeholder:text-muted [&>option]:text-ink';

const I = {
  bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20" /><path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></>,
  bath: <><path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM7 20l-1 2M18 20l1 2" /></>,
  ruler: <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z" />,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
};
const Svg = ({d, size = 15}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

/* detailed row for the list view */
function PropertyRow({p}) {
  const img = p.imageUrls?.[0];
  const area = p.carpetArea ?? p.superBuiltUpArea;
  return (
    <Link
      to={`/properties/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-colors hover:border-gold/50 sm:flex-row">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-72">
        {img ? (
          <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-ink"><Svg d={I.pin} size={28} /></div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-ink/60 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gold-light backdrop-blur-md">
          {p.type}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl text-fg transition-colors group-hover:text-gold">{p.title}</h3>
          <span className="shrink-0 rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
            {p.listingType === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <Svg d={I.pin} size={14} />
          {[p.locality, p.city, p.state].filter(Boolean).join(', ') || 'Location on request'}
        </p>
        <p className="mt-3 line-clamp-2 text-sm text-fg/70">
          {p.description || 'An exceptional residence — contact our advisors for full details and private viewings.'}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-[13px] text-muted">
          {p.bhk != null && <span className="inline-flex items-center gap-1.5"><Svg d={I.bed} />{p.bhk} BHK</span>}
          {p.bathrooms != null && <span className="inline-flex items-center gap-1.5"><Svg d={I.bath} />{p.bathrooms} Bath</span>}
          {area != null && <span className="inline-flex items-center gap-1.5"><Svg d={I.ruler} />{area} sqft</span>}
          <span className="ml-auto font-serif text-2xl text-gold">{money(p.price, p.currency)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Properties() {
  const [params, setParams] = useSearchParams();

  // URL is the source of truth for filters
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const listing = params.get('listing') || '';
  const bhk = params.get('bhk') || '';
  const min = params.get('min') || '';
  const max = params.get('max') || '';
  const sort = params.get('sort') || 'newest';
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const [qInput, setQInput] = useState(q);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const gridTop = useRef(null);

  // mutate a single URL param (and drop empties)
  const setParam = useCallback((key, value) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, {replace: true});
  }, [setParams]);

  // debounce the search box → q param
  useEffect(() => {
    const t = setTimeout(() => { if (qInput !== q) setParam('q', qInput.trim()); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  // build the query string for the API from current filters + a page
  const queryFor = useCallback((p) => {
    const sp = new URLSearchParams({page: String(p), limit: String(PAGE), sort});
    if (q) sp.set('q', q);
    if (type) sp.set('type', type);
    if (listing) sp.set('listingType', listing);
    if (bhk) sp.set('bhk', bhk);
    if (min) sp.set('minPrice', min);
    if (max) sp.set('maxPrice', max);
    return sp.toString();
  }, [q, type, listing, bhk, min, max, sort]);

  // (re)load page 1 whenever any filter/sort changes
  useEffect(() => {
    setLoading(true);
    setPage(1);
    apiFetch(`/properties?${queryFor(1)}`)
      .then(r => { setItems(r.items || []); setTotal(r.total || 0); setHasMore(Boolean(r.hasMore)); })
      .catch(() => { setItems([]); setTotal(0); setHasMore(false); })
      .finally(() => setLoading(false));
  }, [queryFor]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const r = await apiFetch(`/properties?${queryFor(next)}`);
      setItems(prev => [...prev, ...(r.items || [])]);
      setHasMore(Boolean(r.hasMore));
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  }

  const activeChips = useMemo(() => {
    const chips = [];
    if (q) chips.push({key: 'q', label: `“${q}”`});
    if (type) chips.push({key: 'type', label: cap(type)});
    if (listing) chips.push({key: 'listing', label: listing === 'rent' ? 'For Rent' : 'For Sale'});
    if (bhk) chips.push({key: 'bhk', label: `${bhk} BHK`});
    if (min) chips.push({key: 'min', label: `Min $${Number(min).toLocaleString()}`});
    if (max) chips.push({key: 'max', label: `Max $${Number(max).toLocaleString()}`});
    return chips;
  }, [q, type, listing, bhk, min, max]);

  function clearAll() {
    setQInput('');
    setParams(view === 'list' ? {view: 'list'} : {}, {replace: true});
  }

  return (
    <div className="relative">
      {/* subtle interactive three.js golden-dust backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <Suspense fallback={null}>
          <Hero3D />
        </Suspense>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-28 pt-32">
        <Reveal>
          <p className="eyebrow mb-4">The Collection</p>
          <h1 className="font-serif text-5xl md:text-7xl">Properties</h1>
          <p className="mt-4 max-w-xl text-muted">
            Refine by location, type, size and budget to discover residences matched to your standards.
          </p>
        </Reveal>

        {/* filter bar */}
        <div className="glass mt-10 flex flex-wrap items-center gap-2 rounded-2xl p-3 shadow-soft">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface2/40 px-2">
            <span className="pl-2 text-muted"><Svg d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} size={16} /></span>
            <input
              className={`flex-1 ${field} px-2`}
              placeholder="Search location or title"
              value={qInput}
              onChange={e => setQInput(e.target.value)}
            />
          </div>
          <div className="hidden h-7 w-px bg-line lg:block" />
          <select className={field} value={type} onChange={e => setParam('type', e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
          </select>
          <select className={field} value={listing} onChange={e => setParam('listing', e.target.value)}>
            <option value="">Buy &amp; Rent</option>
            <option value="buy">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <select className={field} value={bhk} onChange={e => setParam('bhk', e.target.value)}>
            <option value="">Any BHK</option>
            {BHKS.map(b => <option key={b} value={b}>{b} BHK</option>)}
          </select>
          <input className={`w-24 ${field}`} type="number" placeholder="Min $" value={min} onChange={e => setParam('min', e.target.value)} />
          <input className={`w-24 ${field}`} type="number" placeholder="Max $" value={max} onChange={e => setParam('max', e.target.value)} />
          <select className={field} value={sort} onChange={e => setParam('sort', e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* meta row: count + chips + view toggle */}
        <div ref={gridTop} className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">
            {loading ? 'Searching…' : `${total} ${total === 1 ? 'residence' : 'residences'}`}
          </span>
          {activeChips.map(c => (
            <button
              key={c.key}
              onClick={() => { if (c.key === 'q') setQInput(''); setParam(c.key, ''); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold transition-colors hover:bg-gold/20">
              {c.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          ))}
          {activeChips.length > 0 && (
            <button onClick={clearAll} className="text-xs uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-gold hover:underline">
              Clear all
            </button>
          )}

          {/* view toggle */}
          <div className="ml-auto flex items-center gap-1 rounded-full border border-line p-1">
            {[
              {k: 'grid', d: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>},
              {k: 'list', d: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>},
            ].map(v => (
              <button
                key={v.k}
                onClick={() => setParam('view', v.k === 'grid' ? '' : 'list')}
                aria-label={`${v.k} view`}
                className={`grid h-8 w-8 place-items-center rounded-full transition ${view === v.k ? 'bg-gold text-ink' : 'text-muted hover:text-fg'}`}>
                <Svg d={v.d} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* results */}
        <div className="mt-8">
          {loading ? (
            <div className={view === 'list' ? 'space-y-5' : 'grid gap-7 sm:grid-cols-2 lg:grid-cols-3'}>
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className={`animate-pulse rounded-2xl border border-line bg-surface2/40 ${view === 'list' ? 'h-44' : 'h-80'}`} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface2/20 py-20 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-surface2 text-muted">
                <Svg d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} size={24} />
              </div>
              <p className="text-muted">No residences match your filters.</p>
              {activeChips.length > 0 && (
                <button onClick={clearAll} className="mt-4 rounded-full bg-gold px-6 py-2.5 text-xs uppercase tracking-[0.16em] text-ink hover:bg-gold-light">
                  Clear filters
                </button>
              )}
            </div>
          ) : view === 'list' ? (
            <Reveal stagger={0.06} className="space-y-5">
              {items.map(p => <PropertyRow key={p.id} p={p} />)}
            </Reveal>
          ) : (
            <Reveal stagger={0.06} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(p => <PropertyCard key={p.id} property={p} />)}
            </Reveal>
          )}

          {/* load more */}
          {!loading && hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-gold/60 bg-gold/10 px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-60">
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
