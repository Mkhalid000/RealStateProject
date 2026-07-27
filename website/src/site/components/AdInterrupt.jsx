import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {
  accentVars,
  beacon,
  Close,
  Countdown,
  Cta,
  Sponsored,
  useAds,
  useSpotlight,
} from './adKit';

/**
 * The two interrupting placements: a centre modal and a floating corner card.
 *
 * Both are deliberately conservative about *when* they appear. An ad that
 * ambushes someone the moment a page loads reads as spam on a site like this,
 * so a campaign chooses its own trigger (a delay, a scroll depth, or exit
 * intent) and how often one person may see it again. That state lives in
 * session/local storage keyed per campaign, so a dismissal actually sticks.
 */

const SEEN_PREFIX = 'rr_ad_seen_';

/** Has this viewer already used up their allowance for this campaign? */
function isSuppressed(ad) {
  if (!ad || ad.frequency === 'always') return false;
  const key = SEEN_PREFIX + ad.id;
  try {
    if (ad.frequency === 'session') return sessionStorage.getItem(key) === '1';
    // daily
    const until = Number(localStorage.getItem(key) || 0);
    return Date.now() < until;
  } catch {
    return false; // private mode — just show it
  }
}

function markSeen(ad) {
  if (!ad || ad.frequency === 'always') return;
  const key = SEEN_PREFIX + ad.id;
  try {
    if (ad.frequency === 'session') sessionStorage.setItem(key, '1');
    else localStorage.setItem(key, String(Date.now() + 86400000));
  } catch {
    /* storage unavailable — nothing to remember it with */
  }
}

/**
 * Resolves a campaign's trigger into a single "now" boolean.
 * Returns false until the condition is met.
 */
function useTrigger(ad) {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!ad || fired) return;
    const trigger = ad.trigger || 'delay';

    if (trigger === 'immediate') {
      setFired(true);
      return;
    }

    if (trigger === 'delay') {
      const ms = Math.max(0, (ad.triggerValue ?? 8) * 1000);
      const t = setTimeout(() => setFired(true), ms);
      return () => clearTimeout(t);
    }

    if (trigger === 'scroll') {
      const target = Math.min(100, Math.max(1, ad.triggerValue ?? 40));
      const onScroll = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 100;
        if (pct >= target) setFired(true);
      };
      window.addEventListener('scroll', onScroll, {passive: true});
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }

    // exit_intent — pointer leaving through the top of the viewport
    const onLeave = e => { if (e.clientY <= 0) setFired(true); };
    document.addEventListener('mouseout', onLeave);
    // touch devices never fire exit intent, so fall back to a generous delay
    const fallback = setTimeout(() => setFired(true), 45000);
    return () => {
      document.removeEventListener('mouseout', onLeave);
      clearTimeout(fallback);
    };
  }, [ad, fired]);

  return fired;
}

/** Shared lifecycle for both interrupting units. */
function useInterrupt(slot) {
  const {pathname} = useLocation();
  const ads = useAds({slot});
  const ad = ads[0] || null;

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const counted = useRef(false);
  const allowed = ad && !isSuppressed(ad);
  const fired = useTrigger(allowed ? ad : null);

  // a route change resets the unit so it can re-evaluate on the next page
  useEffect(() => { setOpen(false); setClosing(false); counted.current = false; }, [pathname]);

  useEffect(() => {
    if (!fired || !allowed) return;
    setOpen(true);
    if (!counted.current) {
      counted.current = true;
      beacon(ad.id, slot, 'impression');
      markSeen(ad);
    }
  }, [fired, allowed, ad, slot]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 220);
  }, []);

  const click = useCallback(() => { if (ad) beacon(ad.id, slot, 'click'); }, [ad, slot]);

  return {ad, open, closing, close, click};
}

/** Destination for the CTA, handling internal vs external vs sponsored. */
function target(ad) {
  if (ad.kind === 'sponsored' && ad.property) {
    return {to: `/properties/${ad.property.id}/${ad.property.slug}`, external: false};
  }
  if (!ad.ctaUrl) return null;
  return {to: ad.ctaUrl, external: !ad.ctaUrl.startsWith('/')};
}

function ActionButton({ad, onClick, label, className = ''}) {
  const t = target(ad);
  if (!t) return null;
  if (t.external) {
    return (
      <a href={t.to} target="_blank" rel="noopener noreferrer sponsored" onClick={onClick} className={`group ${className}`}>
        <Cta>{label}</Cta>
      </a>
    );
  }
  return (
    <Link to={t.to} onClick={onClick} className={`group ${className}`}>
      <Cta>{label}</Cta>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Centre modal
   ══════════════════════════════════════════════════════════════════ */
export function AdModal() {
  const {ad, open, closing, close, click} = useInterrupt('global_modal');
  const {ref, onMouseMove} = useSpotlight();

  // Escape closes it, and the page behind must not scroll underneath
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape' && ad?.dismissible !== false) close(); };
    document.addEventListener('keydown', onKey);
    window.__lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.__lenis?.start();
      document.body.style.overflow = prev;
    };
  }, [open, close, ad]);

  if (!open || !ad) return null;

  const p = ad.kind === 'sponsored' ? ad.property : null;
  const image = p?.imageUrls?.[0] || ad.imageUrl;
  const headline = p?.title || ad.headline;
  const body = p
    ? [p.locality, p.city, p.state].filter(Boolean).join(', ')
    : ad.body;

  return (
    <div
      className={`fixed inset-0 z-[85] grid place-items-center p-4 ${closing ? 'ad-fade-out' : 'ad-fade-in'}`}
      role="dialog"
      aria-modal="true"
      aria-label={headline || 'Sponsored message'}>
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-md"
        onClick={() => ad.dismissible !== false && close()}
      />

      <div
        ref={ref}
        onMouseMove={onMouseMove}
        style={accentVars(ad)}
        className={`ad-spotlight ad-modal-border group relative w-full max-w-3xl overflow-hidden rounded-3xl bg-surface shadow-soft ${
          closing ? 'ad-modal-out' : 'ad-modal-in'
        }`}>
        <div className="grid md:grid-cols-2">
          {/* visual */}
          <div className="relative min-h-[220px] md:min-h-[380px]">
            {image ? (
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-surface2" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent md:bg-gradient-to-r md:from-transparent md:to-ink/40" />
            <Sponsored className="absolute left-4 top-4" />
            {p && (
              <p className="absolute bottom-4 left-4 font-serif text-3xl text-white drop-shadow-lg">
                {new Intl.NumberFormat('en-US', {style: 'currency', currency: p.currency || 'USD', maximumFractionDigits: 0}).format(Number(p.price) || 0)}
              </p>
            )}
          </div>

          {/* copy */}
          <div className="flex flex-col justify-center gap-4 p-8 md:p-10">
            {ad.countdownTo && <Countdown to={ad.countdownTo} />}
            {headline && <h2 className="font-serif text-3xl leading-tight text-fg md:text-4xl">{headline}</h2>}
            {body && <p className="text-sm leading-relaxed text-muted">{body}</p>}
            {p && (
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
                {p.bhk != null && <span>{p.bhk} BHK</span>}
                {p.bathrooms != null && <span>{p.bathrooms} Bath</span>}
                {(p.carpetArea ?? p.superBuiltUpArea) != null && <span>{p.carpetArea ?? p.superBuiltUpArea} sqft</span>}
              </div>
            )}
            <ActionButton ad={ad} onClick={click} label={ad.ctaLabel || (p ? 'View residence' : 'Find out more')} className="mt-2" />
            {ad.dismissible !== false && (
              <button onClick={close} className="mt-1 w-fit text-[11px] uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-fg hover:underline">
                No thanks
              </button>
            )}
          </div>
        </div>

        {ad.dismissible !== false && (
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink/50 text-white/80 backdrop-blur-md transition-colors hover:bg-ink hover:text-white">
            <Close size={17} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Floating corner card — bottom-LEFT, because the post-property advert
   and the map button already own the bottom-right corner.
   ══════════════════════════════════════════════════════════════════ */
export function AdFloating() {
  const {ad, open, closing, close, click} = useInterrupt('global_floating');
  const [collapsed, setCollapsed] = useState(false);

  if (!open || !ad) return null;

  const p = ad.kind === 'sponsored' ? ad.property : null;
  const image = p?.imageUrls?.[0] || ad.imageUrl;
  const headline = p?.title || ad.headline;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={accentVars(ad)}
        aria-label="Reopen sponsored message"
        className="fixed bottom-5 left-5 z-[68] grid h-12 w-12 place-items-center rounded-full border border-white/15 shadow-soft transition-transform hover:scale-110"
        >
        <span className="absolute inset-0 rounded-full" style={{backgroundColor: 'var(--ad-accent)'}} />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#211d1d" strokeWidth="2" strokeLinecap="round" className="relative">
          <path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={accentVars(ad)}
      className={`fixed bottom-5 left-5 z-[68] w-[min(20rem,calc(100vw-2.5rem))] ${closing ? 'ad-slide-out' : 'ad-slide-in'}`}>
      <div className="ad-glow group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
        {image && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
            <Sponsored className="absolute left-3 top-3" />
            {ad.countdownTo && <Countdown to={ad.countdownTo} className="absolute bottom-3 left-3" />}
          </div>
        )}

        <div className="p-4">
          {!image && <Sponsored className="mb-2.5 inline-block" />}
          {headline && <p className="font-serif text-lg leading-tight text-fg">{headline}</p>}
          {(p ? [p.locality, p.city].filter(Boolean).join(', ') : ad.body) && (
            <p className="mt-1 line-clamp-2 text-[13px] text-muted">
              {p ? [p.locality, p.city].filter(Boolean).join(', ') : ad.body}
            </p>
          )}
          <ActionButton ad={ad} onClick={click} label={ad.ctaLabel || (p ? 'View' : 'Learn more')} className="mt-3 block" />
        </div>

        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Minimise"
            className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-ink/50 text-white/80 backdrop-blur-md transition-colors hover:bg-ink hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
          {ad.dismissible !== false && (
            <button
              onClick={close}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-ink/50 text-white/80 backdrop-blur-md transition-colors hover:bg-ink hover:text-white">
              <Close size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
