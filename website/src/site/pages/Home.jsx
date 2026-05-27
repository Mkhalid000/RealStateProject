import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {gsap, ScrollTrigger} from '../../lib/gsap';
import {apiFetch} from '../../lib/api';
import {Reveal} from '../components/Reveal';
import {Counter} from '../components/Counter';
import {Marquee} from '../components/Marquee';
import {MagneticButton} from '../components/MagneticButton';
import {PropertyCard} from '../components/PropertyCard';

// three.js is heavy — load it only on the home page, as its own chunk.
const Hero3D = lazy(() =>
  import('../components/Hero3D').then(m => ({default: m.Hero3D})),
);
const Gem3D = lazy(() =>
  import('../components/Gem3D').then(m => ({default: m.Gem3D})),
);

const HERO_IMG =
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2400&q=80';

const SHOWCASE = [
  {img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', name: 'The Glass Pavilion', loc: 'Beverly Hills, CA'},
  {img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', name: 'Azure Cliff Villa', loc: 'Amalfi Coast, IT'},
  {img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', name: 'Maison Lumière', loc: 'Paris, FR'},
  {img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', name: 'The Onyx Penthouse', loc: 'Dubai, AE'},
  {img: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1400&q=80', name: 'Cedar & Stone Retreat', loc: 'Aspen, CO'},
];

const STATS = [
  {value: 320, suffix: '+', label: 'Private Listings'},
  {value: 48, suffix: '', label: 'Global Cities'},
  {value: 2.4, prefix: '$', suffix: 'B', decimals: 1, label: 'Property Sold'},
  {value: 15, suffix: '', label: 'Years of Trust'},
];

const TESTIMONIALS = [
  {quote: 'Aurevia found us a home we had only dreamed of. Discretion, taste, and an eye for the extraordinary.', name: 'Eleanor V.', role: 'Private Collector'},
  {quote: 'The most seamless luxury transaction I have experienced. Every detail was anticipated.', name: 'Marcus R.', role: 'Tech Founder'},
  {quote: 'Their advisors understand architecture, not just price. That is rare and invaluable.', name: 'Sofia L.', role: 'Architect'},
];

export default function Home() {
  const root = useRef(null);
  const heroBg = useRef(null);
  const showcaseSection = useRef(null);
  const track = useRef(null);
  const [featured, setFeatured] = useState([]);
  const [tIndex, setTIndex] = useState(0);

  useEffect(() => {
    apiFetch('/properties?limit=6')
      .then(r => {
        setFeatured(r.items || []);
        ScrollTrigger.refresh();
      })
      .catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTIndex(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-word > span', {
        yPercent: 120,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.2,
      });
      gsap.from('.hero-fade', {
        opacity: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.15,
        delay: 0.7,
      });

      gsap.to(heroBg.current, {
        yPercent: 18,
        scale: 1.18,
        ease: 'none',
        scrollTrigger: {trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true},
      });

      const el = track.current;
      if (el) {
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: showcaseSection.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
          },
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      {/* ===== HERO ===== */}
      <section id="hero" className="relative flex min-h-screen items-center overflow-hidden">
        <div
          ref={heroBg}
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{backgroundImage: `url(${HERO_IMG})`}}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/60 to-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />

        {/* Three.js ambient golden dust */}
        <div className="pointer-events-none absolute inset-0 z-[5] opacity-90">
          <Suspense fallback={null}>
            <Hero3D />
          </Suspense>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <p className="hero-fade eyebrow mb-6">Aurevia · Luxury Estates</p>
          <h1 className="font-serif text-[clamp(3rem,9vw,7.5rem)] leading-[0.95] text-white">
            <span className="hero-word block overflow-hidden">
              <span className="inline-block">Live</span>
            </span>
            <span className="hero-word block overflow-hidden">
              <span className="inline-block text-gradient-gold">Exceptionally.</span>
            </span>
          </h1>
          <p className="hero-fade mt-7 max-w-xl text-lg text-white/75">
            A private collection of the world's most distinguished residences —
            handpicked for those who live without compromise.
          </p>

          {/* floating glass search */}
          <div className="hero-fade glass mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl p-3 shadow-soft sm:flex-row sm:items-center">
            <input
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/50"
              placeholder="Search by city, type, or address…"
            />
            <select className="bg-transparent px-4 py-3 text-sm text-white/80 outline-none [&>option]:text-ink">
              <option value="">Any type</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="commercial">Commercial</option>
            </select>
            <Link
              to="/properties"
              className="sheen rounded-xl bg-gold px-7 py-3 text-center text-xs uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-light">
              Search
            </Link>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
          <div className="flex h-9 w-5 justify-center rounded-full border border-white/30 pt-2">
            <span className="h-2 w-px animate-scrollDot bg-white/70" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">Scroll</span>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <section className="border-y border-line py-8">
        <Marquee items={['Architecture', 'Privacy', 'Heritage', 'Design', 'Discretion', 'Excellence']} />
      </section>

      {/* ===== STATS ===== */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal stagger={0.12} className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="font-serif text-5xl text-gold md:text-6xl">
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals || 0} />
              </div>
              <div className="mt-3 text-xs uppercase tracking-luxe text-muted">{s.label}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ===== FEATURED ===== */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow mb-4">The Collection</p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl font-serif text-4xl md:text-6xl">Featured Residences</h2>
            <Link to="/properties" className="text-sm uppercase tracking-[0.16em] text-gold hover:text-gold-light">
              View all →
            </Link>
          </div>
        </Reveal>

        {featured.length > 0 ? (
          <Reveal stagger={0.1} className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </Reveal>
        ) : (
          <p className="mt-12 text-muted">
            No listings yet — start the backend and add properties from the admin panel.
          </p>
        )}
      </section>

      {/* ===== HORIZONTAL SHOWCASE (pinned) ===== */}
      <section ref={showcaseSection} className="relative h-screen overflow-hidden bg-ink">
        <div ref={track} className="flex h-screen items-center will-change-transform">
          <div className="flex h-full w-screen shrink-0 flex-col justify-center px-[8vw]">
            <p className="eyebrow mb-4 text-white/60">Signature Portfolio</p>
            <h2 className="max-w-md font-serif text-5xl text-white md:text-7xl">
              An immersive <span className="text-gradient-gold">showcase</span>.
            </h2>
            <p className="mt-6 max-w-sm text-white/60">
              Scroll to journey through our most celebrated residences.
            </p>
          </div>
          {SHOWCASE.map((s, i) => (
            <div
              key={i}
              className="group relative mr-[3vw] h-[70vh] w-[78vw] shrink-0 overflow-hidden rounded-2xl sm:w-[55vw] lg:w-[42vw]">
              <img
                src={s.img}
                alt={s.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8">
                <div className="text-xs uppercase tracking-luxe text-gold-light">{`0${i + 1}`}</div>
                <h3 className="mt-2 font-serif text-3xl text-white md:text-4xl">{s.name}</h3>
                <p className="mt-1 text-white/70">{s.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STORY / SPLIT ===== */}
      <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-28 md:grid-cols-2">
        <Reveal className="overflow-hidden rounded-2xl">
          <img
            src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80"
            alt="Bespoke service"
            className="h-[560px] w-full object-cover"
          />
        </Reveal>
        <Reveal y={50}>
          <p className="eyebrow mb-5">Bespoke Service</p>
          <h2 className="font-serif text-4xl md:text-6xl">
            A concierge approach to extraordinary living.
          </h2>
          <p className="mt-6 text-muted">
            From first viewing to final signature, our advisors orchestrate every
            detail with discretion — private tours, off-market access, and
            relationships built over fifteen years of trust.
          </p>
          <MagneticButton
            to="/about"
            className="sheen mt-9 rounded-sm bg-gold px-8 py-4 text-xs uppercase tracking-[0.16em] text-ink hover:bg-gold-light">
            Our Story
          </MagneticButton>
        </Reveal>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="border-y border-line bg-surface2/30 py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="eyebrow mb-10 flex justify-center">Client Voices</p>
          <div className="relative min-h-[220px]">
            {TESTIMONIALS.map((t, i) => (
              <blockquote
                key={i}
                className={`absolute inset-0 transition-all duration-700 ${
                  i === tIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}>
                <p className="font-serif text-2xl leading-snug md:text-4xl">“{t.quote}”</p>
                <footer className="mt-8">
                  <div className="text-gold">{t.name}</div>
                  <div className="text-sm text-muted">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
          <div className="mt-10 flex justify-center gap-3">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => setTIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === tIndex ? 'w-8 bg-gold' : 'w-1.5 bg-muted/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA (with interactive gold crystal) ===== */}
      <section className="relative overflow-hidden py-32">
        {/* interactive 3D crystal centerpiece */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[520px] w-[520px] max-w-[90vw] opacity-30">
            <Suspense fallback={null}>
              <Gem3D />
            </Suspense>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <p className="eyebrow mb-6 flex justify-center">Begin Your Search</p>
            <h2 className="font-serif text-4xl md:text-7xl">
              Your next address deserves more than a listing.
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <MagneticButton
                to="/properties"
                className="sheen rounded-sm bg-gold px-9 py-4 text-xs uppercase tracking-[0.16em] text-ink hover:bg-gold-light">
                Browse Properties
              </MagneticButton>
              <MagneticButton
                to="/contact"
                className="rounded-sm border border-line px-9 py-4 text-xs uppercase tracking-[0.16em] text-fg hover:border-gold hover:text-gold">
                Speak to an Advisor
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
