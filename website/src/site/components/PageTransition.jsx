import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';
import {gsap} from '../../lib/gsap';

/** Single elegant panel sweep on route change (enters top → exits bottom). */
export function PageTransition() {
  const cover = useRef(null);
  const {pathname} = useLocation();
  const prev = useRef(pathname);

  useEffect(() => {
    // Only run on an actual route change (skips initial mount + StrictMode remount).
    if (prev.current === pathname) return;
    prev.current = pathname;

    const el = cover.current;
    gsap
      .timeline()
      .set(el, {display: 'flex', yPercent: -100})
      .to(el, {yPercent: 0, duration: 0.45, ease: 'power3.inOut'})
      .to(el, {yPercent: 100, duration: 0.45, ease: 'power3.inOut'}, '+=0.04')
      .set(el, {display: 'none', yPercent: -100});
  }, [pathname]);

  return (
    <div
      ref={cover}
      style={{display: 'none'}}
      className="fixed inset-0 z-[80] items-center justify-center bg-ink">
      <span className="font-serif text-4xl tracking-wide text-white/90">
        AU<span className="text-gold">REVIA</span>
      </span>
    </div>
  );
}
