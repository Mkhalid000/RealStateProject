import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {Reveal} from '../components/Reveal';

/* Default destination after sign-in for a buyer posting their own listing.
   Agents/admins are routed to their own dashboards in startPosting(). */
const FORM_PATH = '/account/properties/new';
const INTENT_KEY = 'rr_post_intent';

const benefits = [
  'Advertise your property for free',
  'Reach thousands of serious, verified buyers',
  'Get qualified enquiries directly on WhatsApp',
  'Dedicated assistance in coordinating site visits',
];

/* category → subtypes, mapped to the property form's `type` field */
const SUBTYPES = {
  residential: [
    {label: 'Flat / Apartment', type: 'apartment'},
    {label: 'Independent House / Villa', type: 'villa'},
    {label: 'Plot / Land', type: 'plot'},
  ],
  commercial: [
    {label: 'Office Space', type: 'office'},
    {label: 'Shop / Showroom', type: 'shop'},
    {label: 'Commercial Land', type: 'commercial'},
  ],
};

const LOOKING = [
  {key: 'buy', label: 'Sell'},
  {key: 'rent', label: 'Rent / Lease'},
];

const STEPS = [
  {
    n: '01',
    title: 'Add details of your property',
    desc: 'Tell us the basics — property type, location, size and rooms. It takes only a minute.',
    icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  },
  {
    n: '02',
    title: 'Upload photos & video',
    desc: 'Showcase your property with high-quality images, a walkthrough video or even a 3D tour.',
    icon: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="m16 10 6-3v10l-6-3" /></>,
  },
  {
    n: '03',
    title: 'Add pricing & ownership',
    desc: 'Set your expected price and contact details. Your listing goes live after a quick review.',
    icon: <><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  },
];

const Svg = ({d, size = 18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const Check = () => (
  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
  </span>
);

export default function PostProperty() {
  const navigate = useNavigate();
  const {user} = useAuth();

  const [looking, setLooking] = useState('buy');
  const [category, setCategory] = useState('residential');
  const [subtype, setSubtype] = useState('apartment');
  const [phone, setPhone] = useState('');

  function pickCategory(c) {
    setCategory(c);
    setSubtype(SUBTYPES[c][0].type); // reset to first valid subtype
  }

  function startPosting() {
    // Stash the basic details so the property form can prefill them after auth.
    const intent = {
      listingType: looking,
      type: subtype,
      ...(phone.trim() ? {ownerPhone: phone.trim()} : {}),
    };
    sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));

    // Anyone can post for free. Signed-in users go straight to the right form;
    // visitors sign in or register first, then land back on the form.
    if (!user) navigate(`/login?next=${encodeURIComponent(FORM_PATH)}`);
    else if (user.role === 'agent') navigate('/agent/properties/new');
    else if (user.role === 'admin') navigate('/admin/properties/new');
    else navigate(FORM_PATH); // regular user
  }

  const chip = active =>
    `rounded-full border px-4 py-2 text-sm transition ${
      active ? 'border-gold bg-gold/10 text-gold' : 'border-line text-fg/70 hover:border-gold/40'
    }`;

  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-32">
        {/* ── Hero ── */}
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* left — pitch */}
          <Reveal>
            <p className="eyebrow mb-4">List with Aurevia</p>
            <h1 className="font-serif text-4xl leading-[1.1] md:text-6xl">
              Sell or rent your property,
              <span className="block text-gradient-gold">online &amp; for free.</span>
            </h1>
            <p className="mt-5 max-w-lg text-muted">
              Put your home in front of a discerning, ready-to-act audience. Listing is
              complimentary — you only pay if you choose our Owner Assist concierge.
            </p>

            <ul className="mt-8 space-y-3">
              {benefits.map(b => (
                <li key={b} className="flex items-start gap-3 text-fg/85">
                  <Check />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-xs uppercase tracking-[0.16em] text-muted">
              * Site-visit coordination available with Owner Assist plans
            </p>
          </Reveal>

          {/* right — start posting card */}
          <Reveal delay={0.1}>
            <div className="glass rounded-3xl p-7 shadow-soft md:p-8">
              <h2 className="font-serif text-2xl text-fg">Start posting your property</h2>
              <p className="mt-1 text-sm text-gold">It&apos;s free — takes under a minute.</p>

              {/* you're looking to */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">You&apos;re looking to</p>
                <div className="flex flex-wrap gap-2">
                  {LOOKING.map(o => (
                    <button key={o.key} type="button" onClick={() => setLooking(o.key)} className={chip(looking === o.key)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* property category */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">And it&apos;s a</p>
                <div className="flex gap-2">
                  {['residential', 'commercial'].map(c => (
                    <button key={c} type="button" onClick={() => pickCategory(c)} className={`flex-1 capitalize ${chip(category === c)}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* subtype */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Property type</p>
                <div className="flex flex-wrap gap-2">
                  {SUBTYPES[category].map(s => (
                    <button key={s.type} type="button" onClick={() => setSubtype(s.type)} className={chip(subtype === s.type)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* phone */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Your contact number</p>
                <div className="flex items-center gap-2 rounded-xl border border-line bg-surface2/40 px-3">
                  <span className="text-muted"><Svg d={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.09 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />} size={16} /></span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone number (optional)"
                    className="flex-1 bg-transparent py-3 text-sm text-fg outline-none placeholder:text-muted"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={startPosting}
                className="mt-7 w-full rounded-full bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink shadow-glow transition-colors hover:bg-gold-light">
                Start now
              </button>

              {!user && (
                <p className="mt-4 text-center text-sm text-muted">
                  Already registered?{' '}
                  <Link to={`/login?next=${encodeURIComponent(FORM_PATH)}`} className="font-semibold text-gold hover:underline">
                    Login
                  </Link>
                </p>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── How to post ── */}
        <div className="mt-28">
          <Reveal className="text-center">
            <p className="eyebrow mb-3">How to post</p>
            <h2 className="font-serif text-3xl md:text-5xl">List your property in 3 simple steps</h2>
          </Reveal>

          <Reveal stagger={0.08} className="mt-14 grid gap-7 md:grid-cols-3">
            {STEPS.map(s => (
              <div key={s.n} className="rounded-2xl border border-line bg-surface/60 p-7 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-gold">
                    <Svg d={s.icon} size={22} />
                  </span>
                  <span className="font-serif text-3xl text-line">{s.n}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </Reveal>

          <Reveal className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={startPosting}
              className="rounded-full border border-gold/60 bg-gold/10 px-10 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink">
              Post your property now
            </button>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
