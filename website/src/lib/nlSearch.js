/**
 * Turns a sentence into listing filters.
 *
 * "3bhk under 60 lakh in kolar with parking" →
 *   {bhk: '3', max: '6000000', locality: 'Kolar Road', amenities: 'Parking'}
 *
 * Deliberately rule-based rather than a model call: the vocabulary of an Indian
 * property search is small and fixed, and this has to run on every keystroke for
 * free. Anything it can't classify is left in `q` so the server still searches
 * for it.
 */

const TYPE_WORDS = {
  apartment: ['apartment', 'apartments', 'flat', 'flats'],
  villa: ['villa', 'villas', 'bungalow', 'bungalows', 'duplex', 'kothi'],
  plot: ['plot', 'plots', 'land', 'jameen', 'zameen'],
  commercial: ['commercial'],
  office: ['office', 'offices', 'workspace'],
  shop: ['shop', 'shops', 'showroom', 'retail'],
};

const FURNISHING_WORDS = {
  furnished: ['fully furnished', 'furnished'],
  semi_furnished: ['semi furnished', 'semi-furnished', 'half furnished'],
  unfurnished: ['unfurnished', 'bare shell'],
};

const AMENITY_WORDS = {
  Parking: ['parking', 'car park'],
  Lift: ['lift', 'elevator'],
  'Swimming Pool': ['pool', 'swimming'],
  Gym: ['gym', 'fitness'],
  Garden: ['garden', 'lawn'],
  'Power Backup': ['power backup', 'generator', 'dg'],
  'Security Guard': ['security', 'guard'],
  CCTV: ['cctv'],
  'Club House': ['club house', 'clubhouse'],
  'Kids Play Area': ['play area', 'kids area'],
  'Metro Nearby': ['metro'],
  'School Nearby': ['school'],
  'Pet Zone': ['pet friendly', 'pet zone'],
  'EV Charging': ['ev charging', 'ev charger'],
};

/** "60 lakh" / "1.2cr" / "45k" / "8500000" → a number of rupees. */
function money(amount, unit) {
  const n = parseFloat(amount);
  if (!Number.isFinite(n)) return null;
  const u = (unit || '').toLowerCase();
  if (u.startsWith('cr') || u.startsWith('crore')) return Math.round(n * 10000000);
  if (u.startsWith('l') || u.startsWith('lakh') || u.startsWith('lac')) return Math.round(n * 100000);
  if (u === 'k' || u.startsWith('thousand')) return Math.round(n * 1000);
  if (u === 'm' || u.startsWith('million')) return Math.round(n * 1000000);
  // A bare number that looks like a price in lakhs ("under 60") is read as lakhs.
  if (!u && n < 1000) return Math.round(n * 100000);
  return Math.round(n);
}

const AMOUNT = String.raw`(\d+(?:\.\d+)?)\s*(cr(?:ore)?s?|lakhs?|lacs?|l\b|k\b|m\b|million|thousand)?`;

/**
 * @param {string} input raw text from the search box
 * @param {{cities?: string[], localities?: string[]}} places known place names,
 *        used so "in kolar" can resolve to a real locality rather than free text
 * @returns {{params: Record<string,string>, chips: {label: string}[], rest: string}}
 */
export function parseSearch(input, places = {}) {
  let text = ` ${String(input || '').toLowerCase()} `;
  const params = {};
  const chips = [];

  const take = (re, handler) => {
    text = text.replace(re, (...args) => (handler(...args) === false ? args[0] : ' '));
  };

  // ── listing type ──
  if (/\b(for rent|on rent|rental|rent|kiraya|lease)\b/.test(text)) {
    params.listing = 'rent';
    chips.push({label: 'For rent'});
    text = text.replace(/\b(for rent|on rent|rental|rent|kiraya|lease)\b/g, ' ');
  } else if (/\b(for sale|to buy|buy|purchase|sale|kharid)\b/.test(text)) {
    params.listing = 'buy';
    chips.push({label: 'For sale'});
    text = text.replace(/\b(for sale|to buy|buy|purchase|sale|kharid)\b/g, ' ');
  }

  // ── bhk / bedrooms ──
  take(/\b(\d)\s*(?:bhk|bedroom|bed|br)\b/g, (_, n) => {
    params.bhk = n;
    chips.push({label: `${n} BHK`});
  });

  // ── bathrooms ──
  take(/\b(\d)\s*(?:bath|bathroom|washroom|toilet)s?\b/g, (_, n) => {
    params.baths = n;
    chips.push({label: `${n}+ bath`});
  });

  // ── price ──
  take(new RegExp(String.raw`\b(?:under|below|less than|upto|up to|max|within)\s*(?:rs\.?|inr|₹)?\s*${AMOUNT}`, 'g'), (_, a, u) => {
    const v = money(a, u);
    if (!v) return false;
    params.max = String(v);
    chips.push({label: `under ${short(v)}`});
  });
  take(new RegExp(String.raw`\b(?:above|over|more than|min|starting|from)\s*(?:rs\.?|inr|₹)?\s*${AMOUNT}`, 'g'), (_, a, u) => {
    const v = money(a, u);
    if (!v) return false;
    params.min = String(v);
    chips.push({label: `over ${short(v)}`});
  });
  // "between 50 and 80 lakh"
  take(new RegExp(String.raw`\bbetween\s*(?:rs\.?|inr|₹)?\s*${AMOUNT}\s*(?:and|to|-)\s*(?:rs\.?|inr|₹)?\s*${AMOUNT}`, 'g'), (_, a1, u1, a2, u2) => {
    const lo = money(a1, u1 || u2);
    const hi = money(a2, u2 || u1);
    if (!lo || !hi) return false;
    params.min = String(Math.min(lo, hi));
    params.max = String(Math.max(lo, hi));
    chips.push({label: `${short(lo)}–${short(hi)}`});
  });

  // ── area ──
  take(/\b(\d{3,6})\s*(?:sq\.?\s?ft|sqft|square feet|feet)\b/g, (_, n) => {
    params.minArea = n;
    chips.push({label: `${n}+ sqft`});
  });

  // ── property type ──
  for (const [type, words] of Object.entries(TYPE_WORDS)) {
    const hit = words.find(w => new RegExp(`\\b${w}\\b`).test(text));
    if (hit) {
      params.type = type;
      chips.push({label: cap(type)});
      text = text.replace(new RegExp(`\\b${hit}\\b`, 'g'), ' ');
      break;
    }
  }

  // ── furnishing ──
  for (const [value, words] of Object.entries(FURNISHING_WORDS)) {
    const hit = words.find(w => text.includes(w));
    if (hit) {
      params.furnishing = value;
      chips.push({label: cap(value.replace(/_/g, ' '))});
      text = text.replace(hit, ' ');
      break;
    }
  }

  // ── amenities ──
  const amenities = [];
  for (const [amenity, words] of Object.entries(AMENITY_WORDS)) {
    const hit = words.find(w => text.includes(w));
    if (hit) {
      amenities.push(amenity);
      text = text.replace(hit, ' ');
    }
  }
  if (amenities.length) {
    params.amenities = amenities.join(',');
    amenities.forEach(a => chips.push({label: a}));
  }

  // ── flags ──
  if (/\bfeatured\b/.test(text)) {
    params.featured = 'true';
    chips.push({label: 'Featured'});
    text = text.replace(/\bfeatured\b/g, ' ');
  }
  if (/\bnegotiable\b/.test(text)) {
    params.negotiable = 'true';
    chips.push({label: 'Negotiable'});
    text = text.replace(/\bnegotiable\b/g, ' ');
  }

  // ── place ── known localities first (more specific), then cities
  const localities = places.localities || [];
  const cities = places.cities || [];

  const place =
    findPlace(text, localities, 'locality', params, chips) ||
    findPlace(text, cities, 'city', params, chips);
  if (place) text = place.text;

  // whatever survives is a free-text term
  const rest = text.replace(/\b(in|at|near|around|with|and|the|a|property|properties|home|homes|house)\b/g, ' ')
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (rest) params.q = rest;

  return {params, chips, rest};
}

function findPlace(text, names, key, params, chips) {
  // longest name first, so "north goa" beats "goa"
  const sorted = [...names].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    const n = String(name).toLowerCase();
    if (!n || n.length < 3) continue;
    if (new RegExp(`\\b${escapeRe(n)}\\b`).test(text)) {
      params[key] = name;
      chips.push({label: `in ${name}`});
      return {text: text.replace(new RegExp(`\\b${escapeRe(n)}\\b`, 'g'), ' ')};
    }
  }
  return null;
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/** ₹ shorthand used in the chips. */
export function short(n) {
  if (!Number.isFinite(n)) return '';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 ? 1 : 0)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return `₹${n}`;
}

/** The parsed filters as a listings-page query string. */
export function toQueryString(params) {
  return new URLSearchParams(params).toString();
}
