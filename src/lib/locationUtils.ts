// ─── locationUtils.ts ────────────────────────────────────────────────────────
// Pure helpers: Haversine distance, proximity scoring, formatting,
// geolocation wrappers, and reverse-geocoding.
// No React imports — safe to use in hooks, services, and components.

// ─── Core geo types ───────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

/** Alias used by LocationSection / useProximityAlerts. */
export type GeoCoords = LatLng;

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied';

// ─── Haversine ────────────────────────────────────────────────────────────────

/**
 * Great-circle distance between two points, in kilometres.
 */
export function getDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Human-readable distance string.
 *   < 1 km  → "850 m"
 *   ≥ 1 km  → "3.2 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Proximity score 0–100 for use in the allocation formula.
 *   ≤ 2 km   → 90–100
 *   2–5 km   → 60–90
 *   5–10 km  → 30–60
 *   > 10 km  → 0–30
 */
export function proximityScore(km: number): number {
  if (km <= 0)  return 100;
  if (km <= 2)  return Math.round(100 - (km / 2) * 10);
  if (km <= 5)  return Math.round(90  - ((km - 2) / 3) * 30);
  if (km <= 10) return Math.round(60  - ((km - 5) / 5) * 30);
  return Math.max(0, Math.round(30 - (km - 10) * 2));
}

/**
 * Combined suitability score (0–100).
 * Weights: skill 30 %, reliability 25 %, availability 15 %, proximity 30 %
 */
export function suitabilityScore(opts: {
  skill: number;        // 0–100
  reliability: number;  // 0–100
  availability: number; // 0–100  (100 = available, 0 = not)
  distanceKm: number;
}): number {
  const p = proximityScore(opts.distanceKm);
  return Math.round(
    opts.skill        * 0.30 +
    opts.reliability  * 0.25 +
    opts.availability * 0.15 +
    p                 * 0.30,
  );
}

/**
 * Returns true when the volunteer has moved more than `thresholdM` metres
 * since the last recorded position — used to decide whether to re-upload.
 */
export function movedBeyondThreshold(
  prev: LatLng,
  next: LatLng,
  thresholdM = 200,
): boolean {
  return getDistanceKm(prev, next) * 1000 > thresholdM;
}

// ─── Browser Geolocation wrapper ─────────────────────────────────────────────

/**
 * Promise-based wrapper around the browser Geolocation API.
 * Rejects with a descriptive Error on denial or timeout.
 */
export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10_000 },
): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => {
        const msgs: Record<number, string> = {
          1: 'Location permission denied. Please allow access in your browser settings.',
          2: 'Location unavailable. Try again in a moment.',
          3: 'Location request timed out. Check your connection.',
        };
        reject(new Error(msgs[err.code] ?? 'Unknown geolocation error.'));
      },
      options,
    );
  });
}

// ─── Reverse geocoding (Nominatim, no API key needed) ────────────────────────

/**
 * Returns a short human-readable address for a lat/lng pair.
 * Falls back gracefully to coordinate string if the request fails.
 */
export async function reverseGeocode(coords: GeoCoords): Promise<string> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${coords.lat}&lon=${coords.lng}&format=json&zoom=14`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'VolunteerApp/1.0' },
    });
    if (!res.ok) throw new Error('Nominatim request failed');
    const data = await res.json() as {
      address?: {
        suburb?: string; neighbourhood?: string; city?: string;
        town?: string; village?: string; state?: string; country?: string;
      };
      display_name?: string;
    };
    const a = data.address ?? {};
    const locality = a.suburb ?? a.neighbourhood ?? a.city ?? a.town ?? a.village ?? '';
    const city     = (!locality || locality === a.city) ? '' : (a.city ?? a.town ?? '');
    const state    = a.state ?? '';
    const parts    = [locality, city, state].filter(Boolean);
    return parts.length ? parts.join(', ') : (data.display_name ?? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
  } catch {
    return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
  }
}