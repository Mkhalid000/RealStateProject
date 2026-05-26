import {useEffect, useRef, useState} from 'react';
import {NavLink, Link} from 'react-router-dom';
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

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 200 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // At the top (over the hero) text must stay light & readable.
  const linkBase = scrolled ? 'text-muted hover:text-fg' : 'text-white/80 hover:text-white';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${scrolled ? 'glass border-b border-white/10 py-3' : 'border-b border-transparent py-5'}`}>
      {/* readability scrim only when not scrolled */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-500 ${
          scrolled ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          className={`font-serif text-2xl tracking-wide transition-colors ${
            scrolled ? 'text-fg' : 'text-white'
          }`}>
          AU<span className="text-gold">REVIA</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({isActive}) =>
                `group relative text-xs uppercase tracking-[0.14em] transition-colors ${
                  isActive ? (scrolled ? 'text-fg' : 'text-white') : linkBase
                }`
              }>
              {({isActive}) => (
                <>
                  {l.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
          <ThemeToggle />
          <MagneticButton
            to="/login"
            className="rounded-sm border border-gold px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink">
            Admin Login
          </MagneticButton>
        </nav>

        <button
          className="relative z-10 flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen(o => !o)}>
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? 'opacity-0' : ''}`} />
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>

      <div
        className={`relative overflow-hidden glass md:hidden ${
          open ? 'max-h-96 border-t border-white/10' : 'max-h-0'
        } transition-all duration-500`}>
        <nav className="flex flex-col px-6 py-4">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className="border-b border-line/40 py-3 text-sm uppercase tracking-[0.14em] text-fg/80">
              {l.label}
            </NavLink>
          ))}
          <div className="flex items-center justify-between py-4">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="text-xs uppercase tracking-[0.16em] text-gold">
              Admin Login
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
