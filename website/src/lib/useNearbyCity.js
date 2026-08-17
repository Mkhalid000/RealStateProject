import {useCallback, useEffect, useRef, useState} from 'react';

/**
 * Resolves the visitor's current city from the browser's location permission.
 *
 * Deliberately soft-failing: if the permission is denied, unavailable, or the
 * lookup errors, `city` stays null and the caller simply shows everything.
 *
 * The reverse lookup uses BigDataCloud's client endpoint — free, keyless and
 * CORS-enabled, so it needs no billing account like the Google Geocoding API.
 */

const CACHE_KEY = 'rr_geo_city'; // {city, ts}
const CHOICE_KEY = 'rr_geo_off'; // set once the visitor asks to see everything
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (raw?.city && Date.now() - raw.ts < MAX_AGE) return raw.city;
  } catch {
    /* corrupt entry — treat as no cache */
  }
  return null;
}

function writeCache(city) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({city, ts: Date.now()}));
  } catch {
    /* private mode — we just re-ask next time */
  }
}

function coords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => resolve(p.coords),
      err => reject(err),
      {enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000},
    );
  });
}

async function cityFromCoords({latitude, longitude}) {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );
  if (!res.ok) throw new Error('reverse geocode failed');
  const d = await res.json();
  return (d.city || d.locality || d.principalSubdivision || '').trim();
}

/**
 * @returns {{city: string|null, status: string, request: Function, clear: Function}}
 * status: idle | locating | ready | denied | unavailable | off
 */
export function useNearbyCity() {
  const [city, setCity] = useState(null);
  const [status, setStatus] = useState('idle');
  const busy = useRef(false);

  const request = useCallback(async ({fresh = false} = {}) => {
    if (busy.current) return;
    busy.current = true;
    if (fresh) {
      try {
        localStorage.removeItem(CHOICE_KEY);
      } catch {
        /* ignore */
      }
    }
    setStatus('locating');
    try {
      const found = await cityFromCoords(await coords());
      if (!found) throw new Error('no city');
      writeCache(found);
      setCity(found);
      setStatus('ready');
    } catch (err) {
      // PERMISSION_DENIED === 1
      setStatus(err?.code === 1 ? 'denied' : 'unavailable');
    } finally {
      busy.current = false;
    }
  }, []);

  // First paint: reuse a recent answer, honour an earlier opt-out, else ask.
  useEffect(() => {
    let off = false;
    try {
      off = localStorage.getItem(CHOICE_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (off) {
      setStatus('off');
      return;
    }
    const cached = readCache();
    if (cached) {
      setCity(cached);
      setStatus('ready');
      return;
    }
    request();
  }, [request]);

  /** Stop filtering by the detected city. `remember` persists that choice. */
  const clear = useCallback((remember = false) => {
    setCity(null);
    setStatus('off');
    if (remember) {
      try {
        localStorage.setItem(CHOICE_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, []);

  return {city, status, request, clear};
}
