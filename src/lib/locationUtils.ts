// ─── Location Types ───────────────────────────────────────────────────────────

export interface GeoCoords {
  lat: number;
  lng: number;
}

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

// ─── Haversine Distance ───────────────────────────────────────────────────────

/**
 * Returns distance in kilometres between two lat/lng points.
 * Uses the Haversine formula (spherical Earth approximation).
 */
export function getDistanceKm(a: GeoCoords, b: GeoCoords): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Human-readable distance label. e.g. "0.8 km" or "12.4 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Proximity score 0–100: 0 km → 100, ≥20 km → 0. Linear decay.
 */
export function proximityScore(km: number): number {
  return Math.max(0, Math.round(100 - km * 5));
}

// ─── Browser Geolocation ──────────────────────────────────────────────────────

export interface GeolocationResult {
  coords?: GeoCoords;
  status: LocationStatus;
  error?: string;
}

/**
 * Wraps browser geolocation in a Promise.
 * Resolves with coords on success, rejects with a user-friendly error.
 */
export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please enable it in your browser settings.',
          2: 'Location unavailable. Try again in a moment.',
          3: 'Location request timed out. Check your connection and try again.',
        };
        reject(new Error(messages[err.code] ?? 'Unknown location error.'));
      },
      options
    );
  });
}

// ─── Reverse Geocoding (OpenStreetMap Nominatim — free, no key) ───────────────

export async function reverseGeocode(coords: GeoCoords): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    const { suburb, city_district, city, town, state_district, state } = data.address ?? {};
    // Return a short neighbourhood + city string
    const area = suburb ?? city_district ?? town ?? '';
    const cityName = city ?? state_district ?? state ?? '';
    return [area, cityName].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || 'Unknown location';
  } catch {
    return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
  }
}