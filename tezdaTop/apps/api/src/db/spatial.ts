// Spatial calculations adhering to PostGIS geography(Point, 4326) spherical metrics

/**
 * Calculates Haversine great-circle distance between two (lat, lng) points in metres
 */
export function calculateDistanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Validates search radius: must be between 50m and 3000m (50 to 3km)
 */
export function isValidRadius(radiusM: number): boolean {
  return Number.isInteger(radiusM) && radiusM >= 50 && radiusM <= 3000;
}

/**
 * Checks if target location is within radiusM from origin
 */
export function isWithinDistance(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
  radiusM: number
): boolean {
  const dist = calculateDistanceMetres(originLat, originLng, targetLat, targetLng);
  return dist <= radiusM;
}
