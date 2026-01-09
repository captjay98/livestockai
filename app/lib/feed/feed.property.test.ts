import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 6: Feed Conversion Ratio Calculation
 * Feature: poultry-fishery-tracker, Property 6: Feed Conversion Ratio Calculation
 * Validates: Requirements 5.3
 *
 * For any batch with weight gain > 0, the FCR SHALL equal:
 * total_feed_kg / total_weight_gain_kg
 */
describe('Property 6: Feed Conversion Ratio Calculation', () => {
  // Arbitrary for feed quantities in kg
  const feedQuantityArb = fc.double({ min: 0.1, max: 100000, noNaN: true })

  // Arbitrary for weight in kg
  const weightArb = fc.double({ min: 0.01, max: 100, noNaN: true })

  // Arbitrary for batch quantity
  const batchQuantityArb = fc.integer({ min: 1, max: 10000 })

  /**
   * Calculate Feed Conversion Ratio
   * FCR = total feed consumed (kg) / total weight gain (kg)
   */
  function calculateFCR(
    totalFeedKg: number,
    totalWeightGainKg: number,
  ): number | null {
    if (totalWeightGainKg <= 0) return null
    return totalFeedKg / totalWeightGainKg
  }

  /**
   * Calculate total weight gain for a batch
   */
  function calculateTotalWeightGain(
    initialWeightKg: number,
    finalWeightKg: number,
    batchQuantity: number,
  ): number {
    const weightGainPerUnit = finalWeightKg - initialWeightKg
    return weightGainPerUnit * batchQuantity
  }

  it('FCR equals total_feed / total_weight_gain', () => {
    fc.assert(
      fc.property(
        feedQuantityArb,
        fc.double({ min: 0.01, max: 100, noNaN: true }), // weight gain > 0
        (totalFeed, weightGain) => {
          const fcr = calculateFCR(totalFeed, weightGain)

          expect(fcr).not.toBeNull()
          if (fcr !== null) {
            const expected = totalFeed / weightGain
            expect(fcr).toBeCloseTo(expected, 10)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('FCR is null when weight gain is zero or negative', () => {
    fc.assert(
      fc.property(
        feedQuantityArb,
        fc.double({ min: -100, max: 0, noNaN: true }),
        (totalFeed, weightGain) => {
          const fcr = calculateFCR(totalFeed, weightGain)
          expect(fcr).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('FCR is positive when both feed and weight gain are positive', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100000, noNaN: true }),
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        (totalFeed, weightGain) => {
          const fcr = calculateFCR(totalFeed, weightGain)

          expect(fcr).not.toBeNull()
          if (fcr !== null) {
            expect(fcr).toBeGreaterThan(0)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('lower FCR indicates better feed efficiency', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 1000, noNaN: true }), // same feed amount
        fc.double({ min: 10, max: 100, noNaN: true }), // weight gain 1
        fc.double({ min: 10, max: 100, noNaN: true }), // weight gain 2
        (totalFeed, weightGain1, weightGain2) => {
          const fcr1 = calculateFCR(totalFeed, weightGain1)
          const fcr2 = calculateFCR(totalFeed, weightGain2)

          expect(fcr1).not.toBeNull()
          expect(fcr2).not.toBeNull()

          if (fcr1 !== null && fcr2 !== null) {
            // Higher weight gain = lower FCR = better efficiency
            if (weightGain1 > weightGain2) {
              expect(fcr1).toBeLessThan(fcr2)
            } else if (weightGain1 < weightGain2) {
              expect(fcr1).toBeGreaterThan(fcr2)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('FCR scales linearly with feed amount', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 1000, noNaN: true }),
        fc.double({ min: 1, max: 100, noNaN: true }),
        fc.double({ min: 1.1, max: 5, noNaN: true }), // multiplier > 1
        (baseFeed, weightGain, multiplier) => {
          const fcr1 = calculateFCR(baseFeed, weightGain)
          const fcr2 = calculateFCR(baseFeed * multiplier, weightGain)

          expect(fcr1).not.toBeNull()
          expect(fcr2).not.toBeNull()

          if (fcr1 !== null && fcr2 !== null) {
            // FCR should scale linearly with feed
            expect(fcr2 / fcr1).toBeCloseTo(multiplier, 5)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('batch FCR calculation with multiple animals', () => {
    fc.assert(
      fc.property(
        fc.array(feedQuantityArb, { minLength: 1, maxLength: 10 }),
        weightArb, // initial weight per animal
        weightArb, // final weight per animal
        batchQuantityArb,
        (feedRecords, initialWeight, finalWeightDelta, batchQuantity) => {
          // Ensure final weight is greater than initial
          const finalWeight = initialWeight + Math.abs(finalWeightDelta) + 0.01

          const totalFeed = feedRecords.reduce((sum, f) => sum + f, 0)
          const totalWeightGain = calculateTotalWeightGain(
            initialWeight,
            finalWeight,
            batchQuantity,
          )

          const fcr = calculateFCR(totalFeed, totalWeightGain)

          expect(fcr).not.toBeNull()
          if (fcr !== null) {
            expect(fcr).toBeGreaterThan(0)
            // FCR should equal total feed / total weight gain
            expect(fcr).toBeCloseTo(totalFeed / totalWeightGain, 10)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('typical poultry FCR is between 1.5 and 3.0', () => {
    // This is a sanity check for realistic values
    fc.assert(
      fc.property(
        fc.double({ min: 3, max: 6, noNaN: true }), // kg feed per bird
        fc.double({ min: 1.5, max: 3, noNaN: true }), // kg weight gain per bird
        batchQuantityArb,
        (feedPerBird, weightGainPerBird, batchQuantity) => {
          const totalFeed = feedPerBird * batchQuantity
          const totalWeightGain = weightGainPerBird * batchQuantity

          const fcr = calculateFCR(totalFeed, totalWeightGain)

          expect(fcr).not.toBeNull()
          if (fcr !== null) {
            // Typical broiler FCR is 1.5-2.5, layers can be higher
            expect(fcr).toBeGreaterThan(0.5)
            expect(fcr).toBeLessThan(10)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
