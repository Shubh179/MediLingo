/**
 * GPS Coordinate Utilities
 * Conversions and calculations for geographic coordinates
 */

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
}

export interface MetersCoordinate {
  x: number; // meters east
  y: number; // meters north
}

export interface Velocity {
  vLat: number; // degrees per second
  vLng: number; // degrees per second
  speedKmh?: number; // km/h
}

// Earth's radius in meters
const EARTH_RADIUS = 6371000;

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(
  coord1: GPSCoordinate,
  coord2: GPSCoordinate
): number {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLng = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

/**
 * Convert GPS coordinates to local Cartesian coordinates (meters)
 * Origin is set at the reference point
 */
export function gpsToMeters(
  coord: GPSCoordinate,
  reference: GPSCoordinate
): MetersCoordinate {
  const latDiff = coord.latitude - reference.latitude;
  const lngDiff = coord.longitude - reference.longitude;

  // Convert to meters (approximate for small distances)
  // At equator: 1 degree latitude ≈ 111,320 meters
  // 1 degree longitude ≈ 111,320 * cos(latitude) meters
  const y = latDiff * 111320; // meters north
  const x = lngDiff * 111320 * Math.cos(toRadians(reference.latitude)); // meters east

  return { x, y };
}

/**
 * Convert local Cartesian coordinates (meters) back to GPS
 */
export function metersToGPS(
  meters: MetersCoordinate,
  reference: GPSCoordinate
): GPSCoordinate {
  // Convert meters back to degrees
  const latDiff = meters.y / 111320;
  const lngDiff = meters.x / (111320 * Math.cos(toRadians(reference.latitude)));

  return {
    latitude: reference.latitude + latDiff,
    longitude: reference.longitude + lngDiff,
  };
}

/**
 * Calculate velocity from two GPS points and time difference
 * Returns velocity in degrees per second
 */
export function calculateVelocity(
  coord1: GPSCoordinate,
  coord2: GPSCoordinate,
  deltaTimeSeconds: number
): Velocity {
  if (deltaTimeSeconds <= 0) {
    return { vLat: 0, vLng: 0, speedKmh: 0 };
  }

  const vLat = (coord2.latitude - coord1.latitude) / deltaTimeSeconds;
  const vLng = (coord2.longitude - coord1.longitude) / deltaTimeSeconds;

  // Calculate speed in km/h
  const distance = haversineDistance(coord1, coord2);
  const speedKmh = (distance / deltaTimeSeconds) * 3.6; // m/s to km/h

  return { vLat, vLng, speedKmh };
}

/**
 * Calculate bearing (direction) between two GPS coordinates
 * Returns bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(
  from: GPSCoordinate,
  to: GPSCoordinate
): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  let bearing = toDegrees(Math.atan2(y, x));

  // Normalize to 0-360
  return (bearing + 360) % 360;
}

/**
 * Project GPS coordinate forward by velocity and time
 * Simple linear projection
 */
export function projectPosition(
  coord: GPSCoordinate,
  velocity: Velocity,
  deltaTimeSeconds: number
): GPSCoordinate {
  return {
    latitude: coord.latitude + velocity.vLat * deltaTimeSeconds,
    longitude: coord.longitude + velocity.vLng * deltaTimeSeconds,
  };
}

/**
 * Convert speed from km/h to degrees per second
 * (approximate, varies by latitude)
 */
export function speedToVelocity(
  speedKmh: number,
  bearing: number,
  latitude: number
): Velocity {
  // Convert km/h to m/s
  const speedMs = speedKmh / 3.6;

  // Convert bearing to radians
  const bearingRad = toRadians(bearing);

  // Calculate north and east components
  const northMs = speedMs * Math.cos(bearingRad);
  const eastMs = speedMs * Math.sin(bearingRad);

  // Convert to degrees per second
  const vLat = northMs / 111320;
  const vLng = eastMs / (111320 * Math.cos(toRadians(latitude)));

  return { vLat, vLng, speedKmh };
}

/**
 * Smooth interpolation between two GPS coordinates
 * Using cubic ease-in-out for smooth motion
 */
export function interpolateGPS(
  from: GPSCoordinate,
  to: GPSCoordinate,
  progress: number // 0 to 1
): GPSCoordinate {
  // Cubic ease-in-out
  const smoothProgress =
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  return {
    latitude: from.latitude + (to.latitude - from.latitude) * smoothProgress,
    longitude: from.longitude + (to.longitude - from.longitude) * smoothProgress,
  };
}

/**
 * Check if GPS coordinate is valid
 */
export function isValidGPS(coord: GPSCoordinate): boolean {
  return (
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180 &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude)
  );
}

/**
 * Calculate GPS accuracy degradation over time
 * Useful for adjusting measurement noise
 */
export function estimateAccuracyDegradation(
  initialAccuracyMeters: number,
  timeElapsedSeconds: number
): number {
  // Accuracy degrades over time without new measurements
  // Assume +2 meters per second uncertainty growth
  return initialAccuracyMeters + (timeElapsedSeconds * 2);
}
