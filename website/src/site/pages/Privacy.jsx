import {useEffect} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Reveal} from '../components/Reveal';
import {Seo, breadcrumbs} from '../components/Seo';

const UPDATED = 'August 2026';

const SECTIONS = [
  {id: 'collect', label: 'What we collect'},
  {id: 'use', label: 'How we use it'},
  {id: 'cookies', label: 'Cookie policy'},
  {id: 'location', label: 'Location data'},
  {id: 'sharing', label: 'Who we share with'},
  {id: 'retention', label: 'Retention & security'},
  {id: 'rights', label: 'Your rights'},
  {id: 'contact', label: 'Contact us'},
];

function Section({id, title, children}) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-line pt-10">
      <h2 className="font-serif text-3xl text-fg md:text-4xl">{title}</h2>
      <div className="mt-5 space-y-4 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

/** Bulleted definition row, used for the cookie/storage table. */
function Item({name, children}) {
  return (
    <li className="border-l-2 border-gold/40 pl-4">
      <span className="font-medium text-fg">{name}</span>
      <span className="block text-sm">{children}</span>
    </li>
  );
}

export default function Privacy() {
  const {hash} = useLocation();

  /* The layout's ScrollToTop runs after this page's effects, so jumping to an
     anchor (e.g. /privacy#cookies) has to wait a frame to win. */
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (window.__lenis) window.__lenis.scrollTo(el, {offset: -110});
      else el.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
    return () => cancelAnimationFrame(raf);
  }, [hash]);

  return (
    <div className="relative">
      <Seo
        title="Privacy & Cookie Policy"
        description="How Aurevia collects, uses and protects your information — and exactly what we store in your browser."
        jsonLd={breadcrumbs([{name: 'Home', path: '/'}, {name: 'Privacy', path: '/privacy'}])}
      />
      <div className="mx-auto max-w-4xl px-6 pb-28 pt-32">
        <Reveal>
          <p className="eyebrow mb-4">Legal</p>
          <h1 className="font-serif text-5xl md:text-7xl">Privacy &amp; Cookie Policy</h1>
          <p className="mt-4 text-muted">
            How Aurevia collects, uses and protects the information you share with
            us — and exactly what we store in your browser.
          </p>
          <p className="mt-3 text-sm text-muted/80">Last updated: {UPDATED}</p>
        </Reveal>

        {/* quick jump */}
        <Reveal y={30}>
          <nav className="mt-10 flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-line px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-gold/50 hover:text-gold">
                {s.label}
              </a>
            ))}
          </nav>
        </Reveal>

        <div className="mt-14 space-y-12">
          <Section id="collect" title="What we collect">
            <p>
              We only ask for what a property search actually needs. Depending on
              how you use Aurevia, that can include:
            </p>
            <ul className="space-y-3">
              <Item name="Account details">
                Your name, email address, phone number and password (stored only
                as a one-way hash) when you register or sign in.
              </Item>
              <Item name="Listing details">
                Everything you enter when posting a property — its address,
                specifications, photographs, brochure and the owner or agent
                contact details you choose to publish.
              </Item>
              <Item name="Enquiries">
                The name, contact details and message you submit through an
                enquiry or contact form, so an advisor can reply.
              </Item>
              <Item name="Approximate location">
                Only if you grant your browser's location permission — see{' '}
                <a href="#location" className="text-gold underline-offset-4 hover:underline">Location data</a>.
              </Item>
              <Item name="Usage information">
                Standard technical data such as your IP address, browser type and
                the pages you view, which our servers log to keep the service
                secure and working.
              </Item>
            </ul>
          </Section>

          <Section id="use" title="How we use it">
            <p>We use this information to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>show you listings, and keep you signed in between visits;</li>
              <li>publish the properties you submit, once verified by our team;</li>
              <li>pass your enquiry to the relevant agent or advisor;</li>
              <li>show listings in your own city when you allow it;</li>
              <li>measure which listings and promotions perform well; and</li>
              <li>detect abuse, fraudulent listings and security incidents.</li>
            </ul>
            <p>
              We do not sell your personal information, and we do not use your
              details for advertising outside Aurevia.
            </p>
          </Section>

          <Section id="cookies" title="Cookie policy">
            <p>
              Aurevia keeps a small amount of data in your browser's local
              storage rather than in tracking cookies. Nothing here is used to
              profile you across other websites. Specifically:
            </p>
            <ul className="space-y-3">
              <Item name="Session tokens">
                Keep you signed in and refresh your session, so you don't have to
                log in on every visit. Cleared when you sign out.
              </Item>
              <Item name="Cookie notice acknowledgement">
                Remembers that you've seen this notice, so the bar doesn't return
                on every page.
              </Item>
              <Item name="Detected city">
                Your city and your choice to see all cities instead, kept for up
                to seven days so we don't ask for location on every visit.
              </Item>
              <Item name="Display preferences">
                Small interface choices such as your light or dark theme, and
                promotional cards you have dismissed.
              </Item>
            </ul>
            <p>
              You can clear all of it at any time from your browser's settings
              (“Clear browsing data” → site data). Doing so signs you out and
              resets the choices above; the site continues to work normally.
            </p>
          </Section>

          <Section id="location" title="Location data">
            <p>
              When you open the property listings, your browser may ask whether
              Aurevia can use your location. If you allow it, we convert those
              coordinates into a city name and use it to show nearby residences
              first. We store only that city name in your browser — never your
              precise coordinates, and never on our servers.
            </p>
            <p>
              If you decline, nothing breaks: the full collection is shown
              instead. You can revoke the permission at any time from your
              browser's site settings.
            </p>
          </Section>

          <Section id="sharing" title="Who we share with">
            <p>
              We share information only with the service providers that make the
              site work, and only as far as needed:
            </p>
            <ul className="space-y-3">
              <Item name="Media hosting">
                Listing photographs, videos and brochures are stored and
                delivered by our media provider.
              </Item>
              <Item name="Maps">
                The map explorer loads map tiles from Google Maps, which receives
                the map area being viewed.
              </Item>
              <Item name="Location lookup">
                Coordinates you consent to share are sent to a reverse-geocoding
                service to obtain a city name.
              </Item>
              <Item name="Agents and owners">
                Your enquiry — and only your enquiry — is passed to the agent or
                owner of the property you contacted.
              </Item>
            </ul>
            <p>
              We may also disclose information where the law requires it, or to
              protect the rights and safety of our users.
            </p>
          </Section>

          <Section id="retention" title="Retention &amp; security">
            <p>
              Account and listing data is kept while your account is active.
              Enquiries are retained for as long as needed to follow up and to
              keep a record of the transaction. Passwords are hashed, traffic is
              encrypted in transit, and access to production data is limited to
              the people who operate the service.
            </p>
          </Section>

          <Section id="rights" title="Your rights">
            <p>
              You can ask us to show you the personal information we hold about
              you, correct it, or delete your account and its listings. Write to
              us and we will respond within a reasonable period. Deleting your
              account removes your listings from the public site.
            </p>
          </Section>

          <Section id="contact" title="Contact us">
            <p>
              Questions about this policy, or about the data we hold? Reach us at{' '}
              <a href="mailto:hello@aurevia.com" className="text-gold underline-offset-4 hover:underline">
                hello@aurevia.com
              </a>{' '}
              or through the{' '}
              <Link to="/contact" className="text-gold underline-offset-4 hover:underline">
                contact page
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
