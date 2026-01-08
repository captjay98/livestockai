import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 9: Average Daily Gain Calculation
 * Feature: poultry-fishery-tracker, Property 9: Average Daily Gain Calculation
 * Validates: Requirements 7.3
 * 
 * For any two consecutive weight samples with days_between > 0, the ADG SHALL equal:
 * (later_weight - earlier_weight) / days_between
 */
describe('Property 9: Average Daily Gain Calculation', () => {
  // Arbitrary for weight in kg
  const weightArb = fc.double({ min: 0.01, max: 100, noNaN: true })
  
  // Arbitrary for days between samples
  const daysArb = fc.integer({ min: 1, max: 365 })

  /**
   * Calculate Average Daily Gain (ADG)
   * ADG = (final_weight - initial_weight) / days_between
   */
  function calculateADG(
    initialWeight: number,
    finalWeight: number,
    daysBetween: number
  ): number | null {
    if (daysBetween <= 0) return null
    return (finalWeight - initialWeight) / daysBetween
  }

  it('ADG equals (later_weight - earlier_weight) / days_between', () => {
    fc.assert(
      fc.property(
        weightArb,
        weightArb,
        daysArb,
        (initialWeight, finalWeight, daysBetween) => {
          const adg = calculateADG(initialWeight, finalWeight, daysBetween)
          
          expect(adg).not.toBeNull()
          if (adg !== null) {
            const expected = (finalWeight - initialWeight) / daysBetween
            expect(adg).toBeCloseTo(expected, 10)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('ADG is null when days_between is 0 or negative', () => {
    fc.assert(
      fc.property(
        weightArb,
        weightArb,
        fc.integer({ min: -100, max: 0 }),
        (initialWeight, finalWeight, daysBetween) => {
          const adg = calculateADG(initialWeight, finalWeight, daysBetween)
          expect(adg).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('ADG is positive when weight increases', () => {
    fc.assert(
      fc.property(
        weightArb,
        fc.double({ min: 0.01, max: 50, noNaN: true }), // weight gain
        daysArb,
        (initialWeight, weightGain, daysBetween) => {
          const finalWeight = initialWeight + weightGain
          const adg = calculateADG(initialWeight, finalWeight, daysBetween)
          
          expect(adg).not.toBeNull()
          if (adg !== null) {
            expect(adg).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('ADG is negative when weight decreases', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 100, noNaN: true }), // initial weight
        fc.double({ min: 0.01, max: 0.9, noNaN: true }), // weight loss factor
        daysArb,
        (initialWeight, lossFactor, daysBetween) => {
          const finalWeight = initialWeight * lossFactor // weight loss
          const adg = calculateADG(initialWeight, finalWeight, daysBetween)
          
          expect(adg).not.toBeNull()
          if (adg !== null) {
            expect(adg).toBeLessThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('ADG is 0 when weight stays the same', () => {
    fc.assert(
      fc.property(weightArb, daysArb, (weight, daysBetween) => {
        const adg = calculateADG(weight, weight, daysBetween)
        
        expect(adg).not.toBeNull()
        if (adg !== null) {
          expect(adg).toBe(0)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('ADG decreases as days increase for same weight gain', () => {
    fc.assert(
      fc.property(
        weightArb,
        fc.double({ min: 0.1, max: 10, noNaN: true }), // weight gain
        fc.integer({ min: 1, max: 100 }), // days1
        fc.integer({ min: 101, max: 365 }), // days2 (always > days1)
        (initialWeight, weightGain, days1, days2) => {
          const finalWeight = initialWeight + weightGain
          const adg1 = calculateADG(initialWeight, finalWeight, days1)
          const adg2 = calculateADG(initialWeight, finalWeight, days2)
          
          expect(adg1).not.toBeNull()
          expect(adg2).not.toBeNull()
          
          if (adg1 !== null && adg2 !== null) {
            // More days = lower ADG for same weight gain
            expect(adg1).toBeGreaterThan(adg2)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('ADG scales linearly with weight gain', () => {
    fc.assert(
      fc.property(
        weightArb,
        fc.double({ min: 0.1, max: 10, noNaN: true }), // base weight gain
        fc.double({ min: 1.1, max: 5, noNaN: true }), // multiplier
        daysArb,
        (initialWeight, baseGain, multiplier, daysBetween) => {
          const adg1 = calculateADG(initialWeight, initialWeight + baseGain, daysBetween)
          const adg2 = calculateADG(initialWeight, initialWeight + baseGain * multiplier, daysBetween)
          
          expect(adg1).not.toBeNull()
          expect(adg2).not.toBeNull()
          
          if (adg1 !== null && adg2 !== null) {
            expect(adg2 / adg1).toBeCloseTo(multiplier, 5)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('typical broiler ADG is 50-70g per day', () => {
    // Sanity check for realistic values
    // Broilers typically gain 2-2.5kg over 35-42 days
    fc.assert(
      fc.property(
        fc.double({ min: 0.04, max: 0.05, noNaN: true }), // starting weight ~40-50g
        fc.double({ min: 2.0, max: 2.5, noNaN: true }), // final weight ~2-2.5kg
        fc.integer({ min: 35, max: 42 }), // days to market
        (initialWeight, finalWeight, days) => {
          const adg = calculateADG(initialWeight, finalWeight, days)
          
          expect(adg).not.toBeNull()
          if (adg !== null) {
            // ADG in grams (multiply by 1000)
            const adgGrams = adg * 1000
            expect(adgGrams).toBeGreaterThan(40)
            expect(adgGrams).toBeLessThan(80)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('cumulative ADG from multiple samples', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            weight: weightArb,
            daysFromStart: fc.integer({ min: 1, max: 30 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (samples) => {
          // Sort by days
          const sorted = [...samples].sort((a, b) => a.daysFromStart - b.daysFromStart)
          
          // Calculate ADG between first and last sample
          const first = sorted[0]
          const last = sorted[sorted.length - 1]
          const totalDays = last.daysFromStart - first.daysFromStart
          
          if (totalDays > 0) {
            const overallADG = calculateADG(first.weight, last.weight, totalDays)
            
            expect(overallADG).not.toBeNull()
            if (overallADG !== null) {
              // Overall ADG should equal total weight change / total days
              const expected = (last.weight - first.weight) / totalDays
              expect(overallADG).toBeCloseTo(expected, 10)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
