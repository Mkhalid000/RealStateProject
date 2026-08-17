import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {gsap} from '../../lib/gsap';
import {SmartImage} from '../../components/SmartImage';

const FALLBACK =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70';

function money(price, currency) {
  const n = Number(price) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

const ICON = {
  bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20" /><path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></>,
  bath: <><path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM7 20l-1 2M18 20l1 2" /></>,
  ruler: <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4zM7.5 10.5l2 2M11 7l2 2M14.5 3.5l2 2" />,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
};
const Spec = ({d, children}) => (
  <span className="inline-flex items-center gap-1.5">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
    {children}
  </span>
);

export function PropertyCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="relative aspect-[4/3] bg-surface2/60">
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="h-5 w-20 rounded-full bg-surface2" />
          <span className="h-5 w-16 rounded-full bg-surface2" />
        </div>
        <span className="absolute right-4 top-4 h-9 w-9 rounded-full bg-surface2" />
        <span className="absolute bottom-4 left-4 h-7 w-32 rounded-md bg-surface2" />
      </div>

      <div className="p-5">
        <div className="h-4 w-3/5 rounded-full bg-surface2" />
        <div className="mt-3 h-3 w-2/5 rounded-full bg-surface2/70" />
        <div className="mt-5 flex gap-5 border-t border-line pt-4">
          <div className="h-3 w-16 rounded-full bg-surface2/70" />
          <div className="h-3 w-16 rounded-full bg-surface2/70" />
          <div className="h-3 w-16 rounded-full bg-surface2/70" />
        </div>
      </div>

      {/* sweeping shimmer */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.07] to-transparent" />
    </div>
  );
}

export function PropertyCard({property}) {
  const [fav, setFav] = useState(false);
  const [idx, setIdx] = useState(0);
  // The extra photos are only reachable by hovering the image, so they are not
  // downloaded until then — a grid of cards otherwise pulled 100+ files.
  const [wantsAll, setWantsAll] = useState(false);
  const cardRef = useRef(null);
  const images = property.imageUrls?.length ? property.imageUrls : [FALLBACK];
  const area = property.carpetArea ?? property.superBuiltUpArea;
  const forLabel = property.listingType === 'rent' ? 'For Rent' : 'For Sale';

  // interactive 3D tilt that follows the cursor
  const onMove = e => {
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(cardRef.current, {
      rotateY: px * 7,
      rotateX: -py * 7,
      y: -10,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 1000,
      transformOrigin: 'center',
    });
  };
  const onEnter = () => setWantsAll(true);
  const onLeave = () => {
    setIdx(0);
    gsap.to(cardRef.current, {rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out'});
  };

  // Airbnb-style: hovering across the image cycles through its photos
  const onImgMove = e => {
    if (images.length < 2) return;
    const r = e.currentTarget.getBoundingClientRect();
    const zone = Math.floor(((e.clientX - r.left) / r.width) * images.length);
    setIdx(Math.min(images.length - 1, Math.max(0, zone)));
  };

  return (
    <Link
      ref={cardRef}
      to={`/properties/${property.id}/${property.slug}`}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group relative block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-[border-color,box-shadow] duration-500 hover:border-gold/50 hover:shadow-glow [transform-style:preserve-3d] will-change-transform">
      <div className="relative aspect-[4/3] overflow-hidden" onMouseMove={onImgMove}>
        {/* crossfading photos — only the cover is fetched up front */}
        {(wantsAll ? images : images.slice(0, 1)).map((src, i) => (
          <SmartImage
            key={i}
            src={src}
            alt={property.title}
            w={480}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 380px"
            eager={i === 0}
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
            imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.08]"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent" />

        {/* top badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2" style={{transform: 'translateZ(40px)'}}>
          <span className="rounded-full border border-white/15 bg-ink/50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-gold-light backdrop-blur-md">
            {property.type}
          </span>
          <span className="rounded-full border border-white/15 bg-ink/50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white/80 backdrop-blur-md">
            {forLabel}
          </span>
          {property.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>
              Featured
            </span>
          )}
        </div>

        {/* favorite */}
        <button
          type="button"
          aria-label={fav ? 'Saved' : 'Save'}
          onClick={e => { e.preventDefault(); setFav(f => !f); }}
          style={{transform: 'translateZ(40px)'}}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink/50 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-gold active:scale-90">
          <svg width="17" height="17" viewBox="0 0 24 24" fill={fav ? '#f2a65a' : 'none'} stroke={fav ? '#f2a65a' : 'currentColor'} strokeWidth="1.8" className={`transition-colors ${fav ? '' : 'text-white/85'}`}>
            <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z" />
          </svg>
        </button>

        {/* photo indicator dots */}
        {images.length > 1 && (
          <div className="pointer-events-none absolute bottom-[4.5rem] left-1/2 flex -translate-x-1/2 gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}

        {/* price */}
        <div className="absolute bottom-4 left-4 font-serif text-2xl text-white drop-shadow-lg" style={{transform: 'translateZ(55px)'}}>
          {money(property.price, property.currency)}
          {property.priceNegotiable && <span className="ml-2 align-middle text-xs font-sans text-white/60">Negotiable</span>}
        </div>

        {/* reveal CTA */}
        <span className="absolute bottom-4 right-4 inline-flex translate-y-3 items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" style={{transform: 'translateZ(55px)'}}>
          View
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </span>
      </div>

      <div className="p-5">
        <h3 className="truncate text-lg font-medium text-fg transition-colors group-hover:text-gold">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0">{ICON.pin}</svg>
          <span className="truncate">{[property.locality, property.city].filter(Boolean).join(', ') || property.locationText || 'Location on request'}</span>
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-[13px] text-muted">
          {property.bhk != null && <Spec d={ICON.bed}>{property.bhk} BHK</Spec>}
          {property.bathrooms != null && <Spec d={ICON.bath}>{property.bathrooms} Bath</Spec>}
          {area != null && <Spec d={ICON.ruler}>{area} sqft</Spec>}
        </div>
      </div>

      {/* sheen sweep */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </Link>
  );
}
