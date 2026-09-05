import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {useAuth} from '../../context/AuthContext';
import {useSaved} from '../../context/SavedContext';
import {Reveal} from '../components/Reveal';
import {PropertyCard, PropertyCardSkeleton} from '../components/PropertyCard';
import {Seo} from '../components/Seo';

const Svg = ({d, size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  heart: <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z" />,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
};

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'}) : '';

/** One saved search: what it looks for, its alert switch, and how to run it. */
function SearchRow({search, onToggle, onDelete, onRun}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{search.name}</p>
        <p className="mt-1 truncate text-sm text-muted">{search.summary}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted/80">
          Saved {fmtDate(search.createdAt)}
          {search.matchCount > 0 && ` · ${search.matchCount} match${search.matchCount === 1 ? '' : 'es'} alerted`}
        </p>
      </div>

      <button
        onClick={() => onToggle(search)}
        aria-pressed={search.alertsEnabled}
        title={search.alertsEnabled ? 'Alerts on' : 'Alerts off'}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
          search.alertsEnabled
            ? 'border-gold bg-gold/15 text-gold'
            : 'border-line text-muted hover:border-gold/50 hover:text-gold'
        }`}>
        <Svg d={I.bell} size={14} />
        {search.alertsEnabled ? 'Alerts on' : 'Alerts off'}
      </button>

      <button
        onClick={() => onRun(search)}
        className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-gold-dark">
        Run
        <Svg d={I.arrow} size={13} />
      </button>

      <button
        onClick={() => onDelete(search)}
        aria-label="Delete saved search"
        className="rounded-full border border-line p-2 text-muted transition-colors hover:border-danger hover:text-danger">
        <Svg d={I.trash} size={14} />
      </button>
    </div>
  );
}

export default function Saved() {
  const {user, loading: authLoading} = useAuth();
  const {savedIds, refresh} = useSaved();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'searches' ? 'searches' : 'properties';

  const [properties, setProperties] = useState([]);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      apiFetch('/properties/saved/mine').catch(() => []),
      apiFetch('/searches').catch(() => ({items: []})),
    ])
      .then(([props, s]) => {
        setProperties(props || []);
        setSearches(s.items || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(load, [load]);

  // a card unsaved from this page should disappear from it
  useEffect(() => {
    setProperties(prev => prev.filter(p => savedIds.has(p.id)));
  }, [savedIds]);

  async function toggleAlerts(search) {
    setSearches(prev =>
      prev.map(s => (s.id === search.id ? {...s, alertsEnabled: !s.alertsEnabled} : s)),
    );
    await apiFetch(`/searches/${search.id}`, {
      method: 'PATCH',
      body: JSON.stringify({alertsEnabled: !search.alertsEnabled}),
    }).catch(e => {
      setError(e.message);
      load();
    });
  }

  async function removeSearch(search) {
    if (!window.confirm(`Delete “${search.name}”? You'll stop getting alerts for it.`)) return;
    setSearches(prev => prev.filter(s => s.id !== search.id));
    await apiFetch(`/searches/${search.id}`, {method: 'DELETE'}).catch(e => setError(e.message));
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-line text-gold">
          <Svg d={I.heart} size={22} />
        </span>
        <h1 className="font-serif text-4xl">Your shortlist lives here</h1>
        <p className="mt-3 text-muted">
          Sign in to keep properties you like, and to be told the moment a new
          listing matches what you're looking for.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-full bg-gold px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-dark">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <Seo title="Saved & alerts" description="Your shortlist and saved searches." noindex />
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-32">
        <Reveal>
          <p className="eyebrow mb-4">Your account</p>
          <h1 className="font-serif text-5xl md:text-6xl">Saved</h1>
          <p className="mt-4 max-w-xl text-muted">
            Everything you've shortlisted, and the searches we're watching on your
            behalf.
          </p>
        </Reveal>

        <div className="mt-9 flex flex-wrap gap-2">
          {[
            {key: 'properties', label: `Properties (${properties.length})`},
            {key: 'searches', label: `Saved searches (${searches.length})`},
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setParams(t.key === 'properties' ? {} : {tab: t.key}, {replace: true})}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                tab === t.key ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:text-fg'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
        )}

        {/* ── shortlisted properties ── */}
        {tab === 'properties' && (
          <div className="mt-10">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({length: 3}).map((_, i) => <PropertyCardSkeleton key={i} />)}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface p-14 text-center">
                <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-line text-gold">
                  <Svg d={I.heart} size={20} />
                </span>
                <p className="font-serif text-2xl text-fg">Nothing shortlisted yet</p>
                <p className="mt-2 text-sm text-muted">
                  Tap the heart on any listing and it will wait for you here.
                </p>
                <Link
                  to="/properties"
                  className="mt-7 inline-flex rounded-full border border-gold/60 bg-gold/10 px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink">
                  Browse properties
                </Link>
              </div>
            ) : (
              <Reveal stagger={0.06} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map(p => <PropertyCard key={p.id} property={p} />)}
              </Reveal>
            )}
          </div>
        )}

        {/* ── saved searches ── */}
        {tab === 'searches' && (
          <div className="mt-10 space-y-4">
            {loading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : searches.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface p-14 text-center">
                <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-line text-gold">
                  <Svg d={I.bell} size={20} />
                </span>
                <p className="font-serif text-2xl text-fg">No saved searches yet</p>
                <p className="mt-2 text-sm text-muted">
                  Set your filters on the listings page, then hit “Save this search”.
                  We'll alert you the moment something new matches.
                </p>
                <Link
                  to="/properties"
                  className="mt-7 inline-flex rounded-full border border-gold/60 bg-gold/10 px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink">
                  Set up a search
                </Link>
              </div>
            ) : (
              searches.map(s => (
                <SearchRow
                  key={s.id}
                  search={s}
                  onToggle={toggleAlerts}
                  onDelete={removeSearch}
                  onRun={search => navigate(`/properties?${search.query}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
