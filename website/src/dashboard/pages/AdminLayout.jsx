import {NavLink, Outlet, useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

const I = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  users: 'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM2 21a7 7 0 0 1 14 0M19 8a3 3 0 1 1 0 6',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  play: 'M5 3l14 9-14 9V3z',
  zap: 'M13 2L4 14h7l-1 8 9-12h-7z',
};

const LINKS = [
  {to: '/admin', label: 'Overview', end: true, icon: I.grid},
  {to: '/admin/users', label: 'Users & Agents', icon: I.users},
  {to: '/admin/properties', label: 'Properties', icon: I.home},
  {to: '/admin/reels', label: 'Reels', icon: I.play},
  {to: '/admin/boosts', label: 'Boosts', icon: I.zap},
];

function Icon({d}) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function AdminLayout() {
  const {logout, admin} = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login');
  }

  const initial = (admin?.fullName || 'A').charAt(0).toUpperCase();

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="brand">
          AU<b>REVIA</b>
        </Link>
        <div style={{padding: '0 14px 14px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)'}}>
          Management
        </div>
        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <Icon d={l.icon} />
            {l.label}
          </NavLink>
        ))}

        <div style={{flex: 1}} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'var(--surface-2)',
            marginBottom: 10,
          }}>
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--gold)',
              color: '#211d1d',
              fontWeight: 700,
            }}>
            {initial}
          </div>
          <div style={{lineHeight: 1.2, overflow: 'hidden'}}>
            <div style={{fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>
              {admin?.fullName || 'Admin'}
            </div>
            <div style={{fontSize: 11, color: 'var(--muted)'}}>Administrator</div>
          </div>
        </div>
        <button className="btn ghost sm" onClick={onLogout}>
          Logout
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
