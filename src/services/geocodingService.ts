import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapboxConfig';

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Cache for geocoding results (24 hour expiry)
const CACHE_KEY_PREFIX = 'geocache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  results: GeocodingResult[];
  timestamp: number;
}

const getFromCache = (query: string): GeocodingResult[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + query.toLowerCase());
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY_PREFIX + query.toLowerCase());
      return null;
    }
    return entry.results;
  } catch {
    return null;
  }
};

const setCache = (query: string, results: GeocodingResult[]) => {
  try {
    const entry: CacheEntry = { results, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY_PREFIX + query.toLowerCase(), JSON.stringify(entry));
  } catch {
    // Storage full or unavailable, ignore
  }
};

// Search for locations using Mapbox Geocoding (faster than Nominatim)
export const searchLocation = async (query: string): Promise<GeocodingResult[]> => {
  if (!query || query.length < 3) return [];

  // Check cache first
  const cached = getFromCache(query);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5&country=pk`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();
    
    const results = data.features.map((item: any) => ({
      lat: item.center[1],
      lng: item.center[0],
      displayName: item.place_name,
    }));

    // Cache results
    setCache(query, results);
    
    return results;
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

// Reverse geocode coordinates to address using Mapbox
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) throw new Error('Reverse geocoding failed');

    const data = await response.json();
    return data.features[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);
