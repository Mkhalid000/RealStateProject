import {useEffect, useRef} from 'react';
import {gsap} from '../../lib/gsap';

/** Soft gold glow that trails the cursor (fine-pointer devices only). */
export function CursorGlow() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const xDot = gsap.quickTo(dot.current, 'x', {duration: 0.15, ease: 'power3'});
    const yDot = gsap.quickTo(dot.current, 'y', {duration: 0.15, ease: 'power3'});
    const xRing = gsap.quickTo(ring.current, 'x', {duration: 0.5, ease: 'power3'});
    const yRing = gsap.quickTo(ring.current, 'y', {duration: 0.5, ease: 'power3'});

    const move = e => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };
    const grow = () => gsap.to(ring.current, {scale: 2, opacity: 0.35, duration: 0.3});
    const shrink = () => gsap.to(ring.current, {scale: 1, opacity: 0.6, duration: 0.3});

    window.addEventListener('mousemove', move);
    document.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });

    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <>
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/60 opacity-60 md:block"
        style={{mixBlendMode: 'difference'}}
      />
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold md:block"
      />
    </>
  );
}
