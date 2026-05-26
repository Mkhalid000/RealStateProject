import {useEffect, useRef} from 'react';
import {gsap} from '../../lib/gsap';

/** Counts up to `value` when scrolled into view. */
export function Counter({value, prefix = '', suffix = '', decimals = 0, duration = 2, className = ''}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const obj = {n: 0};
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        n: value,
        duration,
        ease: 'power2.out',
        scrollTrigger: {trigger: el, start: 'top 90%', once: true},
        onUpdate: () => {
          const v =
            decimals > 0
              ? obj.n.toFixed(decimals)
              : Math.round(obj.n).toLocaleString();
          el.textContent = `${prefix}${v}${suffix}`;
        },
      });
    }, el);
    return () => ctx.revert();
  }, [value, decimals, duration, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
