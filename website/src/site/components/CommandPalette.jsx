import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {parseSearch, toQueryString} from '../../lib/nlSearch';

const RECENT_KEY = 'rr_recent_searches';
const MAX_RECENT = 5;

const Svg = ({d, size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const I = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  home: <><path d="M3 11l9-8 9 8M5 10v10h14V10" /></>,
  book: <><path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" /><path d="M17 8h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2M8 8h5M8 12h5" /></>,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  map: <><path d="M9 3 3 5.5v16L9 19l6 2.5 6-2.5v-16L15 5.5z" /><path d="M9 3v16M15 5.5v16" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  spark: <path d="m12 3 1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4z" />,
};

const PAGES = [
  {label: 'All properties', to: '/properties', icon: I.home},
  {label: 'Map explorer', to: '/map', icon: I.map},
  {label: 'The Journal', to: '/blog', icon: I.book},
  {label: 'Post a property — free', to: '/post-property', icon: I.plus},
  {label: 'Saved & alerts', to: '/saved', icon: I.spark},
  {label: 'Contact an advisor', to: '/contact', icon: I.arrow},
];

const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

function readRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/**
 * ⌘K / Ctrl-K search across the whole site.
 *
 * The input is read two ways at once: as free text for the property and article
 * lookups, and through the natural-language parser, which turns "3bhk under 60
 * lakh in kolar" into real filters and offers them as the first action.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [properties, setProperties] = useState([]);
  const [posts, setPosts] = useState([]);
  const [places, setPlaces] = useState({cities: [], localities: []});
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState(readRecent);
  const inputRef = useRef(null);

  /* ── open / close ── */
  useEffect(() => {
    const onKey = e => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        return;
      }
      // "/" opens it too, as long as the visitor isn't typing somewhere else
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', () => setOpen(true));
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // lock the page behind the dialog while it's up
  useEffect(() => {
    if (!open) return;
    window.__lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.__lenis?.start();
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  // place names make the parser far more accurate; fetched once, on first open
  const placesLoaded = useRef(false);
  useEffect(() => {
    if (!open || placesLoaded.current) return;
    placesLoaded.current = true;
    apiFetch('/properties/places')
      .then(r =>
        setPlaces({
          cities: (r.cities || []).map(c => c.city),
          localities: (r.localities || []).map(l => l.locality),
        }),
      )
      .catch(() => {});
  }, [open]);

  /* ── results ── */
  useEffect(() => {
    if (!open) return;
    const q = term.trim();
    if (!q) {
      setProperties([]);
      setPosts([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      Promise.all([
        apiFetch(`/properties?q=${encodeURIComponent(q)}&limit=4`).catch(() => ({items: []})),
        apiFetch(`/blog?q=${encodeURIComponent(q)}&limit=3`).catch(() => ({items: []})),
      ])
        .then(([p, b]) => {
          setProperties(p.items || []);
          setPosts(b.items || []);
        })
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [term, open]);

  const parsed = useMemo(() => parseSearch(term, places), [term, places]);
  const hasFilters = Object.keys(parsed.params).length > 0 && term.trim().length > 1;

  const pages = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return PAGES;
    return PAGES.filter(p => p.label.toLowerCase().includes(q));
  }, [term]);

  /* ── flat list of everything selectable, in display order ── */
  const items = useMemo(() => {
    const list = [];
    if (hasFilters) list.push({kind: 'filters'});
    properties.forEach(p => list.push({kind: 'property', p}));
    posts.forEach(p => list.push({kind: 'post', p}));
    pages.forEach(p => list.push({kind: 'page', p}));
    if (!term.trim()) recent.forEach(r => list.push({kind: 'recent', r}));
    return list;
  }, [hasFilters, properties, posts, pages, recent, term]);

  useEffect(() => setCursor(0), [term, open]);

  const remember = useCallback(value => {
    const next = [value, ...readRecent().filter(v => v !== value)].slice(0, MAX_RECENT);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* private mode — the palette just won't remember */
    }
    setRecent(next);
  }, []);

  const go = useCallback(
    item => {
      if (!item) return;
      setOpen(false);
      if (item.kind === 'filters') {
        remember(term.trim());
        navigate(`/properties?${toQueryString(parsed.params)}`);
      } else if (item.kind === 'property') {
        navigate(`/properties/${item.p.id}/${item.p.slug}`);
      } else if (item.kind === 'post') {
        navigate(`/blog/${item.p.slug}`);
      } else if (item.kind === 'page') {
        navigate(item.p.to);
      } else if (item.kind === 'recent') {
        setOpen(true);
        setTerm(item.r);
      }
    },
    [navigate, parsed.params, remember, term],
  );

  const onKeyDown = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Enter with no highlighted row still runs a plain search.
      if (items.length) go(items[cursor]);
      else if (term.trim()) {
        remember(term.trim());
        setOpen(false);
        navigate(`/properties?q=${encodeURIComponent(term.trim())}`);
      }
    }
  };

  if (!open) return null;

  let index = -1;
  const row = (key, node, item) => {
    index += 1;
    const i = index;
    const active = i === cursor;
    return (
      <button
        key={key}
        type="button"
        onMouseEnter={() => setCursor(i)}
        onClick={() => go(item)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
          active ? 'bg-gold/15 text-fg' : 'text-fg/85 hover:bg-surface2/70'
        }`}>
        {node}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        {/* input */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="text-gold"><Svg d={I.search} size={18} /></span>
          <input
            ref={inputRef}
            value={term}
            onChange={e => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Try “3bhk under 60 lakh in Kolar with parking”"
            className="w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded-md border border-line px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {/* parsed filters — the headline action */}
          {hasFilters && (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Search with filters
              </p>
              {row(
                'filters',
                <>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold">
                    <Svg d={I.spark} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Search the collection</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {parsed.chips.map((c, i) => (
                        <span key={i} className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                          {c.label}
                        </span>
                      ))}
                      {parsed.params.q && (
                        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
                          “{parsed.params.q}”
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-muted"><Svg d={I.arrow} size={14} /></span>
                </>,
                {kind: 'filters'},
              )}
            </>
          )}

          {/* properties */}
          {properties.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Properties</p>
              {properties.map(p =>
                row(
                  p.id,
                  <>
                    <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-surface2">
                      {p.imageUrls?.[0] && <img src={p.imageUrls[0]} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {[p.locality, p.city].filter(Boolean).join(', ') || 'Location on request'}
                      </span>
                    </span>
                    <span className="shrink-0 font-serif text-base text-gold">{money(p.price, p.currency)}</span>
                  </>,
                  {kind: 'property', p},
                ),
              )}
            </>
          )}

          {/* articles */}
          {posts.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Journal</p>
              {posts.map(p =>
                row(
                  p.id,
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface2 text-gold">
                      <Svg d={I.book} size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="block text-xs text-muted">{p.readingMinutes} min read</span>
                    </span>
                  </>,
                  {kind: 'post', p},
                ),
              )}
            </>
          )}

          {/* pages */}
          {pages.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Go to</p>
              {pages.map(p =>
                row(
                  p.to,
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface2 text-gold">
                      <Svg d={p.icon} size={15} />
                    </span>
                    <span className="flex-1 text-sm">{p.label}</span>
                  </>,
                  {kind: 'page', p},
                ),
              )}
            </>
          )}

          {/* recents, when the box is empty */}
          {!term.trim() && recent.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Recent</p>
              {recent.map(r =>
                row(
                  r,
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface2 text-muted">
                      <Svg d={I.clock} size={15} />
                    </span>
                    <span className="flex-1 text-sm">{r}</span>
                  </>,
                  {kind: 'recent', r},
                ),
              )}
            </>
          )}

          {term.trim() && !loading && items.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Nothing matched “{term.trim()}”. Press Enter to search anyway.
            </p>
          )}
          {loading && <p className="px-4 py-6 text-center text-xs uppercase tracking-[0.2em] text-muted">Searching…</p>}
        </div>

        {/* footer hints */}
        <div className="flex items-center gap-4 border-t border-line px-5 py-3 text-[11px] text-muted">
          <span><kbd className="rounded border border-line px-1.5 py-0.5">↑</kbd> <kbd className="rounded border border-line px-1.5 py-0.5">↓</kbd> navigate</span>
          <span><kbd className="rounded border border-line px-1.5 py-0.5">↵</kbd> open</span>
          <span className="ml-auto hidden sm:block">Understands plain English — price, BHK, locality, amenities</span>
        </div>
      </div>
    </div>
  );
}

/** Anything can open the palette without prop-drilling. */
export function openCommandPalette() {
  window.dispatchEvent(new Event('open-command-palette'));
}
