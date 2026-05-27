import {useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {Reveal} from '../components/Reveal';
import {MagneticButton} from '../components/MagneticButton';
import {ImageReveal} from '../components/ImageReveal';

const FALLBACK =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';

function money(price, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

export default function PropertyDetail() {
  const {id} = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    apiFetch(`/properties/${id}`)
      .then(setP)
      .catch(e => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-40 text-center">
        <p className="text-muted">Property not found.</p>
        <Link
          to="/properties"
          className="mt-6 inline-block text-sm uppercase tracking-[0.16em] text-gold">
          ← Back to Properties
        </Link>
      </div>
    );
  }
  if (!p) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-40">
        <div className="h-[60vh] animate-pulse rounded-2xl border border-line bg-surface2/40" />
      </div>
    );
  }

  const images = p.imageUrls?.length ? p.imageUrls : [FALLBACK];

  return (
    <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-28">
      <ImageReveal
        key={active}
        src={images[active]}
        alt={p.title}
        className="rounded-2xl"
        imgClassName="h-[62vh]"
      />

      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-20 w-28 overflow-hidden rounded-md border transition ${
                i === active ? 'border-gold' : 'border-line opacity-60 hover:opacity-100'
              }`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-14 grid items-start gap-14 lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <span className="rounded-full border border-line px-4 py-1 text-[11px] uppercase tracking-[0.15em] text-gold">
            {p.type}
          </span>
          <h1 className="mt-5 font-serif text-4xl md:text-6xl">{p.title}</h1>
          <p className="mt-3 font-serif text-4xl text-gold">{money(p.price, p.currency)}</p>
          <p className="mt-2 text-muted">{p.locationText || 'Location available on request'}</p>

          <div className="mt-8 flex flex-wrap gap-10 border-y border-line py-6 text-muted">
            {p.bedrooms != null && (
              <div>
                <div className="font-serif text-3xl text-fg">{p.bedrooms}</div>
                <div className="text-xs uppercase tracking-luxe">Bedrooms</div>
              </div>
            )}
            {p.bathrooms != null && (
              <div>
                <div className="font-serif text-3xl text-fg">{p.bathrooms}</div>
                <div className="text-xs uppercase tracking-luxe">Bathrooms</div>
              </div>
            )}
            {p.areaSqft != null && (
              <div>
                <div className="font-serif text-3xl text-fg">{p.areaSqft}</div>
                <div className="text-xs uppercase tracking-luxe">Sq Ft</div>
              </div>
            )}
          </div>

          <p className="mt-8 leading-relaxed text-fg/80">
            {p.description ||
              'A truly exceptional residence. Contact our advisors for full details and private viewings.'}
          </p>

          {p.amenities?.length > 0 && (
            <div className="mt-10">
              <h4 className="text-xs uppercase tracking-luxe text-muted">Amenities</h4>
              <div className="mt-4 flex flex-wrap gap-3">
                {p.amenities.map(a => (
                  <span key={a} className="rounded-full border border-gold/40 px-4 py-1.5 text-sm text-gold">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Reveal>

        {/* sticky enquiry */}
        <Reveal y={50}>
          <div className="glass sticky top-28 rounded-2xl p-7 shadow-soft">
            <h3 className="font-serif text-2xl">Enquire</h3>
            <p className="mb-5 mt-1 text-sm text-muted">
              {p.agent?.fullName ? `Listed by ${p.agent.fullName}` : 'Speak with an Aurevia advisor'}
            </p>
            {['Your name', 'Email'].map(ph => (
              <input
                key={ph}
                placeholder={ph}
                className="mb-3 w-full rounded-md border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-gold"
              />
            ))}
            <textarea
              rows={4}
              placeholder="I'd like a private viewing…"
              className="mb-4 w-full rounded-md border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-gold"
            />
            <MagneticButton className="w-full rounded-md bg-gold py-3.5 text-xs uppercase tracking-[0.16em] text-ink hover:bg-gold-light">
              Request Viewing
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
