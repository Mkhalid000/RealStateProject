import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Reveal} from './Reveal';

function Social({label, href = '#', children}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-ink">
      {children}
    </a>
  );
}

const ICONS = {
  Instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  LinkedIn: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z" />
    </svg>
  ),
  X: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-7.3 8.3L23 22h-6.8l-5-6.5L5.3 22H2l7.8-8.9L1.5 2h6.9l4.5 6zM17.7 20h1.9L7.4 4H5.4z" />
    </svg>
  ),
  YouTube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 12s0-3.2-.4-4.7a3 3 0 0 0-2.1-2.1C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.5.4A3 3 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a3 3 0 0 0 2.1 2.1c1.6.4 8.5.4 8.5.4s6.9 0 8.5-.4a3 3 0 0 0 2.1-2.1C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z" />
    </svg>
  ),
};

export function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="relative z-10 overflow-hidden border-t border-line bg-surface2/40 backdrop-blur-sm">
      {/* top CTA strip */}
      <div className="border-b border-line/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
          <h3 className="text-center font-serif text-3xl md:text-left md:text-4xl">
            Ready to find your <span className="text-gradient-gold">masterpiece</span>?
          </h3>
          <Link
            to="/properties"
            className="sheen rounded-full bg-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink shadow-glow transition-colors hover:bg-gold-dark">
            Explore Collection
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <Reveal stagger={0.1} className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1.5fr]">
          <div>
            <div className="font-serif text-3xl tracking-wide">
              AU<span className="text-gold">REVIA</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              Curating the world's most exceptional residences for those who
              accept nothing less than extraordinary.
            </p>
            <div className="mt-7 flex gap-3">
              {Object.keys(ICONS).map(k => (
                <Social key={k} label={k}>
                  {ICONS[k]}
                </Social>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xs uppercase tracking-luxe text-muted">Explore</h4>
            {[
              {to: '/properties', label: 'Properties'},
              {to: '/about', label: 'About'},
              {to: '/contact', label: 'Contact'},
              {to: '/login', label: 'Login'},
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="group mb-3 block w-fit text-sm text-fg/80 transition-colors hover:text-gold">
                <span className="bg-gradient-to-r from-gold to-gold bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-all duration-300 group-hover:bg-[length:100%_1px]">
                  {l.label}
                </span>
              </Link>
            ))}
          </div>

          <div>
            <h4 className="mb-5 text-xs uppercase tracking-luxe text-muted">Contact</h4>
            <a href="tel:+10000000000" className="mb-3 block text-sm text-fg/80 transition-colors hover:text-gold">
              +1 (000) 000-0000
            </a>
            <a href="mailto:hello@aurevia.com" className="mb-3 block text-sm text-fg/80 transition-colors hover:text-gold">
              hello@aurevia.com
            </a>
            <span className="text-sm text-muted">5th Avenue, New York</span>
          </div>

          <div>
            <h4 className="mb-5 text-xs uppercase tracking-luxe text-muted">Newsletter</h4>
            <p className="mb-4 text-sm text-muted">
              Receive private listings before they reach the market.
            </p>
            {subscribed ? (
              <p className="rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage">
                Thank you — you're on the list.
              </p>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
                className="flex overflow-hidden rounded-xl border border-line bg-surface focus-within:border-gold">
                <input
                  required
                  type="email"
                  placeholder="Your email"
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
                />
                <button className="sheen bg-gold px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-gold-dark">
                  Join
                </button>
              </form>
            )}
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-line pt-7 text-sm text-muted md:flex-row">
          <span>© {new Date().getFullYear()} Aurevia Estates. All rights reserved.</span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </div>

      {/* oversized watermark wordmark */}
      <div
        aria-hidden
        className="pointer-events-none -mb-[3vw] select-none whitespace-nowrap text-center font-serif text-[22vw] leading-none text-fg/[0.035]">
        AUREVIA
      </div>
    </footer>
  );
}
