import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import type {
  CustomThresholds,
  Species,
} from '~/features/extension/health-service'
import {
  DEFAULT_THRESHOLDS,
  calculateHealthStatus,
  calculateMortalityRate,
} from '~/features/extension/health-service'

/**
 * Property-Based Tests for Extension Worker Mode - Health Service
 *
 * Feature: complete-extension-worker-mode
 * Validates: Requirements 5.1, 17.1
 */

describe('Health Service - Property-Based Tests', () => {
  /**
   * Property 1: Mortality Rate Calculation
   *
   * For any initial quantity > 0 and current quantity <= initial quantity,
   * the mortality rate should equal (initial - current) / initial * 100
   *
   * Validates: Requirements 5.1
   */
  describe('Property 1: Mortality rate calculation', () => {
    it('should calculate correct mortality rate for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 0, max: 100000 }),
          (initial, current) => {
            // Precondition: current <= initial
            fc.pre(current <= initial)

            const rate = calculateMortalityRate(initial, current)
            const expected = ((initial - current) / initial) * 100

            // Allow small floating point error
            return Math.abs(rate - expected) < 0.0001
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return 0 for zero initial quantity', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100000 }), (current) => {
          const rate = calculateMortalityRate(0, current)
          return rate === 0
        }),
        { numRuns: 100 },
      )
    })

    it('should return 0 when current equals initial', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000 }), (quantity) => {
          const rate = calculateMortalityRate(quantity, quantity)
          return rate === 0
        }),
        { numRuns: 100 },
      )
    })

    it('should return 100 when current is 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000 }), (initial) => {
          const rate = calculateMortalityRate(initial, 0)
          return Math.abs(rate - 100) < 0.0001
        }),
        { numRuns: 100 },
      )
    })

    it('should always return a value between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 0, max: 100000 }),
          (initial, current) => {
            fc.pre(current <= initial)
            const rate = calculateMortalityRate(initial, current)
            return rate >= 0 && rate <= 100
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 2: Health Status Classification
   *
   * For any mortality rate and species thresholds (default or custom),
   * the health status should be:
   * - 'red' if mortality rate >= red threshold
   * - 'amber' if mortality rate >= amber threshold and < red threshold
   * - 'green' if mortality rate < amber threshold
   *
   * Custom thresholds override defaults when provided.
   *
   * Validates: Requirements 5.1, 17.1
   */
  describe('Property 2: Health status classification', () => {
    const speciesArbitrary = fc.constantFrom<Species>(
      'broiler',
      'layer',
      'catfish',
      'tilapia',
      'cattle',
      'goats',
      'sheep',
    )

    it('should classify health status correctly for all mortality rates with default thresholds', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          speciesArbitrary,
          (mortalityRate, species) => {
            const status = calculateHealthStatus(mortalityRate, species)
            const thresholds = DEFAULT_THRESHOLDS[species]

            if (mortalityRate >= thresholds.red) {
              return status === 'red'
            }
            if (mortalityRate >= thresholds.amber) {
              return status === 'amber'
            }
            return status === 'green'
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should classify as red when mortality >= red threshold', () => {
      fc.assert(
        fc.property(speciesArbitrary, (species) => {
          const thresholds = DEFAULT_THRESHOLDS[species]
          const mortalityRate = thresholds.red + Math.random() * 10

          const status = calculateHealthStatus(mortalityRate, species)
          return status === 'red'
        }),
        { numRuns: 100 },
      )
    })

    it('should classify as amber when mortality >= amber and < red', () => {
      fc.assert(
        fc.property(speciesArbitrary, (species) => {
          const thresholds = DEFAULT_THRESHOLDS[species]
          const mortalityRate =
            thresholds.amber +
            Math.random() * (thresholds.red - thresholds.amber - 0.01)

          const status = calculateHealthStatus(mortalityRate, species)
          return status === 'amber'
        }),
        { numRuns: 100 },
      )
    })

    it('should classify as green when mortality < amber threshold', () => {
      fc.assert(
        fc.property(speciesArbitrary, (species) => {
          const thresholds = DEFAULT_THRESHOLDS[species]
          const mortalityRate = Math.random() * (thresholds.amber - 0.01)

          const status = calculateHealthStatus(mortalityRate, species)
          return status === 'green'
        }),
        { numRuns: 100 },
      )
    })

    it('should use custom thresholds when provided', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          speciesArbitrary,
          fc.double({ min: 1, max: 50, noNaN: true }),
          fc.double({ min: 51, max: 100, noNaN: true }),
          (mortalityRate, species, customAmber, customRed) => {
            const customThresholds: CustomThresholds = {
              [species]: { amber: customAmber, red: customRed },
            }

            const status = calculateHealthStatus(
              mortalityRate,
              species,
              customThresholds,
            )

            if (mortalityRate >= customRed) {
              return status === 'red'
            }
            if (mortalityRate >= customAmber) {
              return status === 'amber'
            }
            return status === 'green'
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should always return one of three valid statuses', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          speciesArbitrary,
          (mortalityRate, species) => {
            const status = calculateHealthStatus(mortalityRate, species)
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            return status === 'green' || status === 'amber' || status === 'red'
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should handle boundary values correctly', () => {
      fc.assert(
        fc.property(speciesArbitrary, (species) => {
          const thresholds = DEFAULT_THRESHOLDS[species]

          // Exactly at amber threshold should be amber
          const atAmber = calculateHealthStatus(thresholds.amber, species)
          const justBelowAmber = calculateHealthStatus(
            thresholds.amber - 0.001,
            species,
          )

          // Exactly at red threshold should be red
          const atRed = calculateHealthStatus(thresholds.red, species)
          const justBelowRed = calculateHealthStatus(
            thresholds.red - 0.001,
            species,
          )

          return (
            atAmber === 'amber' &&
            justBelowAmber === 'green' &&
            atRed === 'red' &&
            justBelowRed === 'amber'
          )
        }),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Integration property: Mortality rate and health status should be consistent
   */
  describe('Integration: Mortality calculation and health status', () => {
    it('should produce consistent health status from batch quantities', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 10000 }),
          fc.integer({ min: 0, max: 100 }),
          fc.constantFrom<Species>(
            'broiler',
            'layer',
            'catfish',
            'tilapia',
            'cattle',
            'goats',
            'sheep',
          ),
          (initial, deathPercentage, species) => {
            // Calculate current quantity based on death percentage
            const deaths = Math.floor((initial * deathPercentage) / 100)
            const current = initial - deaths

            // Calculate mortality rate
            const mortalityRate = calculateMortalityRate(initial, current)

            // Get health status
            const status = calculateHealthStatus(mortalityRate, species)
            const thresholds = DEFAULT_THRESHOLDS[species]

            // Verify consistency
            if (mortalityRate >= thresholds.red) {
              return status === 'red'
            }
            if (mortalityRate >= thresholds.amber) {
              return status === 'amber'
            }
            return status === 'green'
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
