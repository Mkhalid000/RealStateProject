import {useEffect, useRef} from 'react';
import {gsap} from '../../lib/gsap';

/** Cinematic clip-path wipe + slow zoom as the image scrolls into view. */
export function ImageReveal({src, alt, className = '', imgClassName = ''}) {
  const wrap = useRef(null);

  useEffect(() => {
    const el = wrap.current;
    const img = el.querySelector('img');
    const ctx = gsap.context(() => {
      const st = {trigger: el, start: 'top 82%', once: true};
      gsap.fromTo(
        el,
        {clipPath: 'inset(100% 0% 0% 0%)'},
        {clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.out', scrollTrigger: st},
      );
      gsap.fromTo(
        img,
        {scale: 1.35},
        {scale: 1, duration: 1.5, ease: 'power3.out', scrollTrigger: st},
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrap} className={`overflow-hidden ${className}`}>
      <img src={src} alt={alt} className={`h-full w-full object-cover ${imgClassName}`} />
    </div>
  );
}
