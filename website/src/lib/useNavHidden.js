import {useEffect, useRef, useState} from 'react';

/** Scrolling down past this point starts hiding the navbar. */
export const NAV_HIDE_AFTER = 240;

/**
 * True while the site navbar is slid out of view (scrolling down past
 * NAV_HIDE_AFTER). Shared by the Navbar itself and by sticky page chrome that
 * wants to reclaim the space the navbar leaves behind.
 */
export function useNavHidden() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > NAV_HIDE_AFTER && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return hidden;
}
