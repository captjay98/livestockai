import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { calculateDistance, getBoundingBox } from '~/features/marketplace/distance-calculator'

describe('distance-calculator properties', () => {
  const latitude = fc.double({ min: -90, max: 90, noNaN: true })
  const longitude = fc.double({ min: -180, max: 180, noNaN: true })
  const radius = fc.double({ min: 0.1, max: 1000, noNaN: true })

  describe('Property 12: Distance Calculation (Haversine)', () => {
    it('symmetry: distance(A,B) === distance(B,A)', () => {
      fc.assert(
        fc.property(latitude, longitude, latitude, longitude, (lat1, lon1, lat2, lon2) => {
          const distAB = calculateDistance(lat1, lon1, lat2, lon2)
          const distBA = calculateDistance(lat2, lon2, lat1, lon1)
          expect(Math.abs(distAB - distBA)).toBeLessThan(1e-10)
        }),
        { numRuns: 100 }
      )
    })

    it('triangle inequality: distance(A,C) <= distance(A,B) + distance(B,C)', () => {
      fc.assert(
        fc.property(latitude, longitude, latitude, longitude, latitude, longitude, (lat1, lon1, lat2, lon2, lat3, lon3) => {
          const distAC = calculateDistance(lat1, lon1, lat3, lon3)
          const distAB = calculateDistance(lat1, lon1, lat2, lon2)
          const distBC = calculateDistance(lat2, lon2, lat3, lon3)
          // Allow small tolerance for floating point errors
          expect(distAC).toBeLessThanOrEqual(distAB + distBC + 0.001)
        }),
        { numRuns: 100 }
      )
    })

    it('same point: distance(A,A) === 0', () => {
      fc.assert(
        fc.property(latitude, longitude, (lat, lon) => {
          const distance = calculateDistance(lat, lon, lat, lon)
          expect(distance).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('non-negative: distance always >= 0', () => {
      fc.assert(
        fc.property(latitude, longitude, latitude, longitude, (lat1, lon1, lat2, lon2) => {
          const distance = calculateDistance(lat1, lon1, lat2, lon2)
          expect(distance).toBeGreaterThanOrEqual(0)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 26: Bounding Box Contains Distance Results', () => {
    it('points within radius must be inside bounding box', () => {
      // Use constrained longitude to avoid date line edge cases
      const safeLongitude = fc.double({ min: -170, max: 170, noNaN: true })
      
      fc.assert(
        fc.property(latitude, safeLongitude, radius, latitude, safeLongitude, (centerLat, centerLon, radiusKm, pointLat, pointLon) => {
          const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon)
          
          // Only test if point is clearly within radius (with margin for floating point)
          if (distance <= radiusKm * 0.99) {
            const bbox = getBoundingBox(centerLat, centerLon, radiusKm)
            // Allow small tolerance for edge cases
            expect(pointLat).toBeGreaterThanOrEqual(bbox.minLat - 0.001)
            expect(pointLat).toBeLessThanOrEqual(bbox.maxLat + 0.001)
            expect(pointLon).toBeGreaterThanOrEqual(bbox.minLon - 0.001)
            expect(pointLon).toBeLessThanOrEqual(bbox.maxLon + 0.001)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})