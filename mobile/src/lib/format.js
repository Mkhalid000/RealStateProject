/** Shared display formatters. */

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70';

export function money(price, currency = 'USD') {
  const n = Number(price) || 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

/** Compact money for tight spots: $1.2M / $850K. */
export function moneyShort(price, currency = 'USD') {
  const n = Number(price) || 0;
  const sym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '';
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return `${sym}${n}`;
}

export function locationLine(p) {
  return (
    [p.locality, p.city].filter(Boolean).join(', ') ||
    p.locationText ||
    p.city ||
    'Location on request'
  );
}

export function coverImage(p) {
  return p?.imageUrls?.length ? p.imageUrls[0] : FALLBACK_IMG;
}

export function listingLabel(p) {
  return p?.listingType === 'rent' ? 'For Rent' : 'For Sale';
}

export function compactCount(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export {FALLBACK_IMG};
