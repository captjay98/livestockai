import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateDistance, getBoundingBox } from '~/features/marketplace/distance-calculator'

describe('distance-calculator properties', () => {
  const latitude = fc.float({ min: -90, max: 90 })
  const longitude = fc.float({ min: -180, max: 180 })
  const radius = fc.float({ min: 0.1, max: 1000 })

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
          expect(distAC).toBeLessThanOrEqual(distAB + distBC + 1e-10)
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
      fc.assert(
        fc.property(latitude, longitude, radius, latitude, longitude, (centerLat, centerLon, radiusKm, pointLat, pointLon) => {
          const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon)
          
          if (distance <= radiusKm) {
            const bbox = getBoundingBox(centerLat, centerLon, radiusKm)
            expect(pointLat).toBeGreaterThanOrEqual(bbox.minLat)
            expect(pointLat).toBeLessThanOrEqual(bbox.maxLat)
            expect(pointLon).toBeGreaterThanOrEqual(bbox.minLon)
            expect(pointLon).toBeLessThanOrEqual(bbox.maxLon)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})