/**
 * Serves /sitemap.xml and /robots.txt from the site's own domain.
 *
 * Google ignores a sitemap hosted on a different host, and the API lives on a
 * separate one — so this proxies the API's generated sitemap through the site,
 * and writes robots.txt with the right absolute URL. Nothing here is
 * hard-coded: the API address comes from the environment, the site address
 * from the incoming request.
 */

const API_URL = (process.env.API_URL || process.env.VITE_API_URL || '').replace(/\/+$/, '');

const ROBOTS = origin => `# Aurevia Estates
User-agent: *
Allow: /

# Private areas — nothing here is useful in search results
Disallow: /admin
Disallow: /agent
Disallow: /account
Disallow: /saved
Disallow: /login

# Filter permutations are near-duplicates of the listing pages
Disallow: /properties?*&*&*

Sitemap: ${origin}/sitemap.xml
`;

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const path = (req.url || '').split('?')[0];

  if (path.includes('robots')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    res.status(200).send(ROBOTS(origin));
    return;
  }

  if (!API_URL) {
    res.status(200).setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    return;
  }

  try {
    const upstream = await fetch(
      `${API_URL}/sitemap.xml?site=${encodeURIComponent(origin)}`,
      {signal: AbortSignal.timeout(8000)},
    );
    const xml = await upstream.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // An hour at the edge — new listings still appear the same day.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(upstream.ok ? 200 : 502).send(xml);
  } catch {
    res.status(504).setHeader('Content-Type', 'text/plain');
    res.send('sitemap temporarily unavailable');
  }
}
