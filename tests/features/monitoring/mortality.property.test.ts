import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

describe('Mortality Rate Property Tests', () => {
  /**
   * Calculate mortality rate: (deaths / initial quantity) * 100
   */
  function calculateMortalityRate(
    deaths: number,
    initialQuantity: number,
  ): number {
    if (initialQuantity === 0) return 0
    return (deaths / initialQuantity) * 100
  }

  describe('Property 1: Mortality rate is always 0-100%', () => {
    it('should never exceed 100%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (deaths, initial) => {
            const constrainedDeaths = Math.min(deaths, initial)
            const rate = calculateMortalityRate(constrainedDeaths, initial)
            expect(rate).toBeGreaterThanOrEqual(0)
            expect(rate).toBeLessThanOrEqual(100)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 2: Formula correctness', () => {
    it('should equal (deaths / initial) * 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          (deaths, initial) => {
            const constrainedDeaths = Math.min(deaths, initial)
            const rate = calculateMortalityRate(constrainedDeaths, initial)
            const expected = (constrainedDeaths / initial) * 100
            expect(Math.abs(rate - expected)).toBeLessThan(0.0001)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 3: Zero deaths means zero rate', () => {
    it('should return 0 when no deaths', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (initial) => {
          const rate = calculateMortalityRate(0, initial)
          expect(rate).toBe(0)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 4: All dead means 100% rate', () => {
    it('should return 100 when all dead', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (initial) => {
          const rate = calculateMortalityRate(initial, initial)
          expect(rate).toBe(100)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 5: Rate increases with more deaths', () => {
    it('should increase when deaths increase', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (initial, baseDeaths, additionalDeaths) => {
            const deaths1 = Math.min(baseDeaths, initial)
            const deaths2 = Math.min(baseDeaths + additionalDeaths, initial)

            const rate1 = calculateMortalityRate(deaths1, initial)
            const rate2 = calculateMortalityRate(deaths2, initial)

            expect(rate2).toBeGreaterThanOrEqual(rate1)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 6: Half dead means 50% rate', () => {
    it('should return 50 when half are dead', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10000 }).filter((n) => n % 2 === 0),
          (initial) => {
            const rate = calculateMortalityRate(initial / 2, initial)
            expect(rate).toBe(50)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 7: Rate handles zero initial quantity', () => {
    it('should return 0 when initial quantity is 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000 }), (deaths) => {
          const rate = calculateMortalityRate(deaths, 0)
          expect(rate).toBe(0)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 8: Rate is monotonic', () => {
    it('should never decrease when deaths increase', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.array(fc.integer({ min: 0, max: 100 }), {
            minLength: 2,
            maxLength: 10,
          }),
          (initial, deathSequence) => {
            let cumulativeDeaths = 0
            let previousRate = 0

            for (const deaths of deathSequence) {
              cumulativeDeaths = Math.min(cumulativeDeaths + deaths, initial)
              const rate = calculateMortalityRate(cumulativeDeaths, initial)

              expect(rate).toBeGreaterThanOrEqual(previousRate)
              previousRate = rate
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
