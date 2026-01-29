/**
 * Pure geofence service functions - no database access, no side effects
 * Earth radius: 6371km for Haversine calculations
 */

export interface Point {
  lat: number
  lng: number
}

export interface CircularGeofence {
  type: 'circle'
  centerLat: number
  centerLng: number
  radiusMeters: number
  toleranceMeters: number
}

export interface PolygonGeofence {
  type: 'polygon'
  vertices: Array<{ lat: number; lng: number }>
  toleranceMeters: number
}

export type Geofence = CircularGeofence | PolygonGeofence

export interface LocationVerificationResult {
  verified: boolean
  distanceMeters: number
  withinTolerance: boolean
  status: 'verified' | 'outside_geofence' | 'within_tolerance'
}

const EARTH_RADIUS_KM = 6371

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateHaversineDistance(
  point1: Point,
  point2: Point,
): number {
  const lat1Rad = (point1.lat * Math.PI) / 180
  const lat2Rad = (point2.lat * Math.PI) / 180
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c * 1000 // Convert to meters
}

/**
 * Verify if point is within circular geofence
 */
export function verifyPointInCircle(
  point: Point,
  center: Point,
  radiusMeters: number,
  toleranceMeters: number,
): LocationVerificationResult {
  const distanceMeters = calculateHaversineDistance(point, center)
  const verified = distanceMeters <= radiusMeters
  const withinTolerance = distanceMeters <= radiusMeters + toleranceMeters

  let status: 'verified' | 'outside_geofence' | 'within_tolerance'
  if (verified) {
    status = 'verified'
  } else if (withinTolerance) {
    status = 'within_tolerance'
  } else {
    status = 'outside_geofence'
  }

  return { verified, distanceMeters, withinTolerance, status }
}

/**
 * Check if point is inside polygon using ray-casting algorithm
 */
export function isPointInPolygon(
  point: Point,
  vertices: Array<Point>,
): boolean {
  let inside = false
  const { lat, lng } = point

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].lng
    const yi = vertices[i].lat
    const xj = vertices[j].lng
    const yj = vertices[j].lat

    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Calculate minimum distance from point to polygon boundary
 */
export function calculateDistanceToPolygon(
  point: Point,
  vertices: Array<Point>,
): number {
  let minDistance = Infinity

  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length
    const distance = distanceToLineSegment(point, vertices[i], vertices[j])
    minDistance = Math.min(minDistance, distance)
  }

  return minDistance
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point,
): number {
  const A = point.lng - lineStart.lng
  const B = point.lat - lineStart.lat
  const C = lineEnd.lng - lineStart.lng
  const D = lineEnd.lat - lineStart.lat

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx: number, yy: number

  if (param < 0) {
    xx = lineStart.lng
    yy = lineStart.lat
  } else if (param > 1) {
    xx = lineEnd.lng
    yy = lineEnd.lat
  } else {
    xx = lineStart.lng + param * C
    yy = lineStart.lat + param * D
  }

  return calculateHaversineDistance(point, { lat: yy, lng: xx })
}

/**
 * Validate coordinate values
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Verify location against geofence (dispatcher function)
 */
export function verifyLocationInGeofence(
  coords: Point,
  geofence: Geofence,
): LocationVerificationResult {
  if (!validateCoordinates(coords.lat, coords.lng)) {
    return {
      verified: false,
      distanceMeters: 0,
      withinTolerance: false,
      status: 'outside_geofence',
    }
  }

  if (geofence.type === 'circle') {
    const center = { lat: geofence.centerLat, lng: geofence.centerLng }
    return verifyPointInCircle(
      coords,
      center,
      geofence.radiusMeters,
      geofence.toleranceMeters,
    )
  }

  // polygon type
  const inside = isPointInPolygon(coords, geofence.vertices)
  const distanceMeters = inside
    ? 0
    : calculateDistanceToPolygon(coords, geofence.vertices)
  const withinTolerance = inside || distanceMeters <= geofence.toleranceMeters

  let status: 'verified' | 'outside_geofence' | 'within_tolerance'
  if (inside) {
    status = 'verified'
  } else if (withinTolerance) {
    status = 'within_tolerance'
  } else {
    status = 'outside_geofence'
  }

  return { verified: inside, distanceMeters, withinTolerance, status }
}
