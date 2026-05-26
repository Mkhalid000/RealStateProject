import {useEffect, useRef, useState} from 'react';
import {gsap} from '../../lib/gsap';

/** Cinematic intro overlay that wipes away once the app is ready. */
export function Loader() {
  const root = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      '.loader-word',
      {y: 40, opacity: 0},
      {y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08},
    )
      .to('.loader-bar', {scaleX: 1, duration: 1, ease: 'power2.inOut'}, '-=0.4')
      .to('.loader-word', {y: -30, opacity: 0, duration: 0.5, ease: 'power3.in', stagger: 0.05}, '+=0.1')
      .to(root.current, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power4.inOut',
        onComplete: () => setDone(true),
      });
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink">
      <div className="overflow-hidden">
        <h1 className="loader-word font-serif text-5xl tracking-wide text-white md:text-7xl">
          AU<span className="text-gold">REVIA</span>
        </h1>
      </div>
      <div className="mt-8 h-px w-48 overflow-hidden bg-white/10">
        <div className="loader-bar h-full w-full origin-left scale-x-0 bg-gold" />
      </div>
    </div>
  );
}
