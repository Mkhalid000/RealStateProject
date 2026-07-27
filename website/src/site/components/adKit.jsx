import {useEffect, useMemo, useRef, useState} from 'react';
import {apiFetch} from '../../lib/api';

/**
 * Shared plumbing for every ad surface: fetching, viewability-gated impression
 * tracking, click beacons, accent theming and the countdown.
 */

const IMPRESSION_RATIO = 0.5;
const IMPRESSION_MS = 1000;
const DEFAULT_ACCENT = '#f2a65a';

export function device() {
  return typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop';
}

/** Beacons must never break the page, so failures are swallowed. */
export function beacon(id, slot, kind) {
  apiFetch(`/ads/${id}/${kind}`, {method: 'POST', body: JSON.stringify({slot})}).catch(() => {});
}

/** Fetch the ad(s) booked into a slot. Returns [] until they arrive. */
export function useAds({slot, city, type, listingType, limit = 1, enabled = true, onLoaded}) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const sp = new URLSearchParams({slot, device: device(), limit: String(limit)});
    if (city) sp.set('city', city);
    if (type) sp.set('type', type);
    if (listingType) sp.set('listingType', listingType);

    const settle = items => {
      if (!alive) return;
      setAds(items);
      onLoaded?.(items.length);
    };

    apiFetch(`/ads/serve?${sp.toString()}`)
      .then(r => settle(r.items || []))
      .catch(() => settle([]));
    return () => { alive = false; };
    // onLoaded is intentionally excluded — callers pass inline callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, city, type, listingType, limit, enabled]);

  return ads;
}

/**
 * Counts an impression once the node has been at least half visible for a full
 * second, so a fast scroll past doesn't inflate a campaign's numbers.
 */
export function useImpression(ref, ads, slot) {
  const seen = useRef(new Set());

  useEffect(() => {
    const el = ref.current;
    if (!el || !ads.length) return;

    const timers = new Map();
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const id = entry.target.dataset.adId;
          if (!id || seen.current.has(id)) continue;

          if (entry.isIntersecting) {
            if (!timers.has(id)) {
              timers.set(id, setTimeout(() => {
                seen.current.add(id);
                beacon(id, slot, 'impression');
                timers.delete(id);
              }, IMPRESSION_MS));
            }
          } else {
            clearTimeout(timers.get(id));
            timers.delete(id);
          }
        }
      },
      {threshold: IMPRESSION_RATIO},
    );

    el.querySelectorAll('[data-ad-id]').forEach(node => io.observe(node));
    return () => {
      timers.forEach(clearTimeout);
      io.disconnect();
    };
  }, [ref, ads, slot]);
}

/** CSS custom properties so a campaign can tint its own unit. */
export function accentVars(ad) {
  const accent = ad?.accent || DEFAULT_ACCENT;
  return {'--ad-accent': accent, '--ad-accent-soft': `${accent}26`};
}

/* ── shared bits of chrome ─────────────────────────────────────────── */

export const Sponsored = ({className = ''}) => (
  <span
    className={`rounded-full border border-white/15 bg-ink/60 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-md ${className}`}>
    Sponsored
  </span>
);

export const Arrow = ({size = 13}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export const Close = ({size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/** Call-to-action pill, tinted by the campaign accent. */
export const Cta = ({children, className = ''}) => (
  <span
    style={{backgroundColor: 'var(--ad-accent)'}}
    className={`inline-flex w-fit items-center gap-2 rounded-full px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-transform duration-300 group-hover:scale-[1.04] ${className}`}>
    {children}
    <Arrow />
  </span>
);

/** Live "ends in 2d 04h 11m" ticker — a strong urgency cue on limited offers. */
export function Countdown({to, className = ''}) {
  const target = useMemo(() => new Date(to).getTime(), [to]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = target - now;
  if (!Number.isFinite(target) || left <= 0) return null;

  const days = Math.floor(left / 86400000);
  const hours = Math.floor((left % 86400000) / 3600000);
  const mins = Math.floor((left % 3600000) / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  const parts = days > 0 ? [[days, 'd'], [hours, 'h'], [mins, 'm']] : [[hours, 'h'], [mins, 'm'], [secs, 's']];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">Ends in</span>
      {parts.map(([value, unit]) => (
        <span
          key={unit}
          style={{borderColor: 'var(--ad-accent)'}}
          className="rounded-md border bg-ink/50 px-1.5 py-1 font-mono text-[12px] font-bold text-white tabular-nums backdrop-blur-md">
          {String(value).padStart(2, '0')}
          <span className="ml-0.5 text-[9px] font-normal text-white/50">{unit}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Cursor-following spotlight. Purely decorative, and cheap: it only writes two
 * CSS variables on pointer move rather than re-rendering.
 */
export function useSpotlight() {
  const ref = useRef(null);
  const onMouseMove = e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ad-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--ad-y', `${e.clientY - r.top}px`);
  };
  return {ref, onMouseMove};
}
