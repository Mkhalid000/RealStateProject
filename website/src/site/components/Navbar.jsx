import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {NavLink, Link, useLocation, useNavigate} from 'react-router-dom';
import {MagneticButton} from './MagneticButton';
import {ThemeToggle} from './ThemeToggle';
import {useAuth} from '../../context/AuthContext';
import {useNavHidden} from '../../lib/useNavHidden';
import logo from '../../assets/logo.png';

const DASH_FOR = {admin: '/admin', agent: '/agent'};

function ProfileMenu({user, onLogout, dark}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const initial = (user.fullName || user.email || 'U').charAt(0).toUpperCase();
  const dashTo = DASH_FOR[user.role];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Account"
        className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ring-1 transition ${
          dark ? 'bg-white/10 text-white ring-white/20 hover:bg-white/20' : 'bg-ink/5 text-ink ring-ink/15 hover:bg-ink/10'
        }`}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-ink">
          {initial}
        </span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-black/10 bg-white p-1.5 text-ink shadow-2xl">
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-sm font-bold text-ink">{initial}</span>
            <span className="overflow-hidden">
              <span className="block truncate text-sm font-semibold text-ink">{user.fullName || 'Account'}</span>
              <span className="block truncate text-xs text-ink/50">{user.email}</span>
            </span>
          </div>
          <div className="my-1 h-px bg-black/5" />

          {dashTo && (
            <button onClick={() => navigate(dashTo)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              {user.role === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
            </button>
          )}
          {!dashTo && (
            <button onClick={() => navigate('/account/properties')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
              My Properties
            </button>
          )}
          <button onClick={() => navigate('/properties')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>
            Browse Properties
          </button>

          <div className="my-1 h-px bg-black/5" />
          <button onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-danger transition hover:bg-danger/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const links = [
  {to: '/', label: 'Home', end: true},
  {to: '/properties', label: 'Properties'},
  {to: '/reels', label: 'Reels'},
  {to: '/about', label: 'About'},
  {to: '/contact', label: 'Contact'},
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const hidden = useNavHidden();
  const [open, setOpen] = useState(false);
  const {pathname} = useLocation();
  const {user, logout} = useAuth();

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
    const onScroll = () => setScrolled(window.scrollY > 40);
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

      <div className="relative mx-auto flex items-center justify-between px-8">
        {/* brand */}
        <Link to="/" className="flex items-center" aria-label="Aurevia — Home">
          <img src={logo} alt="Aurevia" className="h-10 w-auto md:h-10" />
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
          <Link
            to="/post-property"
            className="group inline-flex items-center gap-2 rounded-full border border-gold/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink">
            Post Property
            <span className="rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold text-ink transition-colors group-hover:bg-ink group-hover:text-gold">
              FREE
            </span>
          </Link>
          <ThemeToggle />
          {user ? (
            <ProfileMenu user={user} onLogout={logout} dark={!scrolled} />
          ) : (
            <MagneticButton
              to="/login"
              className="rounded-full bg-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink shadow-glow transition-colors hover:bg-gold-light">
              Login
            </MagneticButton>
          )}
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
          <Link
            to="/post-property"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-b border-line/40 py-3 text-sm uppercase tracking-[0.14em] text-gold">
            Post Property
            <span className="rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold text-ink">FREE</span>
          </Link>
          {user ? (
            <div className="py-3">
              <div className="flex items-center gap-3 border-b border-line/40 pb-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-sm font-bold text-ink">
                  {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="overflow-hidden">
                  <span className="block truncate text-sm font-semibold text-fg">{user.fullName || 'Account'}</span>
                  <span className="block truncate text-xs text-fg/50">{user.email}</span>
                </span>
              </div>
              {DASH_FOR[user.role] ? (
                <Link to={DASH_FOR[user.role]} onClick={() => setOpen(false)} className="block py-3 text-sm uppercase tracking-[0.14em] text-fg/80">
                  {user.role === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
                </Link>
              ) : (
                <Link to="/account/properties" onClick={() => setOpen(false)} className="block py-3 text-sm uppercase tracking-[0.14em] text-fg/80">
                  My Properties
                </Link>
              )}
              <div className="flex items-center justify-between py-3">
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="rounded-full border border-danger/40 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-danger">
                  Sign out
                </button>
                <ThemeToggle />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-4">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-full bg-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
                Login
              </Link>
              <ThemeToggle />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
