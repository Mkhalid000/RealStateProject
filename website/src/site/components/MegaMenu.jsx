import {Link} from 'react-router-dom';

/**
 * Panel contents for the navbar's mega menu.
 *
 * Each panel is a plain grid of link columns plus one visual "feature" card on
 * the right, so every panel has the same rhythm however different its contents.
 */

const Svg = ({d, size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

export const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  tag: <><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M17 6l2 2M14 9l2 2" /></>,
  star: <path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />,
  map: <><path d="M9 3 3 5.5v16L9 19l6 2.5 6-2.5v-16L15 5.5z" /><path d="M9 3v16M15 5.5v16" /></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="1.5" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></>,
  home: <><path d="M3 11l9-8 9 8M5 10v10h14V10" /></>,
  plot: <><path d="M3 5h18v14H3z" /><path d="M3 12h18M12 5v14" /></>,
  shop: <><path d="M3 9 4.5 4h15L21 9M3 9h18v11H3zM3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
  office: <><rect x="3" y="7" width="18" height="14" rx="1.5" /><path d="M8 7V4h8v3M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  film: <><rect x="2" y="2" width="20" height="20" rx="3" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" /></>,
  book: <><path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" /><path d="M17 8h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2M8 8h5M8 12h5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-5M12 8h.01" /></>,
  mail: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="m2 7 10 6 10-6" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
};

/** One link row inside a column. */
function Item({to, icon, title, hint, onNavigate, external}) {
  const body = (
    <>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface2/60 text-gold transition-colors group-hover:border-gold/50 group-hover:bg-gold/10">
        <Svg d={icon} size={15} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg transition-colors group-hover:text-gold">{title}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug text-muted">{hint}</span>}
      </span>
    </>
  );

  const className =
    'group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface2/70';

  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className} onClick={onNavigate}>
        {body}
      </a>
    );
  }
  return (
    <Link to={to} className={className} onClick={onNavigate}>
      {body}
    </Link>
  );
}

function Column({title, children}) {
  return (
    <div>
      <p className="mb-3 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/** The gold promo card that closes every panel. */
function Feature({eyebrow, title, body, to, cta, image, onNavigate}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-line bg-surface2/50 p-5 transition-colors hover:border-gold/50">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/55 to-ink/20" />
        </>
      )}
      <span className="relative">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light">{eyebrow}</span>
        <span className="mt-2 block font-serif text-2xl leading-tight text-white">{title}</span>
        {body && <span className="mt-2 block text-xs leading-relaxed text-white/70">{body}</span>}
        <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          {cta}
          <span className="transition-transform duration-300 group-hover:translate-x-1"><Svg d={ICONS.arrow} size={13} /></span>
        </span>
      </span>
    </Link>
  );
}

const TYPES = [
  {label: 'Apartments', to: '/properties?type=apartment', icon: ICONS.building},
  {label: 'Villas', to: '/properties?type=villa', icon: ICONS.home},
  {label: 'Plots', to: '/properties?type=plot', icon: ICONS.plot},
  {label: 'Offices', to: '/properties?type=office', icon: ICONS.office},
  {label: 'Shops', to: '/properties?type=shop', icon: ICONS.shop},
  {label: 'Commercial', to: '/properties?type=commercial', icon: ICONS.grid},
];

const CITIES = ['Bhopal', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'North Goa'];

export function PropertiesPanel({onNavigate}) {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_1fr_0.9fr]">
      <Column title="Browse">
        <Item to="/properties" icon={ICONS.grid} title="All properties" hint="The full collection, filtered to your city" onNavigate={onNavigate} />
        <Item to="/properties?listing=buy" icon={ICONS.key} title="For sale" hint="Homes and land available to buy" onNavigate={onNavigate} />
        <Item to="/properties?listing=rent" icon={ICONS.tag} title="For rent" hint="Furnished and unfurnished rentals" onNavigate={onNavigate} />
        <Item to="/properties?featured=true" icon={ICONS.star} title="Featured" hint="Hand-picked by our advisors" onNavigate={onNavigate} />
        <Item to="/map" icon={ICONS.map} title="Map explorer" hint="Search by neighbourhood, visually" onNavigate={onNavigate} />
      </Column>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <p className="mb-3 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">By type</p>
          <div className="grid grid-cols-2 gap-1">
            {TYPES.map(t => (
              <Link
                key={t.label}
                to={t.to}
                onClick={onNavigate}
                className="group flex items-center gap-2.5 rounded-xl p-2.5 text-sm text-fg/85 transition-colors hover:bg-surface2/70 hover:text-gold">
                <span className="text-gold/80"><Svg d={t.icon} size={15} /></span>
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Popular cities</p>
          <div className="flex flex-wrap gap-1.5 px-2.5">
            {CITIES.map(c => (
              <Link
                key={c}
                to={`/properties?city=${encodeURIComponent(c)}`}
                onClick={onNavigate}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/50 hover:text-gold">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Feature
        eyebrow="Free listing"
        title="Post your property"
        body="Reach serious buyers in minutes — no fee, no broker."
        to="/post-property"
        cta="Start now"
        image="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=70"
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function JournalPanel({categories = [], posts = [], onNavigate}) {
  const lead = posts[0];
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr_1fr]">
      <Column title="The Journal">
        <Item to="/blog" icon={ICONS.book} title="All articles" hint="Guides, market reading and design notes" onNavigate={onNavigate} />
        <Item to="/blog?sort=popular" icon={ICONS.star} title="Most read" hint="What everyone else is reading" onNavigate={onNavigate} />
        <Item to="/reels" icon={ICONS.film} title="Reels" hint="Walk-throughs in sixty seconds" onNavigate={onNavigate} />
      </Column>

      <div>
        <p className="mb-3 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Categories</p>
        <div className="space-y-0.5">
          {categories.length === 0 ? (
            <p className="px-2.5 text-xs text-muted">Loading…</p>
          ) : (
            categories.slice(0, 6).map(c => (
              <Link
                key={c.id}
                to={`/blog?category=${c.slug}`}
                onClick={onNavigate}
                className="group flex items-center justify-between rounded-xl px-2.5 py-2 text-sm text-fg/85 transition-colors hover:bg-surface2/70 hover:text-gold">
                {c.name}
                <span className="text-xs text-muted">{c.postCount ?? 0}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="mb-3 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Latest</p>
        {lead ? (
          <div className="space-y-3">
            <Link
              to={`/blog/${lead.slug}`}
              onClick={onNavigate}
              className="group block overflow-hidden rounded-2xl border border-line">
              <span className="relative block aspect-[16/9] overflow-hidden bg-surface2">
                {lead.coverImageUrl && (
                  <img src={lead.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
                <span className="absolute inset-x-3 bottom-3 line-clamp-2 font-serif text-base leading-snug text-white">
                  {lead.title}
                </span>
              </span>
            </Link>
            {posts.slice(1, 3).map(p => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                onClick={onNavigate}
                className="group flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface2/70">
                <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-surface2">
                  {p.coverImageUrl && <img src={p.coverImageUrl} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-xs font-medium text-fg transition-colors group-hover:text-gold">{p.title}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted">{p.readingMinutes} min read</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-2.5 text-xs text-muted">Nothing published yet.</p>
        )}
      </div>
    </div>
  );
}

export function CompanyPanel({onNavigate}) {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr_0.9fr]">
      <Column title="Company">
        <Item to="/about" icon={ICONS.info} title="About Aurevia" hint="Fifteen years of quiet, careful deals" onNavigate={onNavigate} />
        <Item to="/contact" icon={ICONS.mail} title="Contact us" hint="Speak with an advisor today" onNavigate={onNavigate} />
        <Item to="/privacy" icon={ICONS.shield} title="Privacy & cookies" hint="What we store, and why" onNavigate={onNavigate} />
      </Column>

      <Column title="For owners & agents">
        <Item to="/post-property" icon={ICONS.plus} title="Post a property" hint="Free listing, live after a quick review" onNavigate={onNavigate} />
        <Item to="/login" icon={ICONS.key} title="Agent sign in" hint="Manage listings, reels and leads" onNavigate={onNavigate} />
      </Column>

      <Feature
        eyebrow="Private client"
        title="Talk to an advisor"
        body="Off-market listings and private viewings, arranged discreetly."
        to="/contact"
        cta="Get in touch"
        image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=70"
        onNavigate={onNavigate}
      />
    </div>
  );
}
