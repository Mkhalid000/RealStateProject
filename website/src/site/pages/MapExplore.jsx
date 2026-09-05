import {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {APIProvider, Map, AdvancedMarker, useMap} from '@vis.gl/react-google-maps';
import {apiFetch} from '../../lib/api';
import {Seo} from '../components/Seo';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// AdvancedMarker (our custom price pins) only renders on a cloud-styled map,
// which requires a Map ID. DEMO_MAP_ID works for local dev but is watermarked.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

// Delhi — same starting region as the mobile MapScreen.
const INITIAL_CENTER = {lat: 28.6139, lng: 77.209};
const INITIAL_ZOOM = 6;

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=70';

function moneyShort(price, currency = 'USD') {
  const n = Number(price) || 0;
  const sym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '';
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return `${sym}${n}`;
}

const Svg = ({d, size = 18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const ICON = {
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  chevron: <path d="m9 18 6-6-6-6" />,
};

export default function MapExplore() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiFetch('/properties?limit=100')
      .then(r => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Only properties we can actually place on the map.
  const pinned = useMemo(
    () => items.filter(p => p.latitude != null && p.longitude != null),
    [items],
  );

  if (!API_KEY) return <MissingKey />;

  return (
    <div className="fixed inset-0 z-50 bg-bg">
      <Seo
        title="Map explorer — search property by neighbourhood"
        description="Explore every verified Aurevia listing on the map, by locality, type and price."
      />
      <h1 className="sr-only">Explore properties on the map</h1>
      <APIProvider apiKey={API_KEY}>
        <Map
          mapId={MAP_ID}
          defaultCenter={INITIAL_CENTER}
          defaultZoom={INITIAL_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          className="h-full w-full"
          onClick={() => setSelected(null)}>
          {pinned.map(p => (
            <AdvancedMarker
              key={p.id}
              position={{lat: p.latitude, lng: p.longitude}}
              zIndex={selected?.id === p.id ? 10 : 1}
              onClick={() => setSelected(p)}>
              <PricePin p={p} selected={selected?.id === p.id} />
            </AdvancedMarker>
          ))}
          <FitBounds items={pinned} />
        </Map>

        <TopBar loading={loading} count={pinned.length} />

        {loading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/25">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface/95 px-8 py-6 backdrop-blur-md">
              <span className="relative grid h-10 w-10 place-items-center">
                <span className="absolute inset-0 rounded-full border-2 border-line" />
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold" />
              </span>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted">Loading properties…</p>
            </div>
          </div>
        )}

        {!loading && pinned.length === 0 && <NoneMapped total={items.length} />}

        {selected && <PreviewCard p={selected} onClose={() => setSelected(null)} />}
      </APIProvider>
    </div>
  );
}

/** Frames the map around every pin once they're loaded. */
function FitBounds({items}) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (!map || done.current || items.length === 0) return;
    done.current = true;

    if (items.length === 1) {
      map.setCenter({lat: items[0].latitude, lng: items[0].longitude});
      map.setZoom(14);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    items.forEach(p => bounds.extend({lat: p.latitude, lng: p.longitude}));
    map.fitBounds(bounds, {top: 96, right: 48, bottom: 200, left: 48});
  }, [map, items]);

  return null;
}

/** Callout-style pin with a tail, mirroring the mobile PricePin. */
function PricePin({p, selected}) {
  const isRent = p.listingType === 'rent';
  return (
    <div className="flex cursor-pointer flex-col items-center">
      <div
        className={`min-w-[64px] rounded-lg border-[1.5px] px-2.5 py-1.5 text-center shadow-card transition-transform ${
          selected ? 'scale-110 border-gold bg-gold' : 'border-line bg-surface hover:border-gold/60'
        }`}>
        <div className={`text-[8px] font-extrabold uppercase tracking-[0.04em] ${selected ? 'text-ink' : 'text-gold'}`}>
          {isRent ? 'Rent' : 'Sale'}
        </div>
        <div className={`text-[13px] font-black leading-tight ${selected ? 'text-ink' : 'text-fg'}`}>
          {moneyShort(p.price, p.currency)}
        </div>
      </div>
      {/* triangular tail */}
      <div
        className={`h-0 w-0 border-l-[7px] border-r-[7px] border-t-[8px] border-l-transparent border-r-transparent ${
          selected ? 'border-t-gold' : 'border-t-line'
        }`}
      />
    </div>
  );
}

function TopBar({loading, count}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 p-4">
      <Link
        to="/properties"
        aria-label="Back"
        className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-fg shadow-card transition-colors hover:border-gold hover:text-gold">
        <Svg d={ICON.back} size={20} />
      </Link>

      <div className="pointer-events-auto mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 shadow-card">
        <span className="text-gold"><Svg d={ICON.pin} size={13} /></span>
        <span className="text-[13px] font-bold text-fg">
          {loading ? 'Loading…' : `${count} ${count === 1 ? 'property' : 'properties'}`}
        </span>
      </div>

      {/* balances the back button so the pill stays centred */}
      <span className="h-11 w-11 shrink-0" />
    </div>
  );
}

function PreviewCard({p, onClose}) {
  const navigate = useNavigate();
  const img = p.imageUrls?.length ? p.imageUrls[0] : FALLBACK_IMG;
  const loc = [p.locality, p.city].filter(Boolean).join(', ') || p.locationText || 'Location on request';

  return (
    <div className="absolute inset-x-0 bottom-0 p-4">
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mb-2 ml-auto grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-muted shadow-card transition-colors hover:text-fg">
          <Svg d={ICON.close} size={14} />
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/properties/${p.id}/${p.slug}`)}
          onKeyDown={e => e.key === 'Enter' && navigate(`/properties/${p.id}/${p.slug}`)}
          className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-soft transition-colors hover:border-gold/50">
          <img src={img} alt="" className="h-[76px] w-[76px] shrink-0 rounded-xl object-cover" />

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-gold/50 bg-gold/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-fg">
                {p.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
              {p.type && (
                <span className="rounded-full border border-line bg-surface2/60 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-fg">
                  {p.type}
                </span>
              )}
            </div>
            <p className="truncate text-sm font-bold text-fg transition-colors group-hover:text-gold">{p.title}</p>
            <p className="mt-0.5 text-[17px] font-extrabold text-gold">{moneyShort(p.price, p.currency)}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{loc}</p>
          </div>

          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold transition-transform group-hover:translate-x-0.5">
            <Svg d={ICON.chevron} size={20} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Every listing lacks coordinates — the map would just be an empty world. */
function NoneMapped({total}) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
      <div className="pointer-events-auto max-w-sm rounded-2xl border border-line bg-surface/95 p-8 text-center shadow-soft backdrop-blur-md">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-surface2 text-muted">
          <Svg d={ICON.pin} size={24} />
        </div>
        <p className="font-serif text-2xl text-fg">Nothing to map yet</p>
        <p className="mt-2 text-sm text-muted">
          {total > 0
            ? `${total} listing${total === 1 ? '' : 's'} found, but none have coordinates set. Add a latitude and longitude when posting to see them here.`
            : 'No listings are available right now.'}
        </p>
        <Link
          to="/properties"
          className="mt-6 inline-flex rounded-full border border-gold/60 bg-gold/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink">
          Browse listings
        </Link>
      </div>
    </div>
  );
}

/** Without a key the Google script never loads, so say so instead of hanging. */
function MissingKey() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bg p-6">
      <div className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-surface2 text-muted">
          <Svg d={ICON.pin} size={24} />
        </div>
        <p className="font-serif text-2xl text-fg">Map unavailable</p>
        <p className="mt-2 text-sm text-muted">
          Set <code className="text-gold">VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
          <code className="text-gold">website/.env</code> to enable the map explorer.
          See <code className="text-gold">.env.example</code> for setup steps.
        </p>
        <Link
          to="/properties"
          className="mt-6 inline-flex rounded-full border border-gold/60 bg-gold/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink">
          Back to Properties
        </Link>
      </div>
    </div>
  );
}
