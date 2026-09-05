import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PrismaService} from '../prisma/prisma.service';
import {BlogStatus} from '../shared';

/** Pages that always exist, with the weight we want crawlers to give them. */
const STATIC_ROUTES: {path: string; changefreq: string; priority: string}[] = [
  {path: '/', changefreq: 'daily', priority: '1.0'},
  {path: '/properties', changefreq: 'hourly', priority: '0.9'},
  {path: '/blog', changefreq: 'daily', priority: '0.8'},
  {path: '/about', changefreq: 'monthly', priority: '0.5'},
  {path: '/contact', changefreq: 'monthly', priority: '0.5'},
  {path: '/post-property', changefreq: 'monthly', priority: '0.6'},
  {path: '/privacy', changefreq: 'yearly', priority: '0.2'},
];

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const day = (d: Date | null | undefined) =>
  (d ?? new Date()).toISOString().slice(0, 10);

@Injectable()
export class SeoService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** The public site's origin — the sitemap must contain absolute URLs. */
  private origin(site?: string): string {
    const raw =
      site ||
      this.config.get<string>('SITE_URL') ||
      (this.config.get<string>('CORS_ORIGINS') ?? '').split(',')[0].trim() ||
      'http://localhost:3000';
    return raw.replace(/\/+$/, '');
  }

  async sitemap(site?: string): Promise<string> {
    const origin = this.origin(site);

    const [properties, posts, categories] = await Promise.all([
      this.prisma.property.findMany({
        where: {isVerified: true, status: 'active'},
        select: {id: true, slug: true, updatedAt: true},
        orderBy: {updatedAt: 'desc'},
        take: 5000,
      }),
      this.prisma.blogPost.findMany({
        where: {
          status: BlogStatus.PUBLISHED as any,
          isVerified: true,
          noIndex: false,
          OR: [{publishedAt: null}, {publishedAt: {lte: new Date()}}],
        },
        select: {slug: true, updatedAt: true},
        orderBy: {updatedAt: 'desc'},
        take: 5000,
      }),
      this.prisma.blogCategory.findMany({select: {slug: true, updatedAt: true}}),
    ]);

    const urls: string[] = [];
    const push = (loc: string, lastmod: string, changefreq: string, priority: string) =>
      urls.push(
        `  <url>\n    <loc>${esc(origin + loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
      );

    const today = day(new Date());
    STATIC_ROUTES.forEach(r => push(r.path, today, r.changefreq, r.priority));

    properties.forEach(p =>
      push(`/properties/${p.id}/${p.slug}`, day(p.updatedAt), 'weekly', '0.8'),
    );
    posts.forEach(p => push(`/blog/${p.slug}`, day(p.updatedAt), 'weekly', '0.7'));
    categories.forEach(c =>
      push(`/blog?category=${c.slug}`, day(c.updatedAt), 'weekly', '0.4'),
    );

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
      '',
    ].join('\n');
  }

  /**
   * Title/description/image for one site path. Used by the prerender function
   * so link previews and non-JS crawlers see the real page, not the shell.
   */
  async metaForPath(path: string, site?: string) {
    const origin = this.origin(site);
    const [pathname, search = ''] = path.split('?');
    const clean = pathname.replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(search);

    const base = {
      title: 'Aurevia — Luxury Real Estate',
      description:
        "Discover the world's most exceptional homes. Aurevia — luxury real estate, reimagined.",
      image: null as string | null,
      canonical: `${origin}${clean === '/' ? '' : clean}`,
      type: 'website',
      noindex: false,
      jsonLd: null as unknown,
    };

    // ── a single listing ──
    const propertyMatch = clean.match(/^\/properties\/([^/]+)(?:\/([^/]+))?$/);
    if (propertyMatch) {
      const p = await this.prisma.property.findFirst({
        where: {OR: [{id: propertyMatch[1]}, {slug: propertyMatch[1]}]},
        include: {agent: {select: {fullName: true}}},
      });
      if (!p) return {...base, noindex: true};

      const where =
        [p.locality, p.city, p.state].filter(Boolean).join(', ') || p.locationText || '';
      const price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: p.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(Number(p.price) || 0);

      const specs = [
        p.bhk ? `${p.bhk} BHK` : null,
        p.bathrooms ? `${p.bathrooms} bath` : null,
        p.carpetArea || p.superBuiltUpArea
          ? `${p.carpetArea ?? p.superBuiltUpArea} sqft`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');

      return {
        ...base,
        title: `${p.title}${where ? ` — ${where}` : ''} | Aurevia`,
        description:
          (p.description || '').slice(0, 180).replace(/\s+/g, ' ').trim() ||
          `${specs || p.type} ${p.listingType === 'rent' ? 'for rent' : 'for sale'}${
            where ? ` in ${where}` : ''
          } at ${price}.`,
        image: p.imageUrls[0] ?? null,
        canonical: `${origin}/properties/${p.id}/${p.slug}`,
        type: 'article',
        noindex: !p.isVerified || p.status !== 'active',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: p.title,
          url: `${origin}/properties/${p.id}/${p.slug}`,
          description: p.description ?? undefined,
          image: p.imageUrls.slice(0, 6),
          datePosted: p.createdAt.toISOString(),
          offers: {
            '@type': 'Offer',
            price: Number(p.price) || 0,
            priceCurrency: p.currency || 'USD',
            availability: 'https://schema.org/InStock',
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: p.address ?? undefined,
            addressLocality: p.locality ?? p.city ?? undefined,
            addressRegion: p.state ?? undefined,
            postalCode: p.pincode ?? undefined,
            addressCountry: p.country ?? 'IN',
          },
          geo:
            p.latitude != null && p.longitude != null
              ? {'@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude}
              : undefined,
          numberOfRooms: p.bhk ?? undefined,
          numberOfBathroomsTotal: p.bathrooms ?? undefined,
          floorSize:
            p.carpetArea || p.superBuiltUpArea
              ? {
                  '@type': 'QuantitativeValue',
                  value: p.carpetArea ?? p.superBuiltUpArea,
                  unitCode: 'FTK',
                }
              : undefined,
        },
      };
    }

    // ── a blog article ──
    const postMatch = clean.match(/^\/blog\/([^/]+)$/);
    if (postMatch) {
      const post = await this.prisma.blogPost.findFirst({
        where: {OR: [{id: postMatch[1]}, {slug: postMatch[1]}]},
        include: {author: {select: {fullName: true}}, category: true},
      });
      if (!post) return {...base, noindex: true};

      const live =
        post.status === (BlogStatus.PUBLISHED as any) &&
        post.isVerified &&
        (!post.publishedAt || post.publishedAt <= new Date());

      return {
        ...base,
        title: post.metaTitle || `${post.title} | Aurevia Journal`,
        description:
          post.metaDescription ||
          post.excerpt ||
          (post.content || '').slice(0, 180).replace(/\s+/g, ' ').trim(),
        image: post.ogImageUrl || post.coverImageUrl,
        canonical: post.canonicalUrl || `${origin}/blog/${post.slug}`,
        type: 'article',
        noindex: post.noIndex || !live,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
          datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
          dateModified: post.updatedAt.toISOString(),
          author: {
            '@type': 'Person',
            name: post.guestAuthorName || post.author?.fullName || 'Aurevia Editorial',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Aurevia Estates',
            url: origin,
          },
          articleSection: post.category?.name ?? undefined,
          keywords: post.tags.join(', ') || undefined,
          mainEntityOfPage: `${origin}/blog/${post.slug}`,
        },
      };
    }

    // ── listings index, with or without filters ──
    if (clean === '/properties') {
      const city = params.get('city');
      const type = params.get('type');
      const listing = params.get('listing');
      const filters = [...params.keys()].filter(k => !['view', 'sort', 'page'].includes(k));

      const what = [
        type ? type.split(',')[0] : 'Properties',
        listing === 'rent' ? 'for rent' : listing === 'buy' ? 'for sale' : null,
        city ? `in ${city}` : null,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        ...base,
        title: `${cap(what)} | Aurevia`,
        description: city
          ? `Browse verified ${type || 'properties'} ${
              listing === 'rent' ? 'for rent' : 'for sale'
            } in ${city}, with photos, prices and direct owner contact.`
          : base.description,
        // One or two filters stay indexable (they are real landing pages);
        // deeper combinations are near-duplicates, so they point home.
        canonical:
          filters.length <= 2 && (city || type || listing)
            ? `${origin}/properties?${new URLSearchParams(
                [...params.entries()].filter(([k]) => ['city', 'type', 'listing'].includes(k)),
              ).toString()}`
            : `${origin}/properties`,
        noindex: filters.length > 2,
      };
    }

    if (clean === '/blog') {
      const category = params.get('category');
      return {
        ...base,
        title: category
          ? `${cap(category.replace(/-/g, ' '))} | Aurevia Journal`
          : 'The Journal — property guides & market insight | Aurevia',
        description:
          'Buying guides, market reading and design thinking from the Aurevia desk — written for people making a decision.',
        canonical: category ? `${origin}/blog?category=${category}` : `${origin}/blog`,
      };
    }

    // ── everything else ──
    const STATIC_META: Record<string, {title: string; description: string; noindex?: boolean}> = {
      '/': {
        title: 'Aurevia — Luxury Real Estate',
        description:
          "Discover the world's most exceptional homes. Verified listings, private viewings and free property posting.",
      },
      '/about': {
        title: 'About Aurevia — fifteen years of exceptional homes',
        description:
          'Aurevia represents landmark residences across the world’s most coveted addresses. Discretion, curation and devotion.',
      },
      '/contact': {
        title: 'Contact Aurevia — speak with an advisor',
        description:
          'Buying, selling or simply exploring? Our advisors reply the same day, with complete discretion.',
      },
      '/post-property': {
        title: 'Post your property free | Aurevia',
        description:
          'List your home, plot or commercial space at no cost. Verified in hours, seen by serious buyers.',
      },
      '/privacy': {
        title: 'Privacy & Cookie Policy | Aurevia',
        description:
          'How Aurevia collects, uses and protects your information — and exactly what we store in your browser.',
      },
      '/reels': {
        title: 'Property reels — walk-throughs in sixty seconds | Aurevia',
        description: 'Short video tours of the homes on Aurevia, from the agents who list them.',
      },
      '/map': {
        title: 'Map explorer — search property by neighbourhood | Aurevia',
        description: 'Explore verified listings on the map, by locality and price.',
      },
      '/saved': {title: 'Saved & alerts | Aurevia', description: 'Your shortlist and saved searches.', noindex: true},
      '/login': {title: 'Sign in | Aurevia', description: 'Sign in to Aurevia.', noindex: true},
    };

    const hit = STATIC_META[clean];
    if (hit) {
      return {...base, title: hit.title, description: hit.description, noindex: Boolean(hit.noindex)};
    }
    // Dashboard, account and anything unknown must never be indexed.
    if (/^\/(admin|agent|account)(\/|$)/.test(clean)) {
      return {...base, noindex: true};
    }
    return base;
  }
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
