import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {gsap} from '../../lib/gsap';

/**
 * Magnetic element: gently follows the cursor on hover.
 * Renders a <Link> when `to` is given, an <a> for `href`, else a <button>.
 */
export function MagneticButton({children, to, href, onClick, className = '', strength = 0.4}) {
  const ref = useRef(null);

  const onMove = e => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    gsap.to(el, {x, y, duration: 0.4, ease: 'power3.out'});
  };
  const onLeave = () => gsap.to(ref.current, {x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)'});

  const shared = {
    ref,
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    onClick,
    className: `inline-flex items-center justify-center will-change-transform ${className}`,
  };

  if (to) return <Link to={to} {...shared}>{children}</Link>;
  if (href) return <a href={href} {...shared}>{children}</a>;
  return <button type="button" {...shared}>{children}</button>;
}
