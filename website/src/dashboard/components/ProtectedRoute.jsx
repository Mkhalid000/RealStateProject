import {Navigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

const HOME_FOR = {admin: '/admin', agent: '/agent'};

export function ProtectedRoute({children, role}) {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <div className="auth-wrap" style={{display: 'grid', placeItems: 'center', minHeight: '100vh'}}>
        <span className="muted">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      // Send users to wherever their role belongs (or home for buyers).
      return <Navigate to={HOME_FOR[user.role] || '/'} replace />;
    }
  }

  return children;
}
