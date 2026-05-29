import {useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {Reveal} from '../components/Reveal';
import {MagneticButton} from '../components/MagneticButton';
import {ImageReveal} from '../components/ImageReveal';

const FALLBACK =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';

function money(price, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

const fmt = s => (s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null);

/* ── icons ── */
const I = {
  bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20" /><path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></>,
  bath: <><path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM7 20l-1 2M18 20l1 2" /></>,
  ruler: <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4zM7.5 10.5l2 2M11 7l2 2M14.5 3.5l2 2" />,
  floors: <><rect x="4" y="2" width="16" height="20" rx="1.5" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
};
const Svg = ({d, size = 18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

/* keyword → amenity icon */
const CHECK = <polyline points="20 6 9 17 4 12" />;
const A_ICONS = [
  {kw: ['parking', 'car'], d: <><path d="M5 13l1.4-4.2A2 2 0 0 1 8.3 7.5h7.4a2 2 0 0 1 1.9 1.3L19 13M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" /><circle cx="7.5" cy="15.5" r="1" /><circle cx="16.5" cy="15.5" r="1" /></>},
  {kw: ['pool', 'swim', 'water', 'rain'], d: <path d="M12 2.7S5 9.5 5 13.5a7 7 0 0 0 14 0C19 9.5 12 2.7 12 2.7z" />},
  {kw: ['gym', 'fitness', 'yoga'], d: <path d="M6 7v10M18 7v10M3.5 9.5v5M20.5 9.5v5M6 12h12" />},
  {kw: ['wifi', 'internet'], d: <><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="0.6" /></>},
  {kw: ['security', 'cctv', 'guard', 'camera', 'gated'], d: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />},
  {kw: ['garden', 'park', 'terrace', 'rooftop', 'bbq', 'pet', 'green', 'lawn'], d: <path d="M11 21A7 7 0 0 1 4 14C4 8 11 5 20 4c-1 9-4 16-9 17zM11 21v-6" />},
  {kw: ['lift', 'elevator'], d: <><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M10 8l2-2 2 2M10 16l2 2 2-2" /></>},
  {kw: ['power', 'ev', 'solar', 'electric', 'backup', 'charging'], d: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />},
  {kw: ['24', 'clock', 'hour'], d: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>},
  {kw: ['smart', 'home', 'club', 'play', 'kids', 'jog'], d: <path d="M3 11l9-8 9 8M5 10v10h14V10" />},
  {kw: ['metro', 'airport', 'school', 'hospital', 'shop', 'nearby', 'station', 'mall'], d: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>},
];
function amenityIcon(name = '') {
  const n = name.toLowerCase();
  const hit = A_ICONS.find(a => a.kw.some(k => n.includes(k)));
  return hit ? hit.d : CHECK;
}

function Fact({icon, value, label}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
        <Svg d={icon} size={20} />
      </span>
      <div>
        <div className="font-serif text-2xl leading-none text-fg">{value}</div>
        <div className="mt-1 text-[11px] uppercase tracking-luxe text-muted">{label}</div>
      </div>
    </div>
  );
}

function Detail({label, value}) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/60 py-3 transition-colors hover:border-gold/40">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-fg">{value}</span>
    </div>
  );
}

export default function PropertyDetail() {
  const {id} = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);

  // enquiry → lead
  const [lead, setLead] = useState({name: '', email: '', phone: '', message: ''});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [leadError, setLeadError] = useState('');
  const setL = (k, v) => setLead(f => ({...f, [k]: v}));

  useEffect(() => {
    apiFetch(`/properties/${id}`)
      .then(p => { setP(p); setActive(0); })
      .catch(e => setError(e.message));
  }, [id]);

  async function submitLead(e) {
    e.preventDefault();
    if (!lead.name.trim() || !(lead.email.trim() || lead.phone.trim())) {
      return setLeadError('Please add your name and an email or phone.');
    }
    setSending(true);
    setLeadError('');
    try {
      await apiFetch('/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: lead.name.trim(),
          email: lead.email.trim() || undefined,
          phone: lead.phone.trim() || undefined,
          message: lead.message.trim() || undefined,
          propertyId: p.id,
          source: 'website',
        }),
      });
      setSent(true);
    } catch (err) {
      setLeadError(err.message || 'Could not send your request.');
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-40 text-center">
        <p className="text-muted">Property not found.</p>
        <Link to="/properties" className="mt-6 inline-block text-sm uppercase tracking-[0.16em] text-gold">
          ← Back to Properties
        </Link>
      </div>
    );
  }
  if (!p) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-40">
        <div className="h-[60vh] animate-pulse rounded-2xl border border-line bg-surface2/40" />
      </div>
    );
  }

  const images = p.imageUrls?.length ? p.imageUrls : [FALLBACK];
  const area = p.carpetArea ?? p.superBuiltUpArea;
  const forLabel = p.listingType === 'rent' ? 'For Rent' : 'For Sale';
  const locationText =
    [p.locality, p.city, p.state, p.country].filter(Boolean).join(', ') || p.locationText || 'Location available on request';
  const mapQuery = p.latitude && p.longitude
    ? `${p.latitude},${p.longitude}`
    : encodeURIComponent([p.address, p.locality, p.city, p.state, p.country].filter(Boolean).join(', '));
  const hasMap = Boolean((p.latitude && p.longitude) || p.address || p.city);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-28">
      {/* breadcrumb */}
      <Link to="/properties" className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Properties
      </Link>

      {/* gallery */}
      <ImageReveal key={active} src={images[active]} alt={p.title} className="rounded-2xl" imgClassName="h-[62vh]" />
      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-20 w-28 overflow-hidden rounded-md border transition ${i === active ? 'border-gold' : 'border-line opacity-60 hover:opacity-100'}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-14 grid items-start gap-14 lg:grid-cols-[1.6fr_1fr]">
        {/* ── LEFT ── */}
        <div>
          <Reveal>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-gold/50 bg-gold/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-700">{p.type}</span>
              <span className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${p.listingType === 'rent' ? 'border-sky-400/50 bg-sky-500/25 text-gray-500' : 'border-sage/50 bg-sage/25 text-gray-500'}`}>{forLabel}</span>
              {p.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-4 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>
                  Featured
                </span>
              )}
            </div>
            <h1 className="mt-5 font-serif text-4xl md:text-6xl">{p.title}</h1>
            <p className="mt-4 flex items-center gap-2 text-muted">
              <span className="text-gold"><Svg d={I.pin} size={17} /></span>{locationText}
            </p>
            <p className="mt-4 font-serif text-4xl text-gold">
              {money(p.price, p.currency)}
              {p.priceNegotiable && <span className="ml-3 align-middle font-sans text-sm text-muted">· Negotiable</span>}
            </p>
          </Reveal>

          {/* key facts */}
          <Reveal y={30}>
            <div className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-7 sm:grid-cols-4">
              {p.bhk != null && <Fact icon={I.bed} value={p.bhk} label="Bedrooms" />}
              {p.bathrooms != null && <Fact icon={I.bath} value={p.bathrooms} label="Bathrooms" />}
              {area != null && <Fact icon={I.ruler} value={area} label="Sq Ft" />}
              {p.floorNumber != null && <Fact icon={I.floors} value={p.totalFloors ? `${p.floorNumber}/${p.totalFloors}` : p.floorNumber} label="Floor" />}
            </div>
          </Reveal>

          {/* description */}
          <Reveal y={30}>
            <div className="mt-10">
              <h4 className="text-lg uppercase tracking-luxe text-black text-bold">Overview</h4>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-fg/80">
                {p.description || 'A truly exceptional residence. Contact our advisors for full details and private viewings.'}
              </p>
            </div>
          </Reveal>

          {/* full details */}
          <Reveal y={30}>
            <div className="mt-10">
              <h4 className="text-lg uppercase tracking-luxe text-black text-bold">Property Details</h4>
              <div className="mt-4 grid gap-x-12 sm:grid-cols-2">
                <div>
                  <Detail label="Listing" value={forLabel} />
                  <Detail label="Type" value={fmt(p.type)} />
                  <Detail label="Bedrooms" value={p.bhk} />
                  <Detail label="Bathrooms" value={p.bathrooms} />
                  <Detail label="Balconies" value={p.balconies} />
                  <Detail label="Furnishing" value={fmt(p.furnishing)} />
                </div>
                <div>
                  <Detail label="Carpet Area" value={p.carpetArea ? `${p.carpetArea} sq ft` : null} />
                  <Detail label="Super Built-up" value={p.superBuiltUpArea ? `${p.superBuiltUpArea} sq ft` : null} />
                  <Detail label="Plot Area" value={p.plotArea ? `${p.plotArea} sq ft` : null} />
                  <Detail label="Floor" value={p.floorNumber != null ? (p.totalFloors ? `${p.floorNumber} of ${p.totalFloors}` : p.floorNumber) : null} />
                  <Detail label="Facing" value={fmt(p.facing)} />
                  <Detail label="Property Age" value={p.propertyAge} />
                </div>
              </div>
            </div>
          </Reveal>

        </div>

        {/* ── RIGHT · sticky enquiry ── */}
        <Reveal y={50}>
          <div className="glass sticky top-28 rounded-2xl p-7 shadow-soft">
            {/* agent */}
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-5">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-dark font-serif text-lg font-bold text-ink">
                {(p.agent?.fullName || 'A').charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="text-xs uppercase tracking-luxe text-muted">Listed by</div>
                <div className="font-medium text-fg">{p.agent?.fullName || 'Aurevia Advisor'}</div>
              </div>
            </div>

            <h3 className="font-serif text-2xl">Request a Private Viewing</h3>
            <p className="mb-5 mt-1 text-sm text-muted">Our advisor will respond within 24 hours.</p>

            {sent ? (
              <div className="rounded-xl border border-sage/40 bg-sage/10 p-5 text-center">
                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-sage/20 text-sage-light">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p className="font-medium text-fg">Enquiry sent!</p>
                <p className="mt-1 text-sm text-muted">Our advisor will be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={submitLead}>
                <input
                  value={lead.name}
                  onChange={e => setL('name', e.target.value)}
                  placeholder="Your name"
                  className="mb-3 w-full rounded-md border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
                />
                <input
                  type="email"
                  value={lead.email}
                  onChange={e => setL('email', e.target.value)}
                  placeholder="Email"
                  className="mb-3 w-full rounded-md border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
                />
                <input
                  value={lead.phone}
                  onChange={e => setL('phone', e.target.value)}
                  placeholder="Phone"
                  className="mb-3 w-full rounded-md border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
                />
                <textarea
                  rows={3}
                  value={lead.message}
                  onChange={e => setL('message', e.target.value)}
                  placeholder="I'd like a private viewing…"
                  className="mb-3 w-full rounded-md border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
                />
                {leadError && <p className="mb-3 text-sm text-danger">{leadError}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="sheen w-full rounded-md bg-gold py-3.5 text-xs uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-light disabled:opacity-60">
                  {sending ? 'Sending…' : 'Request Viewing'}
                </button>
              </form>
            )}

            {(p.ownerPhone || p.ownerWhatsapp) && (
              <div className="mt-4 flex gap-3">
                {p.ownerPhone && (
                  <a href={`tel:${p.ownerPhone}`} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-line py-3 text-xs uppercase tracking-[0.14em] text-fg transition-colors hover:border-gold hover:text-gold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z" /></svg>
                    Call
                  </a>
                )}
                {p.ownerWhatsapp && (
                  <a href={`https://wa.me/${p.ownerWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-line py-3 text-xs uppercase tracking-[0.14em] text-fg transition-colors hover:border-gold hover:text-gold">
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── full-width amenities ── */}
      {p.amenities?.length > 0 && (
        <Reveal y={30}>
          <div className="mt-16">
            <h4 className="text-lg uppercase tracking-luxe text-black text-bold">Amenities &amp; Features</h4>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {p.amenities.map(a => (
                <div key={a} className="flex items-center gap-2.5 py-1.5 text-fg">
                  <span className="shrink-0 text-gold"><Svg d={amenityIcon(a)} size={22} /></span>
                  <span className="text-sm">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── full-width animated map ── */}
      {hasMap && (
        <Reveal y={30}>
          <div className="mt-14">
            <h4 className="text-xs uppercase tracking-luxe text-muted">Location</h4>
            <div className="group relative mt-5 overflow-hidden rounded-2xl border border-line">
              <iframe
                title="Property location"
                src={mapSrc}
                loading="lazy"
                className="pointer-events-none h-[460px] w-full transition-[filter] duration-500 group-hover:grayscale-0"
                style={{border: 0, filter: 'grayscale(0.35) contrast(1.05)'}}
              />
              {/* pulsing marker */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="relative flex h-5 w-5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                  <span className="relative inline-flex h-5 w-5 rounded-full bg-gold ring-4 ring-gold/30" />
                </span>
              </div>
              {/* address chip + open link */}
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-ink/85 to-transparent p-5">
                <span className="flex items-center gap-2 text-sm text-white/90">
                  <span className="text-gold"><Svg d={I.pin} size={15} /></span>
                  {[p.locality, p.city, p.state].filter(Boolean).join(', ') || locationText}
                </span>
                <a href={mapHref} target="_blank" rel="noreferrer"
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-gold-light">
                  Open in Maps
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7 17 17 7M8 7h9v9" /></svg>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
