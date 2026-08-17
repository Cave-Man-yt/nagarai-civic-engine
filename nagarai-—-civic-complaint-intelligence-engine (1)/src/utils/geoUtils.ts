import { LandmarkPOI } from '../types';

/**
 * Calculates the Haversine distance between two coordinates in meters.
 */
export function getHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Built-in civic landmarks for real-world simulation in demo city (Chennai / Bangalore / Delhi civic grid)
export const KNOWN_CIVIC_LANDMARKS: Array<{
  name: string;
  type: 'school' | 'hospital' | 'metro' | 'market' | 'temple';
  lat: number;
  lng: number;
}> = [
  { name: 'Kendriya Vidyalaya Senior Secondary School', type: 'school', lat: 13.0827, lng: 80.2707 },
  { name: 'St. Mary’s Anglo-Indian Girls School', type: 'school', lat: 13.0855, lng: 80.2785 },
  { name: 'Government General Hospital (Rajiv Gandhi)', type: 'hospital', lat: 13.0812, lng: 80.2762 },
  { name: 'Apollo Speciality Children’s Hospital', type: 'hospital', lat: 13.0604, lng: 80.2496 },
  { name: 'Central Metro Interchange Station', type: 'metro', lat: 13.0824, lng: 80.2755 },
  { name: 'Anna Nagar West Bus Terminus', type: 'metro', lat: 13.0878, lng: 80.2088 },
  { name: 'Koyambedu Wholesale Market Complex', type: 'market', lat: 13.0694, lng: 80.1948 },
  { name: 'T. Nagar Ranganathan Commercial Hub', type: 'market', lat: 13.0405, lng: 80.2337 },
];

/**
 * Finds nearby landmarks within 1.5 km of a given location.
 */
export function findNearbyLandmarks(lat: number, lng: number): LandmarkPOI[] {
  return KNOWN_CIVIC_LANDMARKS.map((landmark) => {
    const dist = getHaversineDistanceMeters(lat, lng, landmark.lat, landmark.lng);
    return {
      name: landmark.name,
      type: landmark.type,
      distanceMeters: dist,
      coordinates: { lat: landmark.lat, lng: landmark.lng },
    };
  })
    .filter((l) => l.distanceMeters <= 1200)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Computes the geometric centroid of a set of coordinates.
 */
export function calculateCentroid(points: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 13.0827, lng: 80.2707 };
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: Number((sum.lat / points.length).toFixed(6)),
    lng: Number((sum.lng / points.length).toFixed(6)),
  };
}

/**
 * Computes maximum radius of spread across points in meters.
 */
export function calculateSpreadRadiusMeters(
  centroid: { lat: number; lng: number },
  points: Array<{ lat: number; lng: number }>
): number {
  if (points.length <= 1) return 30; // base visual circle
  let maxDist = 30;
  for (const p of points) {
    const dist = getHaversineDistanceMeters(centroid.lat, centroid.lng, p.lat, p.lng);
    if (dist > maxDist) maxDist = dist;
  }
  return Math.min(maxDist + 20, 250);
}
