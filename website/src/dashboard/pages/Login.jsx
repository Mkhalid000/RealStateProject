import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const {login} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="brand" style={{fontSize: 28}}>
          AU<b>REVIA</b>
        </Link>
        <h2 style={{marginTop: 24}}>Admin Access</h2>
        <p className="muted" style={{marginBottom: 26}}>
          Sign in to manage listings, agents and the platform.
        </p>
        <input
          className="input"
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error ? <div className="error">{error}</div> : null}
        <button className="btn" style={{width: '100%'}} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <Link
          to="/"
          className="muted"
          style={{display: 'block', textAlign: 'center', marginTop: 20, fontSize: 14}}>
          ← Back to site
        </Link>
      </form>
    </div>
  );
}
