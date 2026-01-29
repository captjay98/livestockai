/**
 * Property-based tests for geofence service functions.
 * Uses fast-check to verify mathematical properties hold across all inputs.
 *
 * **Validates: Requirements 4.2, 4.4, 5.2, 5.3, 5.4**
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { Point } from '~/features/digital-foreman/geofence-service'
import {
  calculateHaversineDistance,
  isPointInPolygon,
  validateCoordinates,
  verifyLocationInGeofence,
  verifyPointInCircle,
} from '~/features/digital-foreman/geofence-service'

// Arbitraries for valid coordinates
const validLatitude = fc.double({ min: -90, max: 90, noNaN: true })
const validLongitude = fc.double({ min: -180, max: 180, noNaN: true })
const validPoint = fc.record({ lat: validLatitude, lng: validLongitude })

// Arbitrary for positive distances
const positiveDistance = fc.double({ min: 0.1, max: 100000, noNaN: true })

describe('Geofence Service - Property Tests', () => {
  describe('calculateHaversineDistance', () => {
    /**
     * Property 3: Haversine Distance Calculation
     * - Distance is always non-negative
     * - Distance is symmetric (d(A,B) = d(B,A))
     * - Distance from point to itself is zero
     */
    it('should always return non-negative distance', () => {
      fc.assert(
        fc.property(validPoint, validPoint, (p1, p2) => {
          const distance = calculateHaversineDistance(p1, p2)
          expect(distance).toBeGreaterThanOrEqual(0)
        }),
        { numRuns: 100 },
      )
    })

    it('should be symmetric (d(A,B) = d(B,A))', () => {
      fc.assert(
        fc.property(validPoint, validPoint, (p1, p2) => {
          const d1 = calculateHaversineDistance(p1, p2)
          const d2 = calculateHaversineDistance(p2, p1)
          expect(d1).toBeCloseTo(d2, 6)
        }),
        { numRuns: 100 },
      )
    })

    it('should return zero for identical points', () => {
      fc.assert(
        fc.property(validPoint, (p) => {
          const distance = calculateHaversineDistance(p, p)
          expect(distance).toBe(0)
        }),
        { numRuns: 50 },
      )
    })

    it('should satisfy triangle inequality', () => {
      fc.assert(
        fc.property(validPoint, validPoint, validPoint, (p1, p2, p3) => {
          const d12 = calculateHaversineDistance(p1, p2)
          const d23 = calculateHaversineDistance(p2, p3)
          const d13 = calculateHaversineDistance(p1, p3)
          // d(A,C) <= d(A,B) + d(B,C) with small tolerance for floating point
          expect(d13).toBeLessThanOrEqual(d12 + d23 + 0.001)
        }),
        { numRuns: 50 },
      )
    })
  })

  describe('verifyPointInCircle', () => {
    /**
     * Property 1: Geofence Point-in-Circle Verification
     * - Points at center are always verified
     * - Points beyond radius + tolerance are never verified
     * - Tolerance extends the verification boundary
     */
    it('should verify points at the center', () => {
      fc.assert(
        fc.property(
          validPoint,
          positiveDistance,
          positiveDistance,
          (center, radius, tolerance) => {
            const result = verifyPointInCircle(
              center,
              center,
              radius,
              tolerance,
            )
            expect(result.verified).toBe(true)
            expect(result.distanceMeters).toBe(0)
            expect(result.status).toBe('verified')
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should return consistent status based on distance', () => {
      fc.assert(
        fc.property(
          validPoint,
          validPoint,
          positiveDistance,
          positiveDistance,
          (point, center, radius, tolerance) => {
            const result = verifyPointInCircle(point, center, radius, tolerance)

            if (result.distanceMeters <= radius) {
              expect(result.verified).toBe(true)
              expect(result.status).toBe('verified')
            } else if (result.distanceMeters <= radius + tolerance) {
              expect(result.verified).toBe(false)
              expect(result.withinTolerance).toBe(true)
              expect(result.status).toBe('within_tolerance')
            } else {
              expect(result.verified).toBe(false)
              expect(result.withinTolerance).toBe(false)
              expect(result.status).toBe('outside_geofence')
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('validateCoordinates', () => {
    /**
     * Property 20: Coordinate Validation
     * - Valid coordinates are within [-90,90] for lat and [-180,180] for lng
     * - Boundary values are valid
     */
    it('should accept valid coordinates', () => {
      fc.assert(
        fc.property(validLatitude, validLongitude, (lat, lng) => {
          expect(validateCoordinates(lat, lng)).toBe(true)
        }),
        { numRuns: 100 },
      )
    })

    it('should reject invalid latitudes', () => {
      const invalidLat = fc.oneof(
        fc.double({ min: 90.001, max: 1000, noNaN: true }),
        fc.double({ min: -1000, max: -90.001, noNaN: true }),
      )
      fc.assert(
        fc.property(invalidLat, validLongitude, (lat, lng) => {
          expect(validateCoordinates(lat, lng)).toBe(false)
        }),
        { numRuns: 50 },
      )
    })

    it('should reject invalid longitudes', () => {
      const invalidLng = fc.oneof(
        fc.double({ min: 180.001, max: 1000, noNaN: true }),
        fc.double({ min: -1000, max: -180.001, noNaN: true }),
      )
      fc.assert(
        fc.property(validLatitude, invalidLng, (lat, lng) => {
          expect(validateCoordinates(lat, lng)).toBe(false)
        }),
        { numRuns: 50 },
      )
    })

    it('should accept boundary values', () => {
      expect(validateCoordinates(90, 180)).toBe(true)
      expect(validateCoordinates(-90, -180)).toBe(true)
      expect(validateCoordinates(0, 0)).toBe(true)
    })
  })

  describe('isPointInPolygon', () => {
    /**
     * Property 2: Geofence Point-in-Polygon Verification
     * - Points inside a simple square should be detected
     * - Points outside should not be detected
     */
    it('should detect points inside a square', () => {
      // Simple square from (0,0) to (1,1)
      const square: Array<Point> = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 1 },
        { lat: 1, lng: 1 },
        { lat: 1, lng: 0 },
      ]

      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 0.99, noNaN: true }),
          fc.double({ min: 0.01, max: 0.99, noNaN: true }),
          (lat, lng) => {
            expect(isPointInPolygon({ lat, lng }, square)).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should reject points outside a square', () => {
      const square: Array<Point> = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 1 },
        { lat: 1, lng: 1 },
        { lat: 1, lng: 0 },
      ]

      // Points clearly outside
      expect(isPointInPolygon({ lat: 2, lng: 2 }, square)).toBe(false)
      expect(isPointInPolygon({ lat: -1, lng: 0.5 }, square)).toBe(false)
      expect(isPointInPolygon({ lat: 0.5, lng: -1 }, square)).toBe(false)
    })
  })

  describe('verifyLocationInGeofence', () => {
    it('should reject invalid coordinates', () => {
      const geofence = {
        type: 'circle' as const,
        centerLat: 0,
        centerLng: 0,
        radiusMeters: 1000,
        toleranceMeters: 100,
      }

      const result = verifyLocationInGeofence({ lat: 100, lng: 0 }, geofence)
      expect(result.verified).toBe(false)
      expect(result.status).toBe('outside_geofence')
    })

    it('should dispatch to circle verification for circle geofences', () => {
      fc.assert(
        fc.property(
          validPoint,
          positiveDistance,
          positiveDistance,
          (center, radius, tolerance) => {
            const geofence = {
              type: 'circle' as const,
              centerLat: center.lat,
              centerLng: center.lng,
              radiusMeters: radius,
              toleranceMeters: tolerance,
            }

            const result = verifyLocationInGeofence(center, geofence)
            expect(result.verified).toBe(true)
            expect(result.status).toBe('verified')
          },
        ),
        { numRuns: 50 },
      )
    })
  })
})
