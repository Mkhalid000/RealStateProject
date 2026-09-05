import {useState} from 'react';
import {Reveal} from '../components/Reveal';
import {MagneticButton} from '../components/MagneticButton';
import {ImageReveal} from '../components/ImageReveal';
import {Seo, breadcrumbs} from '../components/Seo';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const input =
    'w-full rounded-md border border-line bg-transparent px-4 py-3.5 text-sm outline-none transition-colors focus:border-gold mb-4';

  return (
    <div className="relative">
      <Seo
        title="Contact Aurevia — speak with an advisor"
        description="Buying, selling or simply exploring? Our advisors reply the same day, with complete discretion."
        jsonLd={breadcrumbs([{name: 'Home', path: '/'}, {name: 'Contact', path: '/contact'}])}
      />
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-32">
        <Reveal>
          <p className="eyebrow mb-4">Get in Touch</p>
          <h1 className="font-serif text-5xl md:text-7xl">Speak with an advisor</h1>
          <p className="mt-4 max-w-xl text-muted">
            Whether buying, selling or simply exploring, our team is ready to
            assist with complete discretion.
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-14 md:grid-cols-2">
          <Reveal>
            <form
              onSubmit={e => {
                e.preventDefault();
                setSent(true);
              }}
              className="glass rounded-2xl p-8 shadow-soft">
              {sent ? (
                <p className="font-serif text-2xl text-gold">
                  Thank you — an advisor will be in touch shortly.
                </p>
              ) : (
                <>
                  <input className={input} placeholder="Full name" required />
                  <input className={input} type="email" placeholder="Email" required />
                  <input className={input} placeholder="Phone" />
                  <textarea className={input} rows={5} placeholder="How can we help?" />
                  <MagneticButton className="w-full rounded-md bg-gold py-3.5 text-xs uppercase tracking-[0.16em] text-ink hover:bg-gold-light">
                    Send Message
                  </MagneticButton>
                </>
              )}
            </form>
          </Reveal>

          <Reveal y={50}>
            <h3 className="font-serif text-3xl">Aurevia Estates</h3>
            <div className="mt-6 space-y-2 leading-loose text-muted">
              <p>5th Avenue, New York, NY</p>
              <p>+1 (000) 000-0000</p>
              <p>hello@aurevia.com</p>
            </div>
            <div className="mt-8 leading-loose text-muted">
              <p>Monday – Saturday</p>
              <p>9:00 AM – 8:00 PM</p>
            </div>
            <ImageReveal
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
              alt="Office"
              className="mt-10 rounded-2xl border border-line"
              imgClassName="h-64"
            />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
