import {NavLink, Outlet, useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

const LINKS = [
  {to: '/admin', label: 'Overview', end: true},
  {to: '/admin/users', label: 'Users & Agents'},
  {to: '/admin/properties', label: 'Properties'},
  {to: '/admin/reels', label: 'Reels'},
  {to: '/admin/boosts', label: 'Boosts'},
];

export default function AdminLayout() {
  const {logout, admin} = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="brand">
          AU<b>REVIA</b>
        </Link>
        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
        <div style={{flex: 1}} />
        <div className="muted" style={{padding: '0 14px 12px', fontSize: 13}}>
          {admin?.fullName || 'Admin'}
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
