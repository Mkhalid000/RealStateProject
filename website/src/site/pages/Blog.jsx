import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {Reveal} from '../components/Reveal';
import {AdSlot} from '../components/AdSlot';
import {BlogCard, BlogCardSkeleton, fmtDate} from '../components/BlogCard';
import {Seo, breadcrumbs, itemListJsonLd, siteOrigin} from '../components/Seo';

const PAGE = 9;
/** Where the in-feed ad lands inside the grid. */
const IN_FEED_AT = 4;

const SORTS = [
  {value: 'newest', label: 'Newest'},
  {value: 'popular', label: 'Most read'},
  {value: 'oldest', label: 'Oldest'},
];

const Svg = ({d, size = 15}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
};

export default function Blog() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';
  const sort = params.get('sort') || 'newest';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState(q);

  const filtered = Boolean(q || category || tag);

  const setParam = useCallback(
    (key, value) => {
      setParams(prev => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      }, {replace: true});
    },
    [setParams],
  );

  // debounce the search box into the URL
  const committed = useRef(q);
  useEffect(() => {
    if (search === committed.current) return;
    const t = setTimeout(() => {
      committed.current = search;
      setParam('q', search.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [search, setParam]);

  useEffect(() => {
    if (q !== committed.current) {
      committed.current = q;
      setSearch(q);
    }
  }, [q]);

  const queryFor = useCallback(
    p => {
      const sp = new URLSearchParams({page: String(p), limit: String(PAGE), sort});
      if (q) sp.set('q', q);
      if (category) sp.set('category', category);
      if (tag) sp.set('tags', tag);
      return sp.toString();
    },
    [q, category, tag, sort],
  );

  useEffect(() => {
    apiFetch('/blog/categories')
      .then(r => setCategories(r.items || []))
      .catch(() => setCategories([]));
    apiFetch('/blog?sort=popular&limit=4')
      .then(r => setPopular(r.items || []))
      .catch(() => setPopular([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    apiFetch(`/blog?${queryFor(1)}`)
      .then(r => {
        setItems(r.items || []);
        setTotal(r.total || 0);
        setHasMore(Boolean(r.hasMore));
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
        setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [queryFor]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const r = await apiFetch(`/blog?${queryFor(next)}`);
      setItems(prev => [...prev, ...(r.items || [])]);
      setHasMore(Boolean(r.hasMore));
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  }

  // The lead story only earns its size on an unfiltered, first page.
  const [lead, ...rest] = items;
  const showLead = !filtered && page === 1 && Boolean(lead);
  const grid = showLead ? rest : items;
  const activeCategory = categories.find(c => c.slug === category);

  return (
    <div className="relative">
      <Seo
        title={
          activeCategory
            ? `${activeCategory.name} — property guides & insight`
            : 'The Journal — property guides & market insight'
        }
        description={
          activeCategory?.description ||
          'Buying guides, market reading and design thinking from the Aurevia desk — written for people making a decision, not browsing.'
        }
        canonical={`${siteOrigin()}/blog${category ? `?category=${category}` : ''}`}
        noindex={Boolean(q || tag)}
        jsonLd={[
          breadcrumbs([{name: 'Home', path: '/'}, {name: 'Journal', path: '/blog'}]),
          items.length ? itemListJsonLd(items, p => `/blog/${p.slug}`) : null,
        ].filter(Boolean)}
      />
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-32">
        {/* ── header ── */}
        <Reveal>
          <p className="eyebrow mb-4">The Journal</p>
          <h1 className="max-w-3xl font-serif text-5xl leading-tight md:text-7xl">
            Notes on {}
            <span className="text-gradient-gold">property, place</span> and living well.
          </h1>
          <p className="mt-5 max-w-xl text-muted">
            Buying guides, market reading and design thinking from the Aurevia desk —
            written for people making a decision, not browsing.
          </p>
        </Reveal>

        {/* ── search + categories ── */}
        <Reveal y={30}>
          <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5 focus-within:border-gold/60">
              <span className="text-muted"><Svg d={I.search} /></span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
              />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear" className="text-muted transition-colors hover:text-fg">
                  <Svg d={I.close} size={14} />
                </button>
              )}
            </div>

            <select
              value={sort}
              onChange={e => setParam('sort', e.target.value === 'newest' ? '' : e.target.value)}
              className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-gold/60 [&>option]:text-ink">
              {SORTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setParam('category', '')}
              className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                !category ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:border-gold/40 hover:text-fg'
              }`}>
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setParam('category', c.slug === category ? '' : c.slug)}
                className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                  c.slug === category ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:border-gold/40 hover:text-fg'
                }`}>
                {c.name}
                {c.postCount != null && <span className="ml-1.5 text-[10px] opacity-60">{c.postCount}</span>}
              </button>
            ))}
          </div>

          {tag && (
            <button
              onClick={() => setParam('tag', '')}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3.5 py-1.5 text-xs text-gold">
              #{tag}
              <Svg d={I.close} size={12} />
            </button>
          )}
        </Reveal>

        <AdSlot slot="blog_list_top" variant="strip" className="mt-10" blogCategory={category} tags={tag} />

        {/* ── lead story ── */}
        {showLead && (
          <Reveal y={40} className="mt-12">
            <BlogCard post={lead} variant="wide" />
          </Reveal>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* ── article grid ── */}
          <div>
            {activeCategory?.description && (
              <p className="mb-6 border-l-2 border-gold/50 pl-4 text-sm text-muted">
                {activeCategory.description}
              </p>
            )}

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({length: 4}).map((_, i) => <BlogCardSkeleton key={i} />)}
              </div>
            ) : grid.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface p-12 text-center">
                <p className="font-serif text-2xl text-fg">Nothing here yet</p>
                <p className="mt-2 text-sm text-muted">
                  {filtered ? 'Try a different search or category.' : 'The first article is on its way.'}
                </p>
                {filtered && (
                  <button
                    onClick={() => setParams({}, {replace: true})}
                    className="mt-6 rounded-full border border-gold/60 bg-gold/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <Reveal stagger={0.06} className="grid gap-6 sm:grid-cols-2">
                  {grid.slice(0, IN_FEED_AT).map(p => <BlogCard key={p.id} post={p} />)}
                </Reveal>

                {grid.length > IN_FEED_AT && (
                  <AdSlot
                    slot="blog_list_infeed"
                    variant="strip"
                    className="my-6"
                    blogCategory={category}
                    tags={tag}
                  />
                )}

                {grid.length > IN_FEED_AT && (
                  <Reveal stagger={0.06} className="grid gap-6 sm:grid-cols-2">
                    {grid.slice(IN_FEED_AT).map(p => <BlogCard key={p.id} post={p} />)}
                  </Reveal>
                )}

                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    Showing {items.length} of {total}
                  </p>
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="rounded-full border border-gold/60 bg-gold/10 px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50">
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── sidebar ── */}
          <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
            {popular.length > 0 && (
              <div>
                <h4 className="mb-5 text-xs uppercase tracking-luxe text-muted">Most read</h4>
                <div className="space-y-4">
                  {popular.map(p => <BlogCard key={p.id} post={p} variant="row" />)}
                </div>
              </div>
            )}

            <AdSlot slot="blog_list_sidebar" variant="rail" blogCategory={category} tags={tag} />

            {categories.length > 0 && (
              <div>
                <h4 className="mb-4 text-xs uppercase tracking-luxe text-muted">Browse by category</h4>
                <div className="space-y-2">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setParam('category', c.slug === category ? '' : c.slug)}
                      className="flex w-full items-center justify-between border-b border-line/70 pb-2 text-left text-sm text-fg/85 transition-colors hover:text-gold">
                      {c.name}
                      <span className="text-xs text-muted">{c.postCount ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-line bg-surface2/40 p-6">
              <p className="font-serif text-xl text-fg">Looking for a home, not an article?</p>
              <p className="mt-2 text-sm text-muted">
                Browse the collection — filtered to your city the moment you arrive.
              </p>
              <Link
                to="/properties"
                className="mt-5 inline-flex rounded-full bg-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-gold-dark">
                View properties
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
