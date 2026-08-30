import {useCallback, useRef} from 'react';
import {Link} from 'react-router-dom';
import {PropertyCard} from './PropertyCard';
import {
  accentVars,
  Arrow,
  beacon,
  Countdown,
  Cta,
  Sponsored,
  useAds,
  useImpression,
  useSpotlight,
} from './adKit';

/**
 * Renders an admin-booked ad for one in-page slot, or nothing at all when no
 * campaign is eligible — every caller can drop it in without guarding.
 *
 * The interrupting placements (modal, floating) live in their own components;
 * this one only handles units that sit in the document flow.
 */
export function AdSlot({
  slot,
  variant = 'card',
  city,
  type,
  listingType,
  blogCategory,
  tags,
  limit = 1,
  className = '',
  onLoaded,
}) {
  const ref = useRef(null);
  const ads = useAds({slot, city, type, listingType, blogCategory, tags, limit, onLoaded});
  useImpression(ref, ads, slot);

  const onClick = useCallback(id => beacon(id, slot, 'click'), [slot]);

  if (!ads.length) return null;

  return (
    <div ref={ref} className={className}>
      {ads.map(ad => (
        <AdUnit key={ad.id} ad={ad} variant={variant} onClick={() => onClick(ad.id)} />
      ))}
    </div>
  );
}

function AdUnit({ad, variant, onClick}) {
  // A sponsored listing is just a property card wearing a "Sponsored" label —
  // it should feel native to whatever grid it lands in.
  if (ad.kind === 'sponsored' && ad.property) {
    if (variant === 'rail') return <SponsoredRail ad={ad} onClick={onClick} />;
    if (variant === 'strip') return <SponsoredStrip ad={ad} onClick={onClick} />;
    return (
      <div data-ad-id={ad.id} onClick={onClick} style={accentVars(ad)} className="relative">
        <PropertyCard property={ad.property} />
        <Sponsored className="pointer-events-none absolute right-4 top-16 z-10" />
      </div>
    );
  }

  if (variant === 'rail') return <HouseRail ad={ad} onClick={onClick} />;
  if (variant === 'strip') return <HouseStrip ad={ad} onClick={onClick} />;
  return <HouseCard ad={ad} onClick={onClick} />;
}

/** Wraps an ad in the right element: internal route, external link, or plain. */
export function AdLink({ad, onClick, className, style, children, onMouseMove, innerRef}) {
  const url = ad.ctaUrl;
  const common = {
    'data-ad-id': ad.id,
    onClick,
    className,
    style: {...accentVars(ad), ...style},
    onMouseMove,
    ref: innerRef,
  };

  if (!url) return <div {...common}>{children}</div>;
  if (url.startsWith('/')) return <Link to={url} {...common}>{children}</Link>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer sponsored" {...common}>
      {children}
    </a>
  );
}

/* ── compact vertical unit for sidebars ── */
function HouseRail({ad, onClick}) {
  const {ref, onMouseMove} = useSpotlight();
  return (
    <AdLink
      ad={ad}
      onClick={onClick}
      innerRef={ref}
      onMouseMove={onMouseMove}
      className="ad-spotlight group relative block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-colors hover:border-[color:var(--ad-accent)]">
      {ad.imageUrl && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={ad.imageUrl} alt={ad.headline || ''} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
          <Sponsored className="absolute left-3 top-3" />
          {ad.countdownTo && <Countdown to={ad.countdownTo} className="absolute bottom-3 left-3" />}
        </div>
      )}
      <div className="p-4">
        {!ad.imageUrl && <Sponsored className="mb-3 inline-block" />}
        {ad.headline && <p className="font-serif text-lg leading-tight text-fg">{ad.headline}</p>}
        {ad.body && <p className="mt-1.5 line-clamp-3 text-[13px] text-muted">{ad.body}</p>}
        {ad.ctaLabel && (
          <span style={{color: 'var(--ad-accent)'}} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-transform duration-300 group-hover:translate-x-1">
            {ad.ctaLabel}
            <Arrow size={12} />
          </span>
        )}
      </div>
    </AdLink>
  );
}

/* ── sponsored listing, compact, for sidebars ── */
function SponsoredRail({ad, onClick}) {
  const p = ad.property;
  const img = p.imageUrls?.[0];
  return (
    <Link
      to={`/properties/${p.id}/${p.slug}`}
      data-ad-id={ad.id}
      onClick={onClick}
      style={accentVars(ad)}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-colors hover:border-[color:var(--ad-accent)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        {img && <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
        <Sponsored className="absolute left-3 top-3" />
        <p className="absolute bottom-3 left-3 font-serif text-xl text-white drop-shadow">{money(p)}</p>
      </div>
      <div className="p-4">
        <p className="truncate font-medium text-fg transition-colors group-hover:text-[color:var(--ad-accent)]">{p.title}</p>
        <p className="mt-1 truncate text-[13px] text-muted">
          {[p.locality, p.city].filter(Boolean).join(', ') || 'Location on request'}
        </p>
      </div>
    </Link>
  );
}

/* ── card unit, sits inside a property grid ── */
function HouseCard({ad, onClick}) {
  const {ref, onMouseMove} = useSpotlight();
  return (
    <AdLink
      ad={ad}
      onClick={onClick}
      innerRef={ref}
      onMouseMove={onMouseMove}
      className="ad-spotlight ad-glow group relative block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-colors hover:border-[color:var(--ad-accent)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        {ad.imageUrl && (
          <img src={ad.imageUrl} alt={ad.headline || ''} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
        <Sponsored className="absolute left-4 top-4" />
        {ad.countdownTo && <Countdown to={ad.countdownTo} className="absolute right-4 top-4" />}
        {ad.headline && (
          <p className="absolute bottom-4 left-4 right-4 font-serif text-2xl leading-tight text-white drop-shadow-lg">
            {ad.headline}
          </p>
        )}
      </div>
      <div className="p-5">
        {ad.body && <p className="line-clamp-2 text-sm text-muted">{ad.body}</p>}
        {ad.ctaLabel && <Cta className="mt-4">{ad.ctaLabel}</Cta>}
      </div>
    </AdLink>
  );
}

/* ── full-width editorial strip ── */
function HouseStrip({ad, onClick}) {
  const {ref, onMouseMove} = useSpotlight();
  return (
    <AdLink
      ad={ad}
      onClick={onClick}
      innerRef={ref}
      onMouseMove={onMouseMove}
      className="ad-spotlight ad-glow group relative block overflow-hidden rounded-2xl border border-line shadow-card transition-colors hover:border-[color:var(--ad-accent)]">
      <div className="relative min-h-[220px] md:min-h-[280px]">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={ad.headline || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-surface2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-center gap-3 p-8 md:p-12">
          <span className="flex flex-wrap items-center gap-3">
            <Sponsored />
            {ad.countdownTo && <Countdown to={ad.countdownTo} />}
          </span>
          {ad.headline && (
            <h3 className="max-w-xl font-serif text-3xl leading-tight text-white md:text-4xl">{ad.headline}</h3>
          )}
          {ad.body && <p className="max-w-lg text-sm text-white/70">{ad.body}</p>}
          {ad.ctaLabel && <Cta className="mt-2">{ad.ctaLabel}</Cta>}
        </div>
      </div>
    </AdLink>
  );
}

/* ── sponsored listing rendered as a wide strip (list view / bottom slot) ── */
function SponsoredStrip({ad, onClick}) {
  const p = ad.property;
  const img = p.imageUrls?.[0];
  const area = p.carpetArea ?? p.superBuiltUpArea;
  return (
    <Link
      to={`/properties/${p.id}/${p.slug}`}
      data-ad-id={ad.id}
      onClick={onClick}
      style={accentVars(ad)}
      className="ad-glow group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-colors hover:border-[color:var(--ad-accent)] sm:flex-row">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-80">
        {img && <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
        <Sponsored className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col justify-center p-6">
        <p className="font-serif text-2xl text-fg transition-colors group-hover:text-[color:var(--ad-accent)]">{p.title}</p>
        <p className="mt-1.5 text-sm text-muted">
          {[p.locality, p.city, p.state].filter(Boolean).join(', ') || 'Location on request'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
          {p.bhk != null && <span>{p.bhk} BHK</span>}
          {p.bathrooms != null && <span>{p.bathrooms} Bath</span>}
          {area != null && <span>{area} sqft</span>}
          <span className="ml-auto font-serif text-2xl" style={{color: 'var(--ad-accent)'}}>{money(p)}</span>
        </div>
        {ad.ctaLabel && <Cta className="mt-5">{ad.ctaLabel}</Cta>}
      </div>
    </Link>
  );
}

const money = p =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: p.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(p.price) || 0);
