import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

/**
 * Per-page head tags, without a dependency.
 *
 * A single-page app ships one index.html, so every route would otherwise share
 * one title and one description. This writes the real ones — plus canonical,
 * Open Graph, Twitter and JSON-LD — as each page mounts, and puts the defaults
 * back when it unmounts so nothing leaks between routes.
 *
 * The tags it writes are marked data-seo so it only ever touches its own.
 */

const SITE_NAME = 'Aurevia';
const DEFAULT_TITLE = 'Aurevia — Luxury Real Estate';
const DEFAULT_DESCRIPTION =
  "Discover the world's most exceptional homes. Aurevia — luxury real estate, reimagined.";

/** Where the site is served from — used to build absolute URLs. */
export const siteOrigin = () =>
  (import.meta.env?.VITE_SITE_URL || window.location.origin).replace(/\/+$/, '');

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('data-seo', '');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"][data-seo]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('data-seo', '');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * @param {object}  p
 * @param {string}  [p.title]        page title (site name is appended)
 * @param {string}  [p.description]
 * @param {string}  [p.image]        absolute or CDN image for link previews
 * @param {string}  [p.canonical]    absolute URL; defaults to the current path
 * @param {boolean} [p.noindex]      keep this page out of search results
 * @param {string}  [p.type]         Open Graph type — website | article
 * @param {object|object[]} [p.jsonLd] structured data for rich results
 */
export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  canonical,
  noindex = false,
  type = 'website',
  jsonLd,
}) {
  const {pathname, search} = useLocation();

  useEffect(() => {
    const fullTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME}`
      : DEFAULT_TITLE;
    const url = canonical || `${siteOrigin()}${pathname}${search || ''}`;
    const img = image
      ? image.startsWith('http')
        ? image
        : `${siteOrigin()}${image}`
      : undefined;

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', {name: 'description', content: description});
    upsertMeta('meta[name="robots"][data-seo]', {
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    });

    // Open Graph — what WhatsApp, LinkedIn and Facebook read
    upsertMeta('meta[property="og:title"]', {property: 'og:title', content: fullTitle});
    upsertMeta('meta[property="og:description"]', {property: 'og:description', content: description});
    upsertMeta('meta[property="og:type"]', {property: 'og:type', content: type});
    upsertMeta('meta[property="og:url"]', {property: 'og:url', content: url});
    upsertMeta('meta[property="og:site_name"]', {property: 'og:site_name', content: SITE_NAME});
    if (img) upsertMeta('meta[property="og:image"]', {property: 'og:image', content: img});

    // Twitter/X
    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: img ? 'summary_large_image' : 'summary',
    });
    upsertMeta('meta[name="twitter:title"]', {name: 'twitter:title', content: fullTitle});
    upsertMeta('meta[name="twitter:description"]', {name: 'twitter:description', content: description});
    if (img) upsertMeta('meta[name="twitter:image"]', {name: 'twitter:image', content: img});

    upsertLink('canonical', noindex ? null : url);

    // structured data
    document.head.querySelectorAll('script[data-seo-jsonld]').forEach(n => n.remove());
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      blocks.filter(Boolean).forEach(block => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', '');
        script.textContent = JSON.stringify(block);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.title = DEFAULT_TITLE;
      document.head.querySelectorAll('script[data-seo-jsonld]').forEach(n => n.remove());
    };
  }, [title, description, image, canonical, noindex, type, jsonLd, pathname, search]);

  return null;
}

/* ── JSON-LD builders ─────────────────────────────────────────────────── */

export function breadcrumbs(trail) {
  const origin = siteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${origin}${t.path}`,
    })),
  };
}

export function organizationJsonLd() {
  const origin = siteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Aurevia Estates',
    url: origin,
    logo: `${origin}/logo.png`,
    description: DEFAULT_DESCRIPTION,
    email: 'hello@aurevia.com',
    areaServed: 'India',
  };
}

export function websiteJsonLd() {
  const origin = siteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/properties?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Rich result for one listing. */
export function propertyJsonLd(p) {
  const origin = siteOrigin();
  const area = p.carpetArea ?? p.superBuiltUpArea ?? p.plotArea;
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    url: `${origin}/properties/${p.id}/${p.slug}`,
    description: p.description || undefined,
    image: (p.imageUrls || []).slice(0, 6),
    datePosted: p.createdAt,
    offers: {
      '@type': 'Offer',
      price: Number(p.price) || 0,
      priceCurrency: p.currency || 'USD',
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.address || undefined,
      addressLocality: p.locality || p.city || undefined,
      addressRegion: p.state || undefined,
      postalCode: p.pincode || undefined,
      addressCountry: p.country || 'IN',
    },
    geo:
      p.latitude != null && p.longitude != null
        ? {'@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude}
        : undefined,
    numberOfRooms: p.bhk ?? undefined,
    numberOfBathroomsTotal: p.bathrooms ?? undefined,
    floorSize: area ? {'@type': 'QuantitativeValue', value: area, unitCode: 'FTK'} : undefined,
  };
}

/** Rich result for one article. */
export function articleJsonLd(post) {
  const origin = siteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.guestAuthorName || post.author?.fullName || 'Aurevia Editorial',
    },
    publisher: {'@type': 'Organization', name: 'Aurevia Estates', url: origin},
    articleSection: post.category?.name || undefined,
    keywords: post.tags?.join(', ') || undefined,
    mainEntityOfPage: `${origin}/blog/${post.slug}`,
  };
}

/** Listing pages: the grid as an ItemList, which Google reads as a collection. */
export function itemListJsonLd(items, pathFor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteOrigin()}${pathFor(it)}`,
      name: it.title,
    })),
  };
}
