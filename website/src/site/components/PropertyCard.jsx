import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {gsap} from '../../lib/gsap';

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

export function PropertyCard({property}) {
  const [fav, setFav] = useState(false);
  const cardRef = useRef(null);
  const img = property.imageUrls?.[0] || FALLBACK;

  // interactive 3D tilt that follows the cursor
  const onMove = e => {
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(cardRef.current, {
      rotateY: px * 9,
      rotateX: -py * 9,
      y: -8,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 900,
      transformOrigin: 'center',
    });
  };
  const onLeave = () =>
    gsap.to(cardRef.current, {rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out'});

  return (
    <Link
      ref={cardRef}
      to={`/properties/${property.id}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative block overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-colors duration-500 hover:border-gold/50 hover:shadow-glow [transform-style:preserve-3d] will-change-transform">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={img}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-ink/50 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-gold-light backdrop-blur-md">
          {property.type}
        </span>
        <button
          type="button"
          aria-label="Save"
          onClick={e => {
            e.preventDefault();
            setFav(f => !f);
          }}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink/50 text-sm backdrop-blur-md transition-all hover:scale-110 hover:border-gold">
          <span className={fav ? 'text-gold' : 'text-white/80'}>{fav ? '♥' : '♡'}</span>
        </button>
        <div className="absolute bottom-4 left-4 font-serif text-2xl text-white drop-shadow">
          {money(property.price, property.currency)}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-medium">{property.title}</h3>
        <p className="mt-1 text-sm text-muted">
          {property.locationText || 'Location on request'}
        </p>
        <div className="mt-5 flex gap-6 border-t border-line pt-4 text-[13px] text-muted">
          {property.bedrooms != null && <span>{property.bedrooms} Beds</span>}
          {property.bathrooms != null && <span>{property.bathrooms} Baths</span>}
          {property.areaSqft != null && <span>{property.areaSqft} sqft</span>}
        </div>
      </div>

      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </Link>
  );
}
