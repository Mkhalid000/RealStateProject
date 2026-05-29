import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

const BG =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80';

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
    <div className="relative h-screen overflow-hidden">
      {/* property background — always dark-overlaid so text stays readable */}
      <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${BG})`}} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      {/* amber ambience */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-gold/20 blur-[130px]" />

      {/* top brand */}
      <Link
        to="/"
        className="absolute left-8 top-7 z-10 font-serif text-2xl tracking-wide text-white">
        AU<span className="text-gold">REVIA</span>
      </Link>

      <div className="relative z-10 mx-auto grid h-full max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-2">
        {/* left — marketing (white text on dark) */}
        <div className="hidden lg:block">
          <span className="eyebrow">Aurevia · Secure Access</span>
          <h1 className="mt-5 font-serif text-6xl leading-[1.05] text-white">
            Manage estates of <span className="text-gradient-gold">distinction</span>.
          </h1>
          <p className="mt-6 max-w-md text-lg text-white/70">
            Oversee listings, verify agents, curate reels and track performance —
            the command center behind the world's finest residences.
          </p>
          <div className="mt-10 flex gap-10">
            {[
              {v: 'Listings', k: 'Curated daily'},
              {v: 'Agents', k: 'Verified & vetted'},
              {v: 'Insights', k: 'Real-time'},
            ].map(s => (
              <div key={s.v}>
                <div className="font-serif text-2xl text-gold">{s.v}</div>
                <div className="mt-1 text-xs uppercase tracking-luxe text-white/50">{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right — glass form (white text, always visible) */}
        <div className="mx-auto w-full max-w-md">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-white/12 bg-white/[0.07] p-8 shadow-soft backdrop-blur-xl sm:p-10">
            <span className="eyebrow">Account Login</span>
            <h2 className="mt-3 font-serif text-4xl text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-white/60">Sign in to your dashboard.</p>

            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-white outline-none transition placeholder:text-white/40 focus:border-gold focus:bg-white/15 focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-white outline-none transition placeholder:text-white/40 focus:border-gold focus:bg-white/15 focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-lg border border-danger/50 bg-danger/15 px-4 py-3 text-sm text-white">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="sheen mt-7 w-full rounded-xl bg-gold py-3.5 font-semibold text-ink shadow-glow transition hover:bg-gold-dark disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <Link
              to="/"
              className="mt-6 block text-center text-sm text-white/55 transition hover:text-gold">
              ← Back to site
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
