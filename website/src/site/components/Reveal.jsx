import {useEffect, useRef} from 'react';
import {gsap} from '../../lib/gsap';

/**
 * Scroll-triggered entrance. Set `stagger` to animate direct children in
 * sequence (e.g. a grid of cards).
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  y = 40,
  delay = 0,
  duration = 0.9,
  stagger = 0,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const targets = stagger ? el.children : el;
    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        opacity: 0,
        duration,
        delay,
        ease: 'power3.out',
        stagger: stagger ? (typeof stagger === 'number' ? stagger : 0.12) : 0,
        scrollTrigger: {trigger: el, start: 'top 85%', once: true},
      });
    }, el);
    return () => ctx.revert();
  }, [delay, duration, y, stagger]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
