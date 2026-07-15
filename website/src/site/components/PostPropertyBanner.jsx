import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {gsap} from '../../lib/gsap';

const DISMISS_KEY = 'rr_post_banner_dismissed';
const SHOW_DELAY = 4200; // let the intro Loader finish its wipe first

const AD_IMG =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=70';

const Svg = ({d, size = 18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const ICON = {
  close: <path d="M18 6 6 18M6 6l12 12" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
};

/** Floating bottom-right advert linking to the free-listing page. */
export function PostPropertyBanner() {
  const {pathname} = useLocation();
  const [visible, setVisible] = useState(false);
  const card = useRef(null);

  // Already on the posting page? The advert would be redundant.
  const suppressed = pathname === '/post-property';

  useEffect(() => {
    if (suppressed || sessionStorage.getItem(DISMISS_KEY)) return;
    let cancelled = false;
    const show = () => !cancelled && setVisible(true);
    const t = setTimeout(() => {
      // Decode the photo first so the card slides in already painted rather
      // than popping the image in mid-animation.
      const img = new Image();
      img.src = AD_IMG;
      img.decode().then(show, show);
    }, SHOW_DELAY);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [suppressed]);

  useEffect(() => {
    if (!visible || !card.current) return;
    const ctx = gsap.context(() => {
      gsap.from(card.current, {
        y: 40,
        opacity: 0,
        scale: 0.9,
        duration: 0.7,
        ease: 'back.out(1.5)',
      });
    }, card);
    return () => ctx.revert();
  }, [visible]);

  function dismiss(e) {
    e.stopPropagation();
    e.preventDefault();
    sessionStorage.setItem(DISMISS_KEY, '1');
    gsap.to(card.current, {
      y: 20,
      opacity: 0,
      scale: 0.9,
      duration: 0.35,
      ease: 'power3.in',
      onComplete: () => setVisible(false),
    });
  }

  const onMove = e => {
    const r = card.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card.current, {
      rotateY: px * 8,
      rotateX: -py * 8,
      y: -6,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 800,
    });
  };
  const onLeave = () =>
    gsap.to(card.current, {rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out'});

  if (!visible || suppressed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[70] w-[min(21rem,calc(100vw-2.5rem))]">
      <Link
        ref={card}
        to="/post-property"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="sheen group relative block h-64 w-full overflow-hidden rounded-2xl border border-gold/30 text-left shadow-soft transition-colors hover:border-gold/70 [transform-style:preserve-3d] will-change-transform">
        {/* the residence itself is the advert */}
        <img
          src={AD_IMG}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
        {/* warm wash that blooms on hover */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <span
          onClick={dismiss}
          role="button"
          tabIndex={0}
          aria-label="Dismiss"
          onKeyDown={e => e.key === 'Enter' && dismiss(e)}
          className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-ink/50 text-white/80 backdrop-blur-md transition-colors hover:bg-ink hover:text-white">
          <Svg d={ICON.close} size={14} />
        </span>

        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ink"
          style={{transform: 'translateZ(45px)'}}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" />
          100% Free
        </span>

        <span className="absolute inset-x-0 bottom-0 block p-5" style={{transform: 'translateZ(55px)'}}>
          <span className="block font-serif text-2xl leading-tight text-white drop-shadow-lg">
            Add your property
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-white/70">
            Reach thousands of verified buyers — live in under a minute.
          </span>

          <span className="mt-4 flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
            Post for free
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              <Svg d={ICON.arrow} size={14} />
            </span>
          </span>
        </span>
      </Link>
    </div>
  );
}
