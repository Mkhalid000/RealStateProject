import {useEffect, useRef, useState} from 'react';
import {NavLink, Outlet, useNavigate, useLocation, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

const LINKS = [
  {
    to: '/admin',
    label: 'Overview',
    end: true,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    to: '/admin/users',
    label: 'Users & Agents',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="19" cy="8" r="3"/><path d="M22 20a5 5 0 0 0-5-5"/></svg>,
  },
  {
    to: '/admin/properties',
    label: 'Properties',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>,
  },
  {
    to: '/admin/reels',
    label: 'Reels',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>,
  },
  {
    to: '/admin/boosts',
    label: 'Boosts',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>,
  },
];

/* route → page title */
function pageTitle(pathname) {
  if (pathname === '/admin') return {title: 'Dashboard', sub: 'Welcome back, here is what is happening today'};
  if (pathname.startsWith('/admin/users')) return {title: 'Users & Agents', sub: 'Manage platform members and agents'};
  if (pathname.includes('/properties/new')) return {title: 'Add Property', sub: 'Create a new property listing'};
  if (pathname.includes('/properties/') && pathname.includes('/edit')) return {title: 'Edit Property', sub: 'Update an existing listing'};
  if (pathname.startsWith('/admin/properties')) return {title: 'Properties', sub: 'Manage all property listings'};
  if (pathname.startsWith('/admin/reels')) return {title: 'Reels', sub: 'Manage property video reels'};
  if (pathname.startsWith('/admin/boosts')) return {title: 'Boosts', sub: 'Track promotions and revenue'};
  return {title: 'Dashboard', sub: ''};
}

/* sample notifications (UI) */
const NOTES = [
  {id: 1, icon: 'home', color: '#f2a65a', title: 'New property pending review', time: '12 min ago'},
  {id: 2, icon: 'user', color: '#8b5cf6', title: 'Arjun Mehta joined as an agent', time: '1 hour ago'},
  {id: 3, icon: 'zap', color: '#10b981', title: 'A reel boost was activated', time: '3 hours ago'},
];

const NOTE_ICON = {
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></>,
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>,
};

/* dropdown wrapper with click-outside */
function Dropdown({trigger, children, align = 'right', width = 230}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} style={{position: 'relative'}}>
      <div onClick={() => setOpen(o => !o)}>{trigger(open)}</div>
      {open && (
        <div className="dropdown" style={{[align]: 0, minWidth: width}} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const {logout, user} = useAuth();
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const [leadsOpen, setLeadsOpen] = useState(pathname.startsWith('/admin/leads'));

  function onLogout() {
    logout();
    navigate('/login');
  }

  const initial = (user?.fullName || 'A').charAt(0).toUpperCase();
  const name = user?.fullName || 'Admin';
  const email = user?.email || 'admin@realreels.app';
  const {title, sub} = pageTitle(pathname);

  return (
    <div className="admin">
      {/* ── Sidebar ── */}
      <aside className="admin-side">
        <Link to="/" className="brand">
          AU<b>REVIA</b>
          <span style={{fontSize: 9, display: 'block', color: '#a0a3b1', letterSpacing: '0.18em', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', marginTop: 1}}>Admin Console</span>
        </Link>

        <div className="nav-section">Navigation</div>

        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.icon}
            {l.label}
          </NavLink>
        ))}

        {/* Leads group (Website / Mobile) */}
        <button
          type="button"
          onClick={() => setLeadsOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%',
            padding: '10px 14px', marginBottom: 2, borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500,
            background: pathname.startsWith('/admin/leads') ? 'linear-gradient(135deg, rgba(242,166,90,0.12), rgba(242,166,90,0.06))' : 'transparent',
            color: pathname.startsWith('/admin/leads') ? '#d98a3e' : '#636274',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13a2 2 0 0 1 1.8 1.2L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l1.7-5.8A2 2 0 0 1 5.5 5z" /></svg>
          Leads
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: 'auto', transform: leadsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s'}}><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {leadsOpen && (
          <div style={{marginBottom: 2}}>
            <NavLink to="/admin/leads/website" style={{paddingLeft: 40, fontSize: 13}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></svg>
              Website
            </NavLink>
            <NavLink to="/admin/leads/mobile" style={{paddingLeft: 40, fontSize: 13}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
              Mobile
            </NavLink>
          </div>
        )}

        <div style={{flex: 1}} />

        {/* Quick action */}
        <div style={{margin: '0 2px 14px', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(242,166,90,0.12), rgba(242,166,90,0.04))', border: '1px solid rgba(242,166,90,0.2)'}}>
          <p style={{fontSize: 10.5, color: '#d98a3e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 9}}>Quick Action</p>
          <Link to="/admin/properties/new" className="btn sm" style={{width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px 12px'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Property
          </Link>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div>
            <div style={{fontSize: 16, fontWeight: 700, color: '#11111b', letterSpacing: '-0.01em'}}>{title}</div>
            {sub && <div style={{fontSize: 12, color: '#a0a3b1', marginTop: 1}}>{sub}</div>}
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            {/* View site */}
            <Link to="/" className="tb-btn" title="View live site" style={{width: 'auto', padding: '0 14px', gap: 7, fontSize: 13, fontWeight: 600}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>
              View Site
            </Link>

            {/* Notifications */}
            <Dropdown width={320} trigger={open => (
              <button className="tb-btn" title="Notifications" style={open ? {background: '#f5f6fa', borderColor: '#d6d9e0'} : undefined}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span style={{position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%', background: '#e0654f', border: '1.5px solid #fff'}} />
              </button>
            )}>
              <div style={{padding: '10px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span style={{fontSize: 13.5, fontWeight: 700, color: '#11111b'}}>Notifications</span>
                <span style={{fontSize: 11, color: '#d98a3e', fontWeight: 600, cursor: 'pointer'}}>Mark all read</span>
              </div>
              <div className="dd-divider" />
              {NOTES.map(n => (
                <div key={n.id} className="dd-item" style={{alignItems: 'flex-start', cursor: 'default'}}>
                  <span style={{width: 32, height: 32, borderRadius: 8, background: `${n.color}15`, color: n.color, display: 'grid', placeItems: 'center', flexShrink: 0}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{NOTE_ICON[n.icon]}</svg>
                  </span>
                  <span style={{flex: 1}}>
                    <span style={{display: 'block', fontSize: 13, color: '#11111b', lineHeight: 1.35}}>{n.title}</span>
                    <span style={{display: 'block', fontSize: 11.5, color: '#a0a3b1', marginTop: 2}}>{n.time}</span>
                  </span>
                </div>
              ))}
              <div className="dd-divider" />
              <button className="dd-item" style={{justifyContent: 'center', color: '#636274', fontWeight: 600}}>View all notifications</button>
            </Dropdown>

            {/* Profile */}
            <Dropdown width={240} trigger={open => (
              <button className="tb-profile" style={open ? {background: '#f5f6fa'} : undefined}>
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f2a65a, #d98a3e)',
                  color: '#fff', fontWeight: 700, fontSize: 13.5,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>{initial}</span>
                <span style={{textAlign: 'left', lineHeight: 1.2, maxWidth: 110, overflow: 'hidden'}}>
                  <span style={{display: 'block', fontSize: 12.5, fontWeight: 600, color: '#11111b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{name}</span>
                  <span style={{display: 'block', fontSize: 10.5, color: '#a0a3b1'}}>Administrator</span>
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="2" style={{transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s'}}><path d="M6 9l6 6 6-6"/></svg>
              </button>
            )}>
              <div style={{padding: '12px', display: 'flex', alignItems: 'center', gap: 11}}>
                <span style={{width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #f2a65a, #d98a3e)', color: '#fff', fontWeight: 700, fontSize: 16, display: 'grid', placeItems: 'center', flexShrink: 0}}>{initial}</span>
                <span style={{overflow: 'hidden'}}>
                  <span style={{display: 'block', fontSize: 13.5, fontWeight: 700, color: '#11111b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{name}</span>
                  <span style={{display: 'block', fontSize: 11.5, color: '#a0a3b1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{email}</span>
                </span>
              </div>
              <div className="dd-divider" />
              <button className="dd-item" onClick={() => navigate('/admin/users')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>
                My Profile
              </button>
              <button className="dd-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </button>
              <button className="dd-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                Help & Support
              </button>
              <div className="dd-divider" />
              <button className="dd-item danger" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Sign out
              </button>
            </Dropdown>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
