import {useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';
import {Reveal} from '../components/Reveal';
import {PropertyCard} from '../components/PropertyCard';
import {AuroraBackground} from '../components/AuroraBackground';

const TYPES = ['', 'house', 'apartment', 'plot', 'commercial'];

export default function Properties() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  function load() {
    setLoading(true);
    const params = new URLSearchParams({limit: '24'});
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    apiFetch(`/properties?${params.toString()}`)
      .then(r => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const field =
    'bg-transparent px-4 py-3 text-sm text-fg outline-none placeholder:text-muted [&>option]:text-ink';

  return (
    <div className="relative">
      <AuroraBackground />
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-32">
      <Reveal>
        <p className="eyebrow mb-4">The Collection</p>
        <h1 className="font-serif text-5xl md:text-7xl">Properties</h1>
        <p className="mt-4 max-w-xl text-muted">
          Refine by location, type and budget to discover residences matched to
          your standards.
        </p>
      </Reveal>

      {/* floating glass filter */}
      <form
        onSubmit={e => {
          e.preventDefault();
          load();
        }}
        className="glass mt-10 flex flex-col gap-2 rounded-2xl p-3 shadow-soft md:flex-row md:items-center">
        <input
          className={`flex-1 ${field}`}
          placeholder="Search location or title"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="hidden h-6 w-px bg-line md:block" />
        <select className={field} value={type} onChange={e => setType(e.target.value)}>
          {TYPES.map(t => (
            <option key={t} value={t}>
              {t ? t[0].toUpperCase() + t.slice(1) : 'All Types'}
            </option>
          ))}
        </select>
        <input
          className={`w-28 ${field}`}
          type="number"
          placeholder="Min $"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
        />
        <input
          className={`w-28 ${field}`}
          type="number"
          placeholder="Max $"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
        />
        <button className="rounded-xl bg-gold px-7 py-3 text-xs uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-light">
          Search
        </button>
      </form>

      <div className="mt-12">
        {loading ? (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 6}).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl border border-line bg-surface2/40"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted">No properties match your search.</p>
        ) : (
          <Reveal stagger={0.08} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </Reveal>
        )}
        </div>
      </div>
    </div>
  );
}
