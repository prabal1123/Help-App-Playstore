// ─── Distance & Alert Evaluation Utilities ───────────────────────────────────

export const HOME_RADIUS_METERS = 50;

/**
 * Haversine formula — returns distance in metres between two lat/lng points.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns whether the user is outside ALL safe zones.
 */
export function isUserOutsideZones(
  lat: number,
  lng: number,
  zones: any[]
): boolean {
  if (zones.length === 0) return false;
  return !zones.some(
    (z) =>
      calculateDistance(z.center_lat, z.center_lng, lat, lng) <= z.radius_meters
  );
}

/**
 * Returns whether the user is away from their home location.
 */
export function isUserAwayFromHome(
  lat: number,
  lng: number,
  home: { latitude: number; longitude: number } | null
): boolean {
  if (!home) return false;
  return (
    calculateDistance(home.latitude, home.longitude, lat, lng) >
    HOME_RADIUS_METERS
  );
}