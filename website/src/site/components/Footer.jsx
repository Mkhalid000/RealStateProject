import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Reveal} from './Reveal';

const SOCIALS = ['Instagram', 'LinkedIn', 'X', 'YouTube'];

export function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface2/40">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <Reveal stagger={0.1} className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
          <div>
            <div className="font-serif text-3xl tracking-wide">
              AU<span className="text-gold">REVIA</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              Curating the world's most exceptional residences for those who
              accept nothing less than extraordinary.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-xs uppercase tracking-luxe text-muted">Explore</h4>
            {[
              {to: '/properties', label: 'Properties'},
              {to: '/about', label: 'About'},
              {to: '/contact', label: 'Contact'},
              {to: '/login', label: 'Admin'},
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="group mb-3 block w-fit text-sm text-fg/80 transition-colors hover:text-gold">
                <span className="bg-gradient-to-r from-gold to-gold bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-all duration-300 group-hover:bg-[length:100%_1px]">
                  {l.label}
                </span>
              </Link>
            ))}
          </div>

          <div>
            <h4 className="mb-5 text-xs uppercase tracking-luxe text-muted">Contact</h4>
            <a href="tel:+10000000000" className="mb-3 block text-sm text-fg/80 hover:text-gold">
              +1 (000) 000-0000
            </a>
            <a href="mailto:hello@aurevia.com" className="mb-3 block text-sm text-fg/80 hover:text-gold">
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
              <p className="text-sm text-gold">Thank you — you're on the list.</p>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
                className="flex overflow-hidden rounded-sm border border-line">
                <input
                  required
                  type="email"
                  placeholder="Your email"
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
                />
                <button className="bg-gold px-5 text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:bg-gold-light">
                  Join
                </button>
              </form>
            )}
            <div className="mt-6 flex gap-4">
              {SOCIALS.map(s => (
                <a
                  key={s}
                  href="#"
                  className="text-xs uppercase tracking-[0.12em] text-muted transition-all duration-300 hover:-translate-y-1 hover:text-gold">
                  {s}
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-line pt-7 text-sm text-muted md:flex-row">
          <span>© {new Date().getFullYear()} Aurevia Estates. All rights reserved.</span>
          <span>Privacy · Terms</span>
        </div>
      </div>

      {/* oversized watermark wordmark */}
      <div
        aria-hidden
        className="pointer-events-none select-none whitespace-nowrap text-center font-serif text-[22vw] leading-none text-fg/[0.03]">
        AUREVIA
      </div>
    </footer>
  );
}
