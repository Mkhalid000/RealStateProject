/**
 * CDN image helpers.
 *
 * Property photos come straight off a phone camera (3–8 MB, 4000px wide) and
 * were previously rendered at their original size into 300px cards — that is
 * what made the site feel slow. ImageKit and Unsplash can both resize and
 * re-encode at the edge, so every <img> should ask for the size it actually
 * paints. `imgUrl` rewrites a URL to do that; anything we don't recognise is
 * returned untouched.
 */

const MAX_W = 2400;

function isImageKit(src) {
  return src.includes('imagekit.io');
}
function isUnsplash(src) {
  return src.includes('images.unsplash.com');
}

/**
 * @param {string} src   original image URL
 * @param {object} opts
 * @param {number} [opts.w]     target width in CSS px (device pixels are handled by srcSet)
 * @param {number} [opts.h]     target height, when the crop is fixed
 * @param {number} [opts.q=70]  quality, 1–100
 * @param {number} [opts.blur]  ImageKit blur level — for tiny placeholders
 */
export function imgUrl(src, {w, h, q = 70, blur} = {}) {
  if (!src || typeof src !== 'string') return src;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  const width = w ? Math.min(Math.round(w), MAX_W) : undefined;
  const [base, query] = src.split('?');
  const params = new URLSearchParams(query || '');

  if (isImageKit(src)) {
    // f-auto serves AVIF/WebP to browsers that accept it.
    const tr = ['f-auto', `q-${q}`];
    if (width) tr.push(`w-${width}`);
    if (h) tr.push(`h-${Math.round(h)}`);
    if (width && h) tr.push('c-maintain_ratio');
    if (blur) tr.push(`bl-${blur}`);
    params.set('tr', tr.join(','));
    return `${base}?${params.toString()}`;
  }

  if (isUnsplash(src)) {
    params.set('auto', 'format');
    if (!params.has('fit')) params.set('fit', 'crop');
    if (width) params.set('w', String(width));
    if (h) params.set('h', String(Math.round(h)));
    params.set('q', String(q));
    return `${base}?${params.toString()}`;
  }

  return src;
}

/** Can this URL be resized at the edge? (Local/unknown hosts can't.) */
export function isResizable(src) {
  return typeof src === 'string' && (isImageKit(src) || isUnsplash(src));
}

/**
 * Retina-aware srcSet for a layout width: 1x, 1.5x and 2x variants so phones
 * on slow networks don't download a desktop-sized file.
 */
export function imgSrcSet(src, w, opts = {}) {
  if (!w || !isResizable(src)) return undefined;
  const widths = [...new Set([w, Math.round(w * 1.5), w * 2].map(x => Math.min(Math.round(x), MAX_W)))];
  return widths.map(x => `${imgUrl(src, {...opts, w: x})} ${x}w`).join(', ');
}

/** Blurred ~24px thumbnail used as an instant background while the real file arrives. */
export function lqip(src) {
  if (!isResizable(src)) return undefined;
  return imgUrl(src, {w: 24, q: 20, blur: 6});
}
