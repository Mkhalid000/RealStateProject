import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

const BG =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';

const HOME_FOR = {admin: '/admin', agent: '/agent', user: '/'};

const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500';
const fieldCls =
  'w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-11 pr-4 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20';

/* ── icons ── */
const ICON = {
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.09 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  building: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68M6.06 6.06A13.2 13.2 0 0 0 2 12s3.5 7 10 7a9.1 9.1 0 0 0 3.94-.9M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
};

function Field({label, icon, type = 'text', value, onChange, placeholder, autoComplete, className = ''}) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  const inputType = isPw ? (show ? 'text' : 'password') : type;
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${fieldCls} ${isPw ? 'pr-11' : ''}`}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{show ? ICON.eyeOff : ICON.eye}</svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const {login, register} = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('user'); // register role: 'user' | 'agent'
  const [form, setForm] = useState({fullName: '', email: '', password: '', phone: '', agencyName: ''});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const isRegister = mode === 'register';

  function switchMode(next, presetRole) {
    setMode(next);
    setError('');
    setInfo('');
    if (presetRole) setRole(presetRole);
  }

  async function submitLogin(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      navigate(HOME_FOR[u.role] || '/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        ...(role === 'agent' ? {phone: form.phone, agencyName: form.agencyName} : {}),
      };
      const res = await register(payload);
      if (res?.pendingVerification) {
        setInfo(res.message);
        setMode('login');
        setForm(f => ({...f, password: ''}));
      } else {
        navigate(HOME_FOR[res.role] || '/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-neutral-900">
      {/* ── LEFT · form panel (widens in register mode) ── */}
      <div
        className={`flex h-full w-full flex-col overflow-y-auto px-6 py-6 transition-[width,padding] duration-700 ease-in-out sm:px-10 ${
          isRegister ? 'lg:w-[58%] lg:px-16 xl:w-[54%]' : 'lg:w-[42%] lg:px-14 xl:w-[40%]'
        }`}>
        <Link to="/" className="shrink-0 font-serif text-2xl tracking-wide text-ink">
          AU<span className="text-gold-dark">REVIA</span>
        </Link>

        <div className="my-auto w-full py-5">
          <div className={`mx-auto w-full transition-[max-width] duration-700 ease-in-out ${isRegister ? 'max-w-2xl' : 'max-w-md'}`}>
            {/* tab switch — sliding pill */}
            <div className="relative mb-5 inline-flex w-64 rounded-full bg-neutral-100 p-1 text-xs font-semibold uppercase tracking-[0.12em]">
              <span
                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gold shadow-sm transition-transform duration-300 ease-out"
                style={{transform: isRegister ? 'translateX(100%)' : 'translateX(0)'}}
              />
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`relative z-10 flex-1 rounded-full py-2 transition-colors duration-300 ${!isRegister ? 'text-ink' : 'text-neutral-500 hover:text-neutral-900'}`}>
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`relative z-10 flex-1 rounded-full py-2 transition-colors duration-300 ${isRegister ? 'text-ink' : 'text-neutral-500 hover:text-neutral-900'}`}>
                Register
              </button>
            </div>

            {!isRegister ? (
              <form onSubmit={submitLogin}>
                <h1 className="font-serif text-4xl text-ink">Welcome back</h1>
                <p className="mt-1.5 text-sm text-neutral-500">Sign in to your Aurevia account.</p>

                <div className="mt-7 space-y-4">
                  <Field label="Email" icon={ICON.mail} type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                  <Field label="Password" icon={ICON.lock} type="password" autoComplete="current-password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
                </div>

                {info ? <Banner kind="info" text={info} /> : null}
                {error ? <Banner kind="error" text={error} /> : null}

                <button type="submit" disabled={loading} className="mt-7 w-full rounded-xl bg-gold py-3.5 font-semibold text-ink shadow-sm transition hover:bg-gold-dark disabled:opacity-50">
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>

                <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wider text-neutral-400">
                  <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
                </div>

                <button
                  type="button"
                  onClick={() => switchMode('register', 'agent')}
                  className="w-full rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 transition hover:border-gold hover:text-gold-dark">
                  Register as an agent →
                </button>
              </form>
            ) : (
              <form onSubmit={submitRegister}>
                <h1 className="font-serif text-3xl text-ink">Create account</h1>
                <p className=" text-sm text-neutral-500">Join Aurevia as a buyer or an agent.</p>

                {/* role toggle */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    {key: 'user', label: 'Buyer', desc: 'Browse & save'},
                    {key: 'agent', label: 'Agent', desc: 'List properties'},
                  ].map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={`rounded-xl border px-4 py-2.5 text-left transition ${
                        role === r.key ? 'border-gold bg-gold/10' : 'border-neutral-200 hover:border-neutral-300'
                      }`}>
                      <div className={`text-sm font-semibold ${role === r.key ? 'text-gold-dark' : 'text-neutral-900'}`}>{r.label}</div>
                      <div className="text-[11px] text-neutral-400">{r.desc}</div>
                    </button>
                  ))}
                </div>

                {/* fields — two columns on wider panel */}
                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="Full name" icon={ICON.user} autoComplete="name" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Jane Doe" />
                  <Field label="Email" icon={ICON.mail} type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                  <Field
                    label="Password"
                    icon={ICON.lock}
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="At least 6 characters"
                    className={role === 'agent' ? '' : 'sm:col-span-2'}
                  />
                  {role === 'agent' && (
                    <>
                      <Field label="Phone" icon={ICON.phone} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 …" />
                      <Field label="Agency (optional)" icon={ICON.building} value={form.agencyName} onChange={e => set('agencyName', e.target.value)} placeholder="Agency name" className="sm:col-span-2" />
                    </>
                  )}
                </div>

                {role === 'agent' && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-blue-700">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <span>Agent accounts require admin verification before the first sign-in.</span>
                  </div>
                )}

                {error ? <Banner kind="error" text={error} /> : null}

                <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-gold py-3 font-semibold text-ink shadow-sm transition hover:bg-gold-dark disabled:opacity-50">
                  {loading ? 'Creating…' : role === 'agent' ? 'Register as Agent' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT · visual panel (narrows in register mode) ── */}
      <div
        className={`relative hidden h-full overflow-hidden transition-[width] duration-700 ease-in-out lg:block ${
          isRegister ? 'lg:w-[42%] xl:w-[46%]' : 'lg:w-[58%] xl:w-[60%]'
        }`}>
        <img src={BG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/45 to-ink/55" />
        <div className="pointer-events-none absolute -left-20 bottom-1/4 h-96 w-96 rounded-full bg-gold/20 blur-[130px]" />

        <div className="absolute inset-0 flex flex-col justify-between p-12 xl:p-16">
          <span className="eyebrow text-gold-light">Aurevia · Private Access</span>

          <div>
            <h2 className="max-w-xl font-serif text-4xl leading-[1.1] text-white xl:text-5xl">
              An address of <span className="text-gradient-gold">distinction</span> awaits.
            </h2>
            <p className="mt-5 max-w-md text-white/70">
              Browse, list and manage the world's finest residences — all from one
              refined access point.
            </p>

            <div className="mt-10 flex gap-12 border-t border-white/15 pt-8">
              {[
                {v: 'Buyers', k: 'Save & enquire'},
                {v: 'Agents', k: 'List & manage'},
                {v: 'Admins', k: 'Verify & curate'},
              ].map(s => (
                <div key={s.v}>
                  <div className="font-serif text-2xl text-gold-light">{s.v}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-luxe text-white/50">{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Banner({kind, text}) {
  const styles =
    kind === 'error'
      ? 'border-danger/30 bg-danger/10 text-danger'
      : 'border-sage/40 bg-sage/10 text-sage-dark';
  return <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${styles}`}>{text}</div>;
}
