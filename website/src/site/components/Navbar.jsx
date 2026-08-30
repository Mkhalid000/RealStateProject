import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {NavLink, Link, useLocation, useNavigate} from 'react-router-dom';
import {MagneticButton} from './MagneticButton';
import {ThemeToggle} from './ThemeToggle';
import {useAuth} from '../../context/AuthContext';
import {useNavHidden} from '../../lib/useNavHidden';
import {apiFetch} from '../../lib/api';
import {CompanyPanel, JournalPanel, PropertiesPanel} from './MegaMenu';
import logo from '../../assets/logo.png';

const DASH_FOR = {admin: '/admin', agent: '/agent'};

/* Hover intent — long enough that skimming the bar doesn't flash panels open,
   short enough that a deliberate hover feels instant. */
const OPEN_DELAY = 90;
const CLOSE_DELAY = 180;

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

/**
 * Top-level bar items. `panel` items open the mega menu; the rest are plain
 * links. Six flat links used to overflow into the logo and the buttons, so the
 * long tail now lives inside the panels.
 */
const MENU = [
  {key: 'properties', label: 'Properties', to: '/properties', panel: 'properties', match: ['/properties', '/map']},
  {key: 'journal', label: 'Journal', to: '/blog', panel: 'journal', match: ['/blog']},
  {key: 'reels', label: 'Reels', to: '/reels', match: ['/reels']},
  {key: 'more', label: 'More', to: '/about', panel: 'company', match: ['/about', '/contact', '/privacy', '/post-property']},
];

const Chevron = ({open}) => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const hidden = useNavHidden();
  const [open, setOpen] = useState(false); // mobile sheet
  const [openPanel, setOpenPanel] = useState(null); // mega menu key
  const [mobileSection, setMobileSection] = useState(null);
  const {pathname} = useLocation();
  const {user, logout} = useAuth();

  // journal panel data, fetched the first time that panel is opened
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const journalLoaded = useRef(false);

  // sliding indicator
  const linkRefs = useRef([]);
  const [ind, setInd] = useState({left: 0, width: 0, opacity: 0});

  const activeIndex = MENU.findIndex(m => m.match.some(p => pathname.startsWith(p)));

  const moveTo = i => {
    const el = linkRefs.current[i];
    if (!el) return;
    setInd({left: el.offsetLeft, width: el.offsetWidth, opacity: 1});
  };
  const rest = useCallback(() => {
    const el = linkRefs.current[activeIndex];
    if (activeIndex >= 0 && el) setInd({left: el.offsetLeft, width: el.offsetWidth, opacity: 1});
    else setInd(s => ({...s, opacity: 0}));
  }, [activeIndex]);

  useLayoutEffect(rest, [rest, pathname, scrolled]);
  useEffect(() => {
    window.addEventListener('resize', rest);
    return () => window.removeEventListener('resize', rest);
  }, [rest]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── mega menu open/close ── */
  const timer = useRef(null);
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const openWith = useCallback((key, i) => {
    clearTimer();
    // switching between items should feel instantaneous
    timer.current = setTimeout(() => setOpenPanel(key), openPanel ? 0 : OPEN_DELAY);
    if (i != null) moveTo(i);
  }, [openPanel]);

  const scheduleClose = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => {
      setOpenPanel(null);
      rest();
    }, CLOSE_DELAY);
  }, [rest]);

  const closeNow = useCallback(() => {
    clearTimer();
    setOpenPanel(null);
    rest();
  }, [rest]);

  useEffect(() => () => clearTimer(), []);

  // the panel must not linger through a route change or while the bar hides
  useEffect(() => { setOpenPanel(null); setOpen(false); setMobileSection(null); }, [pathname]);
  useEffect(() => { if (hidden) setOpenPanel(null); }, [hidden]);

  useEffect(() => {
    if (!openPanel) return;
    const onKey = e => e.key === 'Escape' && closeNow();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openPanel, closeNow]);

  // Journal data is only fetched once, the first time a menu that shows it is
  // opened — the bar itself costs nothing on pages nobody opens the menu on.
  const loadJournal = useCallback(() => {
    if (journalLoaded.current) return;
    journalLoaded.current = true;
    apiFetch('/blog/categories').then(r => setCategories(r.items || [])).catch(() => {});
    apiFetch('/blog?limit=3').then(r => setPosts(r.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (openPanel === 'journal' || open) loadJournal();
  }, [openPanel, open, loadJournal]);

  const panelFor = key => {
    if (key === 'properties') return <PropertiesPanel onNavigate={closeNow} />;
    if (key === 'journal') return <JournalPanel categories={categories} posts={posts} onNavigate={closeNow} />;
    if (key === 'company') return <CompanyPanel onNavigate={closeNow} />;
    return null;
  };

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

      {/* A three-part flex row: brand · nav · actions. The centre nav used to be
          absolutely positioned, which let it slide under the logo and buttons
          on narrower desktops. */}
      <div className="relative mx-auto flex max-w-[1600px] items-center gap-4 px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Aurevia — Home">
          <img src={logo} alt="Aurevia" className="h-9 w-auto lg:h-10" />
        </Link>

        {/* centre floating glass pill */}
        <nav
          onMouseLeave={() => { scheduleClose(); }}
          className="hidden min-w-0 flex-1 justify-center md:flex">
          <div className="relative flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1.5 shadow-soft ring-1 ring-white/10 backdrop-blur-xl">
            <span
              className="absolute top-1/2 h-9 -translate-y-1/2 rounded-full bg-gold/20 ring-1 ring-gold/40 transition-all duration-300 ease-out"
              style={{left: ind.left, width: ind.width, opacity: ind.opacity}}
            />
            {MENU.map((m, i) => {
              const isOpen = openPanel === m.panel && Boolean(m.panel);
              const isActive = m.match.some(p => pathname.startsWith(p));
              const cls = `relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors lg:px-5 ${
                isActive || isOpen ? 'text-gold' : 'text-white/65 hover:text-white'
              }`;

              if (!m.panel) {
                return (
                  <NavLink
                    key={m.key}
                    to={m.to}
                    ref={el => (linkRefs.current[i] = el)}
                    onMouseEnter={() => { closeNow(); moveTo(i); }}
                    className={cls}>
                    {m.label}
                  </NavLink>
                );
              }

              return (
                <button
                  key={m.key}
                  ref={el => (linkRefs.current[i] = el)}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  onMouseEnter={() => openWith(m.panel, i)}
                  onFocus={() => openWith(m.panel, i)}
                  onClick={() => (isOpen ? closeNow() : openWith(m.panel, i))}
                  className={cls}>
                  {m.label}
                  <Chevron open={isOpen} />
                </button>
              );
            })}
          </div>
        </nav>

        {/* right cluster */}
        <div className="hidden shrink-0 items-center gap-2.5 md:flex lg:gap-3">
          <Link
            to="/post-property"
            className="group hidden items-center gap-2 rounded-full border border-gold/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink lg:inline-flex lg:px-5">
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
              className="rounded-full bg-gold px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink shadow-glow transition-colors hover:bg-gold-light lg:px-6">
              Login
            </MagneticButton>
          )}
        </div>

        {/* mobile hamburger */}
        <button
          className="relative z-10 ml-auto flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen(o => !o)}>
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? 'opacity-0' : ''}`} />
          <span className={`h-px w-6 transition ${scrolled || open ? 'bg-fg' : 'bg-white'} ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>

        {/* ── mega panel ── */}
        <div
          onMouseEnter={clearTimer}
          onMouseLeave={scheduleClose}
          className={`absolute left-1/2 top-full z-20 hidden w-[min(1080px,calc(100vw-3rem))] -translate-x-1/2 pt-4 md:block ${
            openPanel ? '' : 'pointer-events-none'
          }`}>
          <div
            className={`origin-top overflow-hidden rounded-3xl border border-line bg-surface/95 shadow-soft backdrop-blur-2xl transition-all duration-300 ease-out ${
              openPanel ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-3 scale-[0.98] opacity-0'
            }`}>
            {panelFor(openPanel)}
          </div>
        </div>
      </div>

      {/* ── mobile menu ── */}
      <div
        className={`glass mx-4 mt-3 overflow-y-auto rounded-2xl md:hidden ${
          open ? 'max-h-[75vh] border border-white/10' : 'max-h-0'
        } transition-all duration-500`}>
        <nav className="flex flex-col px-6 py-2">
          <MobileSection
            title="Properties"
            openKey="properties"
            current={mobileSection}
            onToggle={setMobileSection}
            links={[
              {to: '/properties', label: 'All properties'},
              {to: '/properties?listing=buy', label: 'For sale'},
              {to: '/properties?listing=rent', label: 'For rent'},
              {to: '/properties?featured=true', label: 'Featured'},
              {to: '/map', label: 'Map explorer'},
            ]}
            onNavigate={() => setOpen(false)}
          />
          <MobileSection
            title="Journal"
            openKey="journal"
            current={mobileSection}
            onToggle={setMobileSection}
            links={[
              {to: '/blog', label: 'All articles'},
              {to: '/blog?sort=popular', label: 'Most read'},
              ...categories.slice(0, 4).map(c => ({to: `/blog?category=${c.slug}`, label: c.name})),
            ]}
            onNavigate={() => setOpen(false)}
          />
          <NavLink
            to="/reels"
            onClick={() => setOpen(false)}
            className={({isActive}) =>
              `border-b border-line/40 py-3 text-sm uppercase tracking-[0.14em] ${isActive ? 'text-gold' : 'text-fg/80'}`
            }>
            Reels
          </NavLink>
          <MobileSection
            title="More"
            openKey="company"
            current={mobileSection}
            onToggle={setMobileSection}
            links={[
              {to: '/about', label: 'About'},
              {to: '/contact', label: 'Contact'},
              {to: '/privacy', label: 'Privacy & cookies'},
            ]}
            onNavigate={() => setOpen(false)}
          />

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

/** Accordion group — the phone equivalent of one mega-menu panel. */
function MobileSection({title, openKey, current, onToggle, links, onNavigate}) {
  const open = current === openKey;
  return (
    <div className="border-b border-line/40">
      <button
        type="button"
        onClick={() => onToggle(open ? null : openKey)}
        className={`flex w-full items-center justify-between py-3 text-sm uppercase tracking-[0.14em] ${
          open ? 'text-gold' : 'text-fg/80'
        }`}>
        {title}
        <Chevron open={open} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] pb-2 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {links.map(l => (
            <Link
              key={l.to + l.label}
              to={l.to}
              onClick={onNavigate}
              className="block py-2 pl-3 text-[13px] text-fg/70 transition-colors hover:text-gold">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
