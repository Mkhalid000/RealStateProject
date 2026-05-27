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
    <div className="flex min-h-screen bg-bg">
      {/* ===== Left brand panel ===== */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-surface2 via-surface to-bg" />
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-gold/20 blur-[120px]" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-sage/20 blur-[120px]" />
        <div className="relative z-10 flex flex-col justify-between p-14">
          <Link to="/" className="font-serif text-3xl tracking-wide text-cream">
            AU<span className="text-gold">REVIA</span>
          </Link>
          <div>
            <h1 className="font-serif text-5xl leading-tight text-cream">
              The control room for <span className="text-gradient-gold">extraordinary</span> estates.
            </h1>
            <p className="mt-6 max-w-md text-cream/60">
              Manage listings, agents, reels and platform performance — all from
              one refined, secure dashboard.
            </p>
            <div className="mt-10 flex gap-8">
              {[
                {k: 'Listings', v: 'Curated'},
                {k: 'Agents', v: 'Verified'},
                {k: 'Insights', v: 'Real-time'},
              ].map(s => (
                <div key={s.k}>
                  <div className="font-serif text-2xl text-gold">{s.v}</div>
                  <div className="mt-1 text-xs uppercase tracking-luxe text-cream/50">{s.k}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-cream/40">© {new Date().getFullYear()} Aurevia Estates</p>
        </div>
      </div>

      {/* ===== Right form ===== */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex font-serif text-2xl tracking-wide text-fg lg:hidden">
            AU<span className="text-gold">REVIA</span>
          </Link>

          <span className="eyebrow">Admin Access</span>
          <h2 className="mt-3 font-serif text-4xl text-fg">Welcome back</h2>
          <p className="mt-2 text-sm text-muted">
            Sign in to manage your platform.
          </p>

          <div className="mt-9 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@realreels.app"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-fg outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-muted/60"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-fg outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-muted/60"
              />
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-gold py-3.5 font-semibold text-ink shadow-glow transition hover:bg-gold-dark disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <Link
            to="/"
            className="mt-6 block text-center text-sm text-muted transition hover:text-gold">
            ← Back to site
          </Link>
        </form>
      </div>
    </div>
  );
}
