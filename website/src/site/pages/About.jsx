import {Reveal} from '../components/Reveal';
import {Counter} from '../components/Counter';
import {ImageReveal} from '../components/ImageReveal';
import {Seo, breadcrumbs} from '../components/Seo';

const IMG =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80';

const VALUES = [
  {t: 'Discretion', d: 'Private listings and confidential transactions, always.'},
  {t: 'Curation', d: 'Only residences that meet an uncompromising standard.'},
  {t: 'Devotion', d: 'A dedicated advisor for every client, every step.'},
];

export default function About() {
  return (
    <div className="relative">
      <Seo
        title="About Aurevia — fifteen years of exceptional homes"
        description="Aurevia represents landmark residences across the world's most coveted addresses — with discretion, curation and devotion."
        jsonLd={breadcrumbs([{name: 'Home', path: '/'}, {name: 'About', path: '/about'}])}
      />
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-32">
        <Reveal>
          <p className="eyebrow mb-4">Our Story</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-tight md:text-7xl">
            Fifteen years of defining what luxury living means.
          </h1>
        </Reveal>

        <div className="mt-16 grid items-center gap-16 md:grid-cols-2">
          <ImageReveal src={IMG} alt="Aurevia" className="rounded-2xl" imgClassName="h-[520px]" />
          <Reveal y={50}>
            <p className="text-xl leading-relaxed">
              Aurevia was founded on a simple conviction: that a home is the most
              personal expression of how we wish to live. For over a decade we have
              represented landmark residences across the world's most coveted
              addresses.
            </p>
            <p className="mt-6 leading-relaxed text-muted">
              Our advisors are not salespeople. They are curators — pairing
              discerning clients with properties of genuine distinction, guided by
              taste, trust and absolute discretion.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                {v: 15, s: '', l: 'Years'},
                {v: 320, s: '+', l: 'Listings'},
                {v: 48, s: '', l: 'Cities'},
              ].map(x => (
                <div key={x.l}>
                  <div className="font-serif text-4xl text-gold">
                    <Counter value={x.v} suffix={x.s} />
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-luxe text-muted">{x.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal stagger={0.12} className="mt-24 grid gap-7 md:grid-cols-3">
          {VALUES.map(v => (
            <div
              key={v.t}
              className="group rounded-2xl border border-line bg-surface/70 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-gold/50 hover:shadow-glow">
              <h3 className="font-serif text-3xl text-gold">{v.t}</h3>
              <p className="mt-3 text-muted">{v.d}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </div>
  );
}
