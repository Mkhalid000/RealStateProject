import {Navigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export function ProtectedRoute({children}) {
  const {admin, loading} = useAuth();
  if (loading) {
    return (
      <div className="auth-wrap">
        <span className="muted">Loading…</span>
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
