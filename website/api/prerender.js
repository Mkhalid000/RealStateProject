/**
 * Server-side head injection for the SPA.
 *
 * The app writes its own title/meta once React runs, which Google is happy
 * with — but WhatsApp, LinkedIn, Slack, X and Bing never execute JavaScript,
 * so to them every URL looked identical. This function serves the same built
 * shell with the real title, description, canonical, Open Graph tags and
 * JSON-LD already in the HTML.
 *
 * It is deliberately fail-open: any error and the untouched shell goes out, so
 * a metadata hiccup can never take the site down.
 */

const API_URL = (process.env.API_URL || process.env.VITE_API_URL || '').replace(/\/+$/, '');
/** Metadata is stable for minutes at a time; the CDN does the heavy lifting. */
const CACHE = 'public, s-maxage=300, stale-while-revalidate=86400';

const escapeAttr = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Strip the tags we are about to replace, so nothing is duplicated. */
function stripDefaults(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:(title|description|type|url|image|site_name)"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:(card|title|description|image)"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '');
}

function buildHead(meta, url) {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  const canonical = escapeAttr(meta.canonical || url);
  const image = meta.image ? escapeAttr(meta.image) : null;

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${
      meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    }" />`,
    !meta.noindex ? `<link rel="canonical" href="${canonical}" />` : '',
    `<meta property="og:site_name" content="Aurevia" />`,
    `<meta property="og:type" content="${escapeAttr(meta.type || 'website')}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    image ? `<meta property="og:image" content="${image}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    image ? `<meta name="twitter:image" content="${image}" />` : '',
    meta.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(
          /</g,
          '\\u003c',
        )}</script>`
      : '',
  ];

  return tags.filter(Boolean).join('\n    ');
}

export function injectMeta(html, meta, url) {
  const head = buildHead(meta, url);
  return stripDefaults(html).replace(/<head>/i, `<head>\n    ${head}`);
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const path = req.url || '/';
  const url = `${origin}${path}`;

  let html = '';
  try {
    // The build output is a real file, so this request is not rewritten back
    // into this function — no loop.
    const shell = await fetch(`${origin}/index.html`, {
      headers: {'x-prerender': '1'},
    });
    html = await shell.text();
  } catch {
    res.status(302).setHeader('Location', '/index.html');
    res.end();
    return;
  }

  if (API_URL) {
    try {
      const metaRes = await fetch(
        `${API_URL}/meta?path=${encodeURIComponent(path)}&site=${encodeURIComponent(origin)}`,
        {signal: AbortSignal.timeout(2500)},
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta?.title) html = injectMeta(html, meta, url);
      }
    } catch {
      // metadata unavailable — ship the shell as it is
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', CACHE);
  res.status(200).send(html);
}
