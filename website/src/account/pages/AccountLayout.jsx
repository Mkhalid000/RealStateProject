import {Link, NavLink, Outlet, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

/**
 * Lightweight, light-themed shell for the signed-in *user* property area
 * (buyers who post their own listings). Agents/admins keep their richer
 * dashboards — this is the simple "My Properties" space reachable from the
 * profile dropdown.
 */
export default function AccountLayout() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/');
  }

  const initial = (user?.fullName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="admin-main" style={{height: '100vh'}}>
      <header className="admin-topbar">
        <Link to="/" className="brand" style={{fontFamily: 'var(--font-serif)', fontSize: 20, letterSpacing: '0.04em', color: '#11111b', textDecoration: 'none'}}>
          AU<b style={{color: 'var(--gold)'}}>REVIA</b>
          <span style={{fontSize: 9, display: 'block', color: '#a0a3b1', letterSpacing: '0.18em', fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', marginTop: 1}}>
            My Account
          </span>
        </Link>

        <nav style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <NavLink
            to="/account/properties"
            end
            style={({isActive}) => ({
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              color: isActive ? '#d98a3e' : '#636274',
            })}>
            My Properties
          </NavLink>

          <Link to="/" className="tb-btn" title="View live site" style={{width: 'auto', padding: '0 14px', gap: 7, fontSize: 13, fontWeight: 600}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>
            View Site
          </Link>

          <span style={{width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #f2a65a, #d98a3e)', color: '#fff', fontWeight: 700, fontSize: 13.5, display: 'grid', placeItems: 'center', flexShrink: 0}} title={user?.email}>
            {initial}
          </span>

          <button className="btn ghost sm" onClick={onLogout}>Sign out</button>
        </nav>
      </header>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
