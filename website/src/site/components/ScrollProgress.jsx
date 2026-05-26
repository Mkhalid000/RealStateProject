import {useEffect, useRef} from 'react';

/** Thin gold progress bar fixed at the very top. */
export function ScrollProgress() {
  const bar = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[55] h-[2px] w-full">
      <div
        ref={bar}
        className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-gold-dark via-gold to-gold-light"
      />
    </div>
  );
}
