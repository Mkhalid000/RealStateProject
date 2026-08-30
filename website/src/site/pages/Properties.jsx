import {lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {useNavHidden} from '../../lib/useNavHidden';
import {useAuth} from '../../context/AuthContext';
import {useNearbyCity} from '../../lib/useNearbyCity';
import {Reveal} from '../components/Reveal';
import {PropertyCard} from '../components/PropertyCard';
import {AdSlot} from '../components/AdSlot';

// subtle interactive golden-dust backdrop (three.js) — its own lazy chunk
const Hero3D = lazy(() => import('../components/Hero3D').then(m => ({default: m.Hero3D})));

const PAGE = 12;
/**
 * Where the in-feed ad lands. Randomised per visit inside this window so the
 * unit doesn't become furniture that regulars learn to scroll straight past.
 */
const IN_FEED_MIN = 3;
const IN_FEED_MAX = 7;
const TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];
const BHKS = ['1', '2', '3', '4', '5'];
const BATHS = ['1', '2', '3', '4'];
const FURNISHINGS = ['unfurnished', 'semi_furnished', 'furnished'];
const FACINGS = ['north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west'];
const AGES = ['Under construction', 'New (0-1 year)', '1-5 years', '5-10 years', '10+ years'];
const AMENITIES = [
  'Parking', 'Lift', 'CCTV', 'Security Guard', '24x7 Water', 'Power Backup',
  'Swimming Pool', 'Gym', 'Club House', 'Kids Play Area', 'Jogging Track',
  'Garden', 'Terrace', 'Rooftop Access', 'BBQ Area', 'Pet Zone',
  'High-Speed WiFi', 'Smart Home', 'EV Charging', 'Solar Panels',
  'Metro Nearby', 'School Nearby', 'Hospital Nearby', 'Shopping Centre Nearby',
];
const PRICE_STEPS = [
  {label: 'Under $1M', min: '', max: '1000000'},
  {label: '$1M – $10M', min: '1000000', max: '10000000'},
  {label: '$10M – $25M', min: '10000000', max: '25000000'},
  {label: '$25M+', min: '25000000', max: ''},
];
const SORTS = [
  {value: 'newest', label: 'Newest'},
  {value: 'price_asc', label: 'Price: Low → High'},
  {value: 'price_desc', label: 'Price: High → Low'},
  {value: 'title_asc', label: 'Title: A → Z'},
];

/* every filter key the page owns — used by "clear all" and the active count */
const FILTER_KEYS = [
  'q', 'type', 'listing', 'bhk', 'baths', 'balconies', 'min', 'max',
  'minArea', 'maxArea', 'furnishing', 'facing', 'age', 'amenities',
  'city', 'state', 'locality', 'pincode', 'featured', 'negotiable',
];

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const fmt = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);
const compact = n =>
  new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1}).format(Number(n) || 0);

const field =
  'rounded-xl bg-transparent px-4 py-3 text-sm text-fg outline-none placeholder:text-muted [&>option]:text-ink';
const sideField =
  'w-full rounded-xl border border-line bg-surface2/40 px-3 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-gold/60 [&>option]:text-ink';

const I = {
  bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20" /><path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></>,
  bath: <><path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM7 20l-1 2M18 20l1 2" /></>,
  ruler: <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z" />,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="16" cy="18" r="2" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  back: <path d="M19 12H5m0 0 7 7m-7-7 7-7" />,
};
const Svg = ({d, size = 15}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

/* ── small filter primitives ─────────────────────────────────────────── */

/** Collapsible group inside the sidebar. */
function Group({title, count, children, defaultOpen = true}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line/70 py-4 first:pt-0 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg/80">
          {title}
          {count > 0 && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">{count}</span>}
        </span>
        <span className={`text-muted transition-transform duration-300 ${open ? '' : '-rotate-90'}`}>
          <Svg d={I.chevron} size={14} />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

/** Toggleable pill — used for every multi-select filter. */
function Pill({on, onClick, children, className = ''}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        on ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:border-gold/40 hover:text-fg'
      } ${className}`}>
      {children}
    </button>
  );
}

/** Text/number input that only writes to the URL after the user pauses. */
function DebouncedInput({value, onCommit, delay = 400, ...rest}) {
  const [local, setLocal] = useState(value);
  const committed = useRef(value);

  // keep in sync when the URL changes from elsewhere (chips, clear all)
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setLocal(value);
    }
  }, [value]);

  useEffect(() => {
    if (local === committed.current) return;
    const t = setTimeout(() => {
      committed.current = local;
      onCommit(local);
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return <input {...rest} value={local} onChange={e => setLocal(e.target.value)} />;
}

/* detailed row for the list view */
function PropertyRow({p}) {
  const img = p.imageUrls?.[0];
  const area = p.carpetArea ?? p.superBuiltUpArea;
  return (
    <Link
      to={`/properties/${p.id}/${p.slug}`}
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
  const {user} = useAuth();

  // URL is the source of truth for filters
  const get = k => params.get(k) || '';
  const q = get('q');
  const type = get('type');
  const listing = get('listing');
  const bhk = get('bhk');
  const baths = get('baths');
  const balconies = get('balconies');
  const min = get('min');
  const max = get('max');
  const minArea = get('minArea');
  const maxArea = get('maxArea');
  const furnishing = get('furnishing');
  const facing = get('facing');
  const age = get('age');
  const amenities = get('amenities');
  const city = get('city');
  const state = get('state');
  const locality = get('locality');
  const pincode = get('pincode');
  const featured = get('featured');
  const negotiable = get('negotiable');
  const sort = params.get('sort') || 'newest';
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const gridTop = useRef(null);

  // The navbar slides away on scroll-down — reclaim that space for the filters.
  const navHidden = useNavHidden();
  // targeting context shared by the ad slots on this page
  const firstType = type.split(',').filter(Boolean)[0] || '';
  const adTargeting = {city, type: firstType, listingType: listing};
  // fixed for the lifetime of the page so results don't reshuffle while filtering
  const inFeedAt = useMemo(
    () => IN_FEED_MIN + Math.floor(Math.random() * (IN_FEED_MAX - IN_FEED_MIN + 1)),
    [],
  );

  /* The mobile filter screen behaves like its own page: it freezes the list
     behind it and pushes a history entry, so the hardware/browser back button
     closes it instead of leaving the property listing entirely. */
  const poppedRef = useRef(false);
  useEffect(() => {
    if (!drawer) return;
    window.__lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    poppedRef.current = false;
    window.history.pushState({filtersOpen: true}, '');
    const onPop = () => { poppedRef.current = true; setDrawer(false); };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // closed via a button rather than "back" — consume the entry we pushed
      if (!poppedRef.current) window.history.back();
      window.__lenis?.start();
      document.body.style.overflow = prevOverflow;
    };
  }, [drawer]);

  // mutate a single URL param (and drop empties)
  const setParam = useCallback((key, value) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, {replace: true});
  }, [setParams]);

  // add/remove one value inside a comma-separated param
  const toggleIn = useCallback((key, value) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      const list = (next.get(key) || '').split(',').filter(Boolean);
      const at = list.indexOf(value);
      if (at === -1) list.push(value);
      else list.splice(at, 1);
      if (list.length) next.set(key, list.join(','));
      else next.delete(key);
      return next;
    }, {replace: true});
  }, [setParams]);

  const has = (raw, value) => raw.split(',').filter(Boolean).includes(value);
  const countOf = raw => raw.split(',').filter(Boolean).length;

  // set min + max together (price shortcuts)
  const setRange = useCallback((minKey, maxKey, lo, hi) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (lo) next.set(minKey, lo); else next.delete(minKey);
      if (hi) next.set(maxKey, hi); else next.delete(maxKey);
      return next;
    }, {replace: true});
  }, [setParams]);

  /* ── location-aware default ──
     With permission the listing opens on the visitor's own city; without it
     (denied, unavailable, or nothing listed there yet) it falls back to the
     full collection. An explicit `city` in the URL always wins. */
  const geo = useNearbyCity();
  const autoApplied = useRef(false);
  const [noneNearby, setNoneNearby] = useState('');
  const nearby = Boolean(geo.city) && city.toLowerCase() === geo.city.toLowerCase();

  useEffect(() => {
    if (!geo.city || autoApplied.current) return;
    // Arrived with a search or a place already in the URL (e.g. the home-page
    // search box)? That's what they asked for — don't box it into one city.
    if (city || q || state || locality || pincode) {
      autoApplied.current = true;
      return;
    }
    autoApplied.current = true;
    setNoneNearby('');
    setParam('city', geo.city);
  }, [geo.city, city, q, state, locality, pincode, setParam]);

  /** Drop the detected city and go back to the whole collection. */
  const showEverywhere = useCallback(
    (remember = true) => {
      autoApplied.current = true; // and don't re-apply it on the next render
      geo.clear(remember);
      setParam('city', '');
    },
    [geo, setParam],
  );

  /* Searching for a place ("mumbai") while the detected city is still applied
     would return nothing, so a search lifts the automatic city filter. A city
     the visitor picked themselves is left alone. */
  const [searchWidened, setSearchWidened] = useState(false);

  const commitSearch = useCallback(
    value => {
      const term = value.trim();
      const lift = Boolean(term) && nearby;
      setParams(prev => {
        const next = new URLSearchParams(prev);
        if (term) next.set('q', term);
        else next.delete('q');
        if (lift) next.delete('city');
        return next;
      }, {replace: true});
      if (lift) autoApplied.current = true; // don't let the effect re-apply it
      setSearchWidened(term ? w => w || lift : false);
    },
    [nearby, setParams],
  );

  // build the query string for the API from current filters + a page
  const queryFor = useCallback((p) => {
    const sp = new URLSearchParams({page: String(p), limit: String(PAGE), sort});
    const put = (k, v) => { if (v) sp.set(k, v); };
    put('q', q);
    put('type', type);
    put('listingType', listing);
    put('bhk', bhk);
    put('minBathrooms', baths);
    put('minBalconies', balconies);
    put('minPrice', min);
    put('maxPrice', max);
    put('minArea', minArea);
    put('maxArea', maxArea);
    put('furnishing', furnishing);
    put('facing', facing);
    put('propertyAge', age);
    put('amenities', amenities);
    put('city', city);
    put('state', state);
    put('locality', locality);
    put('pincode', pincode);
    put('featured', featured);
    put('negotiable', negotiable);
    return sp.toString();
  }, [q, type, listing, bhk, baths, balconies, min, max, minArea, maxArea,
      furnishing, facing, age, amenities, city, state, locality, pincode,
      featured, negotiable, sort]);

  /* ── save this search ──────────────────────────────────────────────
     The saved query is the API query (same names the alert matcher reads),
     minus paging — so running it later reproduces exactly these results. */
  const [savingSearch, setSavingSearch] = useState('');

  const saveSearch = useCallback(async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const sp = new URLSearchParams(queryFor(1));
    ['page', 'limit', 'sort'].forEach(k => sp.delete(k));
    const suggested =
      [city || locality, bhk && `${bhk} BHK`, type.split(',')[0], listing === 'rent' ? 'to rent' : '']
        .filter(Boolean)
        .join(' ') || 'My search';
    const name = window.prompt('Name this search — we will alert you when something new matches.', suggested);
    if (!name) return;

    setSavingSearch('saving');
    try {
      await apiFetch('/searches', {
        method: 'POST',
        body: JSON.stringify({name: name.trim().slice(0, 80), query: sp.toString()}),
      });
      setSavingSearch('saved');
      setTimeout(() => setSavingSearch(''), 2600);
    } catch (e) {
      setSavingSearch(e.message);
      setTimeout(() => setSavingSearch(''), 3200);
    }
  }, [user, queryFor, city, locality, bhk, type, listing]);

  /** Put the detected city back after a search widened the results. */
  const backToNearby = useCallback(() => {
    setSearchWidened(false);
    setParam('city', geo.city);
  }, [geo.city, setParam]);


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

  // one chip per active filter value (multi-selects get one chip each)
  const activeChips = useMemo(() => {
    const chips = [];
    const each = (key, raw, label) =>
      raw.split(',').filter(Boolean).forEach(v => chips.push({key, value: v, label: label(v)}));

    if (q) chips.push({key: 'q', label: `“${q}”`});
    each('type', type, cap);
    if (listing) chips.push({key: 'listing', label: listing === 'rent' ? 'For Rent' : 'For Sale'});
    each('bhk', bhk, v => (v === '5' ? '5+ BHK' : `${v} BHK`));
    if (baths) chips.push({key: 'baths', label: `${baths}+ Bath`});
    if (balconies) chips.push({key: 'balconies', label: `${balconies}+ Balcony`});
    if (min) chips.push({key: 'min', label: `Min $${compact(min)}`});
    if (max) chips.push({key: 'max', label: `Max $${compact(max)}`});
    if (minArea) chips.push({key: 'minArea', label: `Min ${compact(minArea)} sqft`});
    if (maxArea) chips.push({key: 'maxArea', label: `Max ${compact(maxArea)} sqft`});
    each('furnishing', furnishing, fmt);
    each('facing', facing, fmt);
    each('age', age, v => v);
    each('amenities', amenities, v => v);
    if (city) chips.push({key: 'city', label: city});
    if (state) chips.push({key: 'state', label: state});
    if (locality) chips.push({key: 'locality', label: locality});
    if (pincode) chips.push({key: 'pincode', label: `PIN ${pincode}`});
    if (featured) chips.push({key: 'featured', label: 'Featured'});
    if (negotiable) chips.push({key: 'negotiable', label: 'Negotiable'});
    return chips;
  }, [q, type, listing, bhk, baths, balconies, min, max, minArea, maxArea,
      furnishing, facing, age, amenities, city, state, locality, pincode,
      featured, negotiable]);

  /* Nothing listed in the detected city yet? Quietly widen to everything
     rather than showing an empty page the visitor didn't ask for. */
  useEffect(() => {
    if (loading || !nearby || total > 0) return;
    if (activeChips.length !== 1) return; // other filters are the likelier cause
    setNoneNearby(geo.city);
    showEverywhere(false); // not remembered — the city may get listings later
  }, [loading, nearby, total, activeChips.length, geo.city, showEverywhere]);

  function dropChip(c) {
    // clearing the city by hand means "show me everywhere", so stop re-applying
    if (c.key === 'city') showEverywhere(true);
    if (c.value) toggleIn(c.key, c.value);
    else setParam(c.key, '');
  }

  function clearAll() {
    showEverywhere(true);
    setNoneNearby('');
    setSearchWidened(false);
    setParams(prev => {
      const next = new URLSearchParams(prev);
      FILTER_KEYS.forEach(k => next.delete(k));
      return next;
    }, {replace: true});
  }

  /* ── the filter panel, shared by the sticky sidebar and the mobile drawer ── */
  const panel = (
    <>
      {/* search */}
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface2/40 px-3 focus-within:border-gold/60">
        <span className="text-muted"><Svg d={I.search} size={16} /></span>
        <DebouncedInput
          className="w-full bg-transparent py-2.5 text-sm text-fg outline-none placeholder:text-muted"
          placeholder="Search location or title"
          value={q}
          onCommit={commitSearch}
        />
      </div>

      <div className="mt-4">
        <Group title="Listing Type">
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-line p-1">
            {[{v: '', l: 'All'}, {v: 'buy', l: 'Buy'}, {v: 'rent', l: 'Rent'}].map(o => (
              <button
                key={o.l}
                type="button"
                onClick={() => setParam('listing', o.v)}
                className={`rounded-lg py-1.5 text-xs transition-colors ${
                  listing === o.v ? 'bg-gold text-ink' : 'text-muted hover:text-fg'
                }`}>
                {o.l}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Property Type" count={countOf(type)}>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map(t => (
              <Pill key={t} on={has(type, t)} onClick={() => toggleIn('type', t)}>{cap(t)}</Pill>
            ))}
          </div>
        </Group>

        <Group title="Budget" count={(min ? 1 : 0) + (max ? 1 : 0)}>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_STEPS.map(s => (
              <Pill
                key={s.label}
                on={min === s.min && max === s.max}
                onClick={() => setRange('min', 'max', min === s.min && max === s.max ? '' : s.min, min === s.min && max === s.max ? '' : s.max)}>
                {s.label}
              </Pill>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DebouncedInput className={sideField} type="number" min="0" placeholder="Min $" value={min} onCommit={v => setParam('min', v)} />
            <DebouncedInput className={sideField} type="number" min="0" placeholder="Max $" value={max} onCommit={v => setParam('max', v)} />
          </div>
        </Group>

        <Group title="Bedrooms" count={countOf(bhk)}>
          <div className="flex flex-wrap gap-1.5">
            {BHKS.map(b => (
              <Pill key={b} on={has(bhk, b)} onClick={() => toggleIn('bhk', b)}>
                {b === '5' ? '5+' : b} BHK
              </Pill>
            ))}
          </div>
        </Group>

        <Group title="Bathrooms & Balconies" count={(baths ? 1 : 0) + (balconies ? 1 : 0)} defaultOpen={false}>
          <p className="mb-1.5 text-[11px] text-muted">Bathrooms (minimum)</p>
          <div className="flex flex-wrap gap-1.5">
            {BATHS.map(b => (
              <Pill key={b} on={baths === b} onClick={() => setParam('baths', baths === b ? '' : b)}>{b}+</Pill>
            ))}
          </div>
          <p className="mb-1.5 mt-3 text-[11px] text-muted">Balconies (minimum)</p>
          <div className="flex flex-wrap gap-1.5">
            {BATHS.map(b => (
              <Pill key={b} on={balconies === b} onClick={() => setParam('balconies', balconies === b ? '' : b)}>{b}+</Pill>
            ))}
          </div>
        </Group>

        <Group title="Area (sqft)" count={(minArea ? 1 : 0) + (maxArea ? 1 : 0)} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            <DebouncedInput className={sideField} type="number" min="0" placeholder="Min" value={minArea} onCommit={v => setParam('minArea', v)} />
            <DebouncedInput className={sideField} type="number" min="0" placeholder="Max" value={maxArea} onCommit={v => setParam('maxArea', v)} />
          </div>
        </Group>

        <Group title="Furnishing" count={countOf(furnishing)} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {FURNISHINGS.map(f => (
              <Pill key={f} on={has(furnishing, f)} onClick={() => toggleIn('furnishing', f)}>{fmt(f)}</Pill>
            ))}
          </div>
        </Group>

        <Group title="Facing" count={countOf(facing)} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {FACINGS.map(f => (
              <Pill key={f} on={has(facing, f)} onClick={() => toggleIn('facing', f)}>{fmt(f)}</Pill>
            ))}
          </div>
        </Group>

        <Group title="Property Age" count={countOf(age)} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {AGES.map(a => (
              <Pill key={a} on={has(age, a)} onClick={() => toggleIn('age', a)}>{a}</Pill>
            ))}
          </div>
        </Group>

        <Group title="Amenities" count={countOf(amenities)} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {AMENITIES.map(a => (
              <Pill key={a} on={has(amenities, a)} onClick={() => toggleIn('amenities', a)}>{a}</Pill>
            ))}
          </div>
        </Group>

        <Group title="Location" count={[city, state, locality, pincode].filter(Boolean).length} defaultOpen={false}>
          <div className="space-y-2">
            <DebouncedInput className={sideField} placeholder="City" value={city} onCommit={v => setParam('city', v.trim())} />
            <DebouncedInput className={sideField} placeholder="State" value={state} onCommit={v => setParam('state', v.trim())} />
            <DebouncedInput className={sideField} placeholder="Locality" value={locality} onCommit={v => setParam('locality', v.trim())} />
            <DebouncedInput className={sideField} placeholder="Pincode" value={pincode} onCommit={v => setParam('pincode', v.trim())} />
          </div>
        </Group>

        <Group title="More" count={(featured ? 1 : 0) + (negotiable ? 1 : 0)} defaultOpen={false}>
          <div className="space-y-2.5">
            {[
              {k: 'featured', v: featured, l: 'Featured listings only'},
              {k: 'negotiable', v: negotiable, l: 'Price negotiable'},
            ].map(o => (
              <label key={o.k} className="flex cursor-pointer items-center justify-between gap-3 text-sm text-muted">
                {o.l}
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(o.v)}
                  onClick={() => setParam(o.k, o.v ? '' : 'true')}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${o.v ? 'bg-gold' : 'bg-surface2 ring-1 ring-line'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg transition-all ${o.v ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </label>
            ))}
          </div>
        </Group>
      </div>
    </>
  );

  return (
    <div className="relative">
      {/* subtle interactive three.js golden-dust backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <Suspense fallback={null}>
          <Hero3D />
        </Suspense>
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 pb-28 pt-32">
        <Reveal>
          <p className="eyebrow mb-4">The Collection</p>
          <h1 className="font-serif text-5xl md:text-7xl">Properties</h1>
          <p className="mt-4 max-w-xl text-muted">
            Refine by location, type, size and budget to discover residences matched to your standards.
          </p>
        </Reveal>

        <div className="mt-10 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* ── sticky filter sidebar (desktop) ──
              Opaque surface on purpose: a backdrop-blur panel this tall has to
              re-blur the animated canvas behind it on every scroll frame. */}
          <aside
            style={{top: navHidden ? '1.5rem' : '6rem'}}
            className="hidden transition-[top] duration-500 ease-out lg:sticky lg:block">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
              <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-fg">
                  <span className="text-gold"><Svg d={I.sliders} size={16} /></span>
                  Filters
                </span>
                {activeChips.length > 0 && (
                  <button onClick={clearAll} className="text-[11px] uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-gold hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              {/* data-lenis-prevent: without it Lenis hijacks the wheel here
                  and scrolls the page instead of this list. */}
              <div
                data-lenis-prevent
                style={{maxHeight: navHidden ? 'calc(100vh - 6.5rem)' : 'calc(100vh - 11rem)'}}
                className="filter-scroll overflow-y-auto overscroll-contain px-5 py-4 transition-[max-height] duration-500 ease-out">
                {panel}
              </div>
            </div>
          </aside>

          {/* ── results column ── */}
          <div>
            {/* meta row: filters button + count + sort + view toggle */}
            <div ref={gridTop} className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setDrawer(true)}
                className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold lg:hidden">
                <Svg d={I.sliders} size={15} />
                Filters
                {activeChips.length > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                    {activeChips.length}
                  </span>
                )}
              </button>

              <span className="text-sm text-muted">
                {loading ? 'Searching…' : `${total} ${total === 1 ? 'residence' : 'residences'}`}
              </span>

              <div className="ml-auto flex items-center gap-2">
                <select className={`${field} border border-line`} value={sort} onChange={e => setParam('sort', e.target.value)}>
                  {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <div className="flex items-center gap-1 rounded-full border border-line p-1">
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
            </div>

            {/* ── location notice ── */}
            {geo.status === 'locating' && (
              <div className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface2/40 px-4 py-2 text-xs text-muted">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-gold" />
                Finding residences near you…
              </div>
            )}

            {nearby && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3">
                <span className="text-gold"><Svg d={I.pin} size={15} /></span>
                <p className="text-sm text-fg">
                  Showing residences in <span className="font-semibold">{geo.city}</span> — your current city.
                </p>
                <button
                  onClick={() => showEverywhere(true)}
                  className="ml-auto rounded-full border border-gold/50 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink">
                  Show all
                </button>
              </div>
            )}

            {searchWidened && !nearby && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-surface2/30 px-4 py-3">
                <span className="text-muted"><Svg d={I.search} size={15} /></span>
                <p className="text-sm text-muted">
                  Searching every city for <span className="font-semibold text-fg">“{q}”</span>.
                </p>
                {geo.city && (
                  <button
                    onClick={backToNearby}
                    className="ml-auto rounded-full border border-line px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold/50 hover:text-gold">
                    Back to {geo.city}
                  </button>
                )}
              </div>
            )}

            {noneNearby && !nearby && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-surface2/30 px-4 py-3">
                <span className="text-muted"><Svg d={I.pin} size={15} /></span>
                <p className="text-sm text-muted">
                  Nothing listed in <span className="font-semibold text-fg">{noneNearby}</span> yet — showing the full collection.
                </p>
                <button
                  onClick={() => setNoneNearby('')}
                  aria-label="Dismiss"
                  className="ml-auto text-muted transition-colors hover:text-fg">
                  <Svg d={I.close} size={14} />
                </button>
              </div>
            )}

            {!city && !noneNearby && ['denied', 'unavailable', 'off'].includes(geo.status) && (
              <button
                onClick={() => geo.request({fresh: true})}
                title={geo.status === 'denied' ? 'Location is blocked for this site — allow it in your browser settings first' : undefined}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-muted transition-colors hover:border-gold/50 hover:text-gold">
                <Svg d={I.pin} size={14} />
                Show properties near me
              </button>
            )}

            {/* active filter chips */}
            {activeChips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeChips.map(c => (
                  <button
                    key={`${c.key}:${c.value || ''}`}
                    onClick={() => dropChip(c)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold transition-colors hover:bg-gold/20">
                    {c.label}
                    <Svg d={I.close} size={12} />
                  </button>
                ))}
                <button onClick={clearAll} className="text-xs uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-gold hover:underline">
                  Clear all
                </button>

                <button
                  onClick={saveSearch}
                  disabled={savingSearch === 'saving'}
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-60">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                  {savingSearch === 'saving'
                    ? 'Saving…'
                    : savingSearch === 'saved'
                      ? 'Saved — alerts on'
                      : 'Save this search'}
                </button>
              </div>
            )}
            {savingSearch && savingSearch !== 'saving' && savingSearch !== 'saved' && (
              <p className="mt-2 text-xs text-danger">{savingSearch}</p>
            )}

            {/* results */}
            <div className="mt-8">
              {loading ? (
                <div className={view === 'list' ? 'space-y-5' : 'grid gap-7 sm:grid-cols-2'}>
                  {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className={`animate-pulse rounded-2xl border border-line bg-surface2/40 ${view === 'list' ? 'h-44' : 'h-80'}`} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface2/20 py-20 text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-surface2 text-muted">
                    <Svg d={I.search} size={24} />
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
                  {items.slice(0, inFeedAt).map(p => <PropertyRow key={p.id} p={p} />)}
                  {items.length > inFeedAt && (
                    <AdSlot slot="properties_infeed" variant="strip" {...adTargeting} />
                  )}
                  {items.slice(inFeedAt).map(p => <PropertyRow key={p.id} p={p} />)}
                </Reveal>
              ) : (
                <Reveal stagger={0.06} className="grid gap-7 sm:grid-cols-2">
                  {items.slice(0, inFeedAt).map(p => <PropertyCard key={p.id} property={p} />)}
                  {items.length > inFeedAt && (
                    <AdSlot slot="properties_infeed" variant="card" {...adTargeting} />
                  )}
                  {items.slice(inFeedAt).map(p => <PropertyCard key={p.id} property={p} />)}
                </Reveal>
              )}

              {/* full-width promo below the results — the filter rail stays ads-free */}
              {!loading && items.length > 0 && (
                <AdSlot
                  slot="properties_bottom_strip"
                  variant="strip"
                  {...adTargeting}
                  className="mt-10"
                />
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
      </div>

      {/* ── mobile: filters get their own full-screen page ── */}
      {drawer && (
        <div className="filter-page fixed inset-0 z-[75] flex flex-col bg-bg lg:hidden">
          {/* page header */}
          <div className="flex items-center gap-3 border-b border-line px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              onClick={() => setDrawer(false)}
              aria-label="Back to results"
              className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-fg transition-colors hover:bg-surface2">
              <Svg d={I.back} size={20} />
            </button>
            <div className="flex-1">
              <h2 className="font-serif text-xl leading-none text-fg">Filters</h2>
              <p className="mt-1 text-[11px] text-muted">
                {activeChips.length > 0
                  ? `${activeChips.length} applied · ${total} ${total === 1 ? 'residence' : 'residences'}`
                  : `${total} ${total === 1 ? 'residence' : 'residences'}`}
              </p>
            </div>
            {activeChips.length > 0 && (
              <button onClick={clearAll} className="text-[11px] uppercase tracking-[0.14em] text-gold underline-offset-4 hover:underline">
                Reset
              </button>
            )}
          </div>

          {/* active chips, so the current selection is visible while refining */}
          {activeChips.length > 0 && (
            <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3">
              {activeChips.map(c => (
                <button
                  key={`m:${c.key}:${c.value || ''}`}
                  onClick={() => dropChip(c)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold">
                  {c.label}
                  <Svg d={I.close} size={12} />
                </button>
              ))}
            </div>
          )}

          {/* page body */}
          <div data-lenis-prevent className="filter-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {panel}
          </div>

          {/* page footer */}
          <div className="border-t border-line bg-bg px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              onClick={() => setDrawer(false)}
              className="w-full rounded-full bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-light">
              {loading ? 'Searching…' : `Show ${total} ${total === 1 ? 'residence' : 'residences'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
