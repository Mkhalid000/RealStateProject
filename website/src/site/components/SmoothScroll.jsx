import {useEffect} from 'react';
import Lenis from 'lenis';
import {gsap, ScrollTrigger} from '../../lib/gsap';

/** Global Lenis smooth scrolling, synced to the GSAP ticker + ScrollTrigger. */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const raf = time => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // expose for instant scroll-to-top on route change
    window.__lenis = lenis;

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return null;
}
