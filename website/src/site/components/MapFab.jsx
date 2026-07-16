import {useEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import {gsap} from '../../lib/gsap';

/** Floating bottom-right button that opens the full-screen map explorer. */
export function MapFab() {
  const btn = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(btn.current, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(2)',
      });
    }, btn);
    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed bottom-10 right-10 z-[70]">
      <Link
        ref={btn}
        to="/map"
        aria-label="Explore properties on map"
        className="group relative grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-surface/95 text-gold shadow-soft backdrop-blur-xl transition-colors hover:border-gold hover:bg-gold hover:text-ink">
        {/* slow halo so the button reads as interactive */}
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full border border-gold/30 [animation-duration:3s]" />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        {/* label slides out on hover */}
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg opacity-0 shadow-card transition-all duration-300 group-hover:opacity-100">
          Explore on map
        </span>
      </Link>
    </div>
  );
}
