import {useEffect, useRef, useState} from 'react';
import {NavLink, Outlet, useNavigate, useLocation, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

const LINKS = [
  {
    to: '/agent',
    label: 'Overview',
    end: true,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    to: '/agent/properties',
    label: 'My Listings',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>,
  },
  {
    to: '/agent/properties/new',
    label: 'Add Property',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  },
];

function pageTitle(pathname) {
  if (pathname === '/agent') return {title: 'Overview', sub: 'Your listings at a glance'};
  if (pathname.includes('/properties/new')) return {title: 'Add Property', sub: 'Create a new listing'};
  if (pathname.includes('/properties/') && pathname.includes('/edit')) return {title: 'Edit Property', sub: 'Update your listing'};
  if (pathname.startsWith('/agent/properties')) return {title: 'My Listings', sub: 'Manage the properties you have listed'};
  return {title: 'Agent', sub: ''};
}

function Dropdown({trigger, children, width = 230}) {
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
      {open && <div className="dropdown" style={{right: 0, minWidth: width}} onClick={() => setOpen(false)}>{children}</div>}
    </div>
  );
}

export default function AgentLayout() {
  const {logout, user} = useAuth();
  const navigate = useNavigate();
  const {pathname} = useLocation();

  function onLogout() {
    logout();
    navigate('/login');
  }

  const initial = (user?.fullName || 'A').charAt(0).toUpperCase();
  const name = user?.fullName || 'Agent';
  const email = user?.email || '';
  const {title, sub} = pageTitle(pathname);

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="brand">
          AU<b>REVIA</b>
          <span style={{fontSize: 9, display: 'block', color: '#a0a3b1', letterSpacing: '0.18em', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', marginTop: 1}}>Agent Portal</span>
        </Link>

        <div className="nav-section">Manage</div>

        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.icon}
            {l.label}
          </NavLink>
        ))}

        <div style={{flex: 1}} />

        <div style={{margin: '0 2px 14px', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(111,143,114,0.14), rgba(111,143,114,0.05))', border: '1px solid rgba(111,143,114,0.25)'}}>
          <p style={{fontSize: 10.5, color: '#5a7a5d', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6}}>Verified Agent</p>
          <p style={{fontSize: 12, color: '#636274', lineHeight: 1.4}}>Listings you add go live after admin review.</p>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <div style={{fontSize: 16, fontWeight: 700, color: '#11111b', letterSpacing: '-0.01em'}}>{title}</div>
            {sub && <div style={{fontSize: 12, color: '#a0a3b1', marginTop: 1}}>{sub}</div>}
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <Link to="/" className="tb-btn" title="View live site" style={{width: 'auto', padding: '0 14px', gap: 7, fontSize: 13, fontWeight: 600}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>
              View Site
            </Link>

            <Dropdown width={240} trigger={open => (
              <button className="tb-profile" style={open ? {background: '#f5f6fa'} : undefined}>
                <span style={{width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6f8f72, #557a58)', color: '#fff', fontWeight: 700, fontSize: 13.5, display: 'grid', placeItems: 'center', flexShrink: 0}}>{initial}</span>
                <span style={{textAlign: 'left', lineHeight: 1.2, maxWidth: 110, overflow: 'hidden'}}>
                  <span style={{display: 'block', fontSize: 12.5, fontWeight: 600, color: '#11111b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{name}</span>
                  <span style={{display: 'block', fontSize: 10.5, color: '#a0a3b1'}}>Agent</span>
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="2" style={{transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s'}}><path d="M6 9l6 6 6-6"/></svg>
              </button>
            )}>
              <div style={{padding: '12px', display: 'flex', alignItems: 'center', gap: 11}}>
                <span style={{width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6f8f72, #557a58)', color: '#fff', fontWeight: 700, fontSize: 16, display: 'grid', placeItems: 'center', flexShrink: 0}}>{initial}</span>
                <span style={{overflow: 'hidden'}}>
                  <span style={{display: 'block', fontSize: 13.5, fontWeight: 700, color: '#11111b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{name}</span>
                  <span style={{display: 'block', fontSize: 11.5, color: '#a0a3b1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{email}</span>
                </span>
              </div>
              <div className="dd-divider" />
              <button className="dd-item" onClick={() => navigate('/agent/properties')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>
                My Listings
              </button>
              <button className="dd-item" onClick={() => navigate('/agent/properties/new')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Add Property
              </button>
              <div className="dd-divider" />
              <button className="dd-item danger" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Sign out
              </button>
            </Dropdown>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
