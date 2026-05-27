import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {NavLink, Link, useLocation} from 'react-router-dom';
import {MagneticButton} from './MagneticButton';
import {ThemeToggle} from './ThemeToggle';

const links = [
  {to: '/', label: 'Home', end: true},
  {to: '/properties', label: 'Properties'},
  {to: '/about', label: 'About'},
  {to: '/contact', label: 'Contact'},
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const {pathname} = useLocation();

  // sliding indicator
  const pillRef = useRef(null);
  const linkRefs = useRef([]);
  const [ind, setInd] = useState({left: 0, width: 0, opacity: 0});

  const activeIndex = links.findIndex(l =>
    l.end ? pathname === l.to : pathname.startsWith(l.to),
  );

  const moveTo = i => {
    const elx = linkRefs.current[i];
    if (!elx) return;
    setInd({left: elx.offsetLeft, width: elx.offsetWidth, opacity: 1});
  };
  const rest = () => {
    if (activeIndex >= 0) moveTo(activeIndex);
    else setInd(s => ({...s, opacity: 0}));
  };

  useLayoutEffect(rest, [pathname, scrolled]);
  useEffect(() => {
    const onResize = () => rest();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 240 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const brandColor = scrolled ? 'text-fg' : 'text-white';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${scrolled ? 'py-3' : 'py-5'}`}>
      {/* readability scrim at top over hero */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-500 ${
          scrolled ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6">
        {/* brand */}
        <Link to="/" className={`font-serif text-2xl tracking-wide transition-colors ${brandColor}`}>
          AU<span className="text-gold">REVIA</span>
        </Link>

        {/* center floating glass pill */}
        <nav
          ref={pillRef}
          onMouseLeave={rest}
          className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-ink/70 px-2 py-1.5 shadow-soft ring-1 ring-white/10 backdrop-blur-xl md:flex">
          {/* sliding highlight */}
          <span
            className="absolute top-1/2 h-9 -translate-y-1/2 rounded-full bg-gold/20 ring-1 ring-gold/40 transition-all duration-300 ease-out"
            style={{left: ind.left, width: ind.width, opacity: ind.opacity}}
          />
          {links.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              ref={el => (linkRefs.current[i] = el)}
              onMouseEnter={() => moveTo(i)}
              className={({isActive}) =>
                `relative z-10 rounded-full px-5 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                  isActive ? 'text-gold' : 'text-white/65 hover:text-white'
                }`
              }>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* right cluster */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <MagneticButton
            to="/login"
            className="rounded-full bg-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink shadow-glow transition-colors hover:bg-gold-light">
            Login
          </MagneticButton>
        </div>

        {/* mobile hamburger */}
        <button
          className="relative z-10 flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen(o => !o)}>
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? 'opacity-0' : ''}`} />
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* mobile menu */}
      <div
        className={`glass mx-4 mt-3 overflow-hidden rounded-2xl md:hidden ${
          open ? 'max-h-96 border border-white/10' : 'max-h-0'
        } transition-all duration-500`}>
        <nav className="flex flex-col px-6 py-2">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({isActive}) =>
                `border-b border-line/40 py-3 text-sm uppercase tracking-[0.14em] ${
                  isActive ? 'text-gold' : 'text-fg/80'
                }`
              }>
              {l.label}
            </NavLink>
          ))}
          <div className="flex items-center justify-between py-4">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
              Login
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
