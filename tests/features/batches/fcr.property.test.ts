import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

describe('FCR (Feed Conversion Ratio) Property Tests', () => {
  /**
   * Calculate FCR: Feed consumed / Weight gained
   */
  function calculateFCR(feedKg: number, weightGainKg: number): number {
    if (weightGainKg === 0) return 0
    return feedKg / weightGainKg
  }

  describe('Property 1: FCR is always non-negative', () => {
    it('should never return negative FCR', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (feed, weight) => {
            const fcr = calculateFCR(feed, weight)
            expect(fcr).toBeGreaterThanOrEqual(0)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 2: FCR formula correctness', () => {
    it('should equal feed / weight', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (feed, weight) => {
            const fcr = calculateFCR(feed, weight)
            const expected = feed / weight
            expect(Math.abs(fcr - expected)).toBeLessThan(0.0001)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 3: FCR increases with more feed (weight constant)', () => {
    it('should increase when feed increases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (baseFeed, weight, additionalFeed) => {
            const fcr1 = calculateFCR(baseFeed, weight)
            const fcr2 = calculateFCR(baseFeed + additionalFeed, weight)
            expect(fcr2).toBeGreaterThanOrEqual(fcr1)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 4: FCR decreases with more weight (feed constant)', () => {
    it('should decrease when weight increases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (feed, baseWeight, additionalWeight) => {
            const fcr1 = calculateFCR(feed, baseWeight)
            const fcr2 = calculateFCR(feed, baseWeight + additionalWeight)
            expect(fcr2).toBeLessThanOrEqual(fcr1)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 5: FCR of 1 means equal feed and weight', () => {
    it('should equal 1 when feed equals weight', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (value) => {
          const fcr = calculateFCR(value, value)
          expect(Math.abs(fcr - 1)).toBeLessThan(0.0001)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 6: FCR handles zero feed', () => {
    it('should return 0 when no feed consumed', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (weight) => {
          const fcr = calculateFCR(0, weight)
          expect(fcr).toBe(0)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 7: FCR handles zero weight gain', () => {
    it('should return 0 when no weight gained', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000 }), (feed) => {
          const fcr = calculateFCR(feed, 0)
          expect(fcr).toBe(0)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 8: FCR is commutative in ratio', () => {
    it('should maintain ratio when both values scaled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 2, max: 10 }),
          (feed, weight, scale) => {
            const fcr1 = calculateFCR(feed, weight)
            const fcr2 = calculateFCR(feed * scale, weight * scale)
            expect(Math.abs(fcr1 - fcr2)).toBeLessThan(0.0001)
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
