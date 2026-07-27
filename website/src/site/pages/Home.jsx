import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {gsap, ScrollTrigger} from '../../lib/gsap';
import {apiFetch} from '../../lib/api';
import {Reveal} from '../components/Reveal';
import {Counter} from '../components/Counter';
import {Marquee} from '../components/Marquee';
import {MagneticButton} from '../components/MagneticButton';
import {PropertyCard, PropertyCardSkeleton} from '../components/PropertyCard';
import {AdSlot} from '../components/AdSlot';

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
  {value: 120, suffix: '+', label: 'Private Listings'},
  {value: 18, suffix: '', label: 'Global Cities'},
  {value: 1.4, prefix: '₹', suffix: 'M', decimals: 1, label: 'Property Sold'},
  {value: 10, suffix: '', label: 'Years of Trust'},
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
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [tIndex, setTIndex] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [searchType, setSearchType] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (searchQ.trim()) sp.set('q', searchQ.trim());
    if (searchType) sp.set('type', searchType);
    navigate(sp.toString() ? `/properties?${sp.toString()}` : '/properties');
  }

  useEffect(() => {
    apiFetch('/properties?limit=6')
      .then(r => setFeatured(r.items || []))
      .catch(() => setFeatured([]))
      .finally(() => {
        setLoadingFeatured(false);
        ScrollTrigger.refresh();
      });
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
          <form
            onSubmit={handleSearch}
            className="hero-fade glass mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl !bg-white/85 p-3 shadow-soft sm:flex-row sm:items-center">
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/50"
              placeholder="Search by city, type, or address…"
            />
            <select
              value={searchType}
              onChange={e => setSearchType(e.target.value)}
              className="bg-transparent px-4 py-3 text-sm text-ink outline-none [&>option]:text-ink">
              <option value="">Any type</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="plot">Plot</option>
              <option value="commercial">Commercial</option>
              <option value="office">Office</option>
              <option value="shop">Shop</option>
            </select>
            <button
              type="submit"
              className="sheen rounded-xl bg-gold px-7 py-3 text-center text-xs uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-light">
              Search
            </button>
          </form>
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
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <Reveal>
          <p className="eyebrow mb-2">The Collection</p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl font-serif text-4xl md:text-6xl">Featured Residences</h2>
            <Link to="/properties" className="text-sm uppercase tracking-[0.16em] text-gold hover:text-gold-light">
              View all →
            </Link>
          </div>
        </Reveal>

        {loadingFeatured ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 6}).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <Reveal stagger={0.1} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </Reveal>
        ) : (
          <Reveal className="mt-14 rounded-2xl border border-line bg-surface2/20 py-20 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-surface2 text-muted">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
                <path d="M9.5 12.5h5M4 4l16 16" />
              </svg>
            </div>
            <p className="font-serif text-2xl">No residences yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Our collection is being curated. Please check back shortly, or speak
              to an advisor about off-market opportunities.
            </p>
            <Link
              to="/contact"
              className="mt-7 inline-flex rounded-full border border-gold/60 bg-gold/10 px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink">
              Speak to an Advisor
            </Link>
          </Reveal>
        )}

        {!loadingFeatured && featured.length > 0 && (
          <div className="mt-10 flex justify-end">
            <Link
              to="/properties"
              className="group inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-ink">
              See more
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        <AdSlot slot="home_after_featured" variant="strip" className="mt-16" />
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
