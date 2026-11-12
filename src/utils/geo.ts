export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (coord1.latitude * Math.PI) / 180;
  const phi2 = (coord2.latitude * Math.PI) / 180;
  const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isWithinGeofence(
  voterCoord: Coordinates,
  targetCoord: Coordinates,
  maxRadiusMeters: number
): boolean {
  const distance = calculateDistanceMeters(voterCoord, targetCoord);
  return distance <= maxRadiusMeters;
}

export function normalizeGeoHierarchy(geo: {
  country?: string;
  county?: string;
  constituency?: string;
  ward?: string;
  region?: string;
}): string {
  return [geo.country, geo.region, geo.county, geo.constituency, geo.ward]
    .filter(Boolean)
    .map((s) => s?.trim().toLowerCase())
    .join('::');
}
