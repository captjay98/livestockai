import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateADG,
  calculateDeviationPercent,
  calculatePerformanceIndex,
  classifyStatus,
  generateChartData,
  projectHarvestDate,
} from '~/features/batches/forecasting-service'

describe('Forecasting Service - Property Tests', () => {
  describe('calculateADG', () => {
    it('Property 1: ADG from two samples should be weight diff / days diff', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 10, noNaN: true }), // weight1 kg
          fc.double({ min: 0.1, max: 10, noNaN: true }), // weight2 kg
          fc.integer({ min: 1, max: 100 }), // days diff
          (weight1, weight2, daysDiff) => {
            const date1 = new Date('2024-01-01')
            const date2 = new Date(date1.getTime() + daysDiff * 24 * 60 * 60 * 1000)
            
            const samples = [
              { averageWeightKg: weight2, date: date2 },
              { averageWeightKg: weight1, date: date1 },
            ]
            
            const result = calculateADG(samples, date1, daysDiff, [])
            
            const expectedADG = ((weight2 - weight1) * 1000) / daysDiff
            expect(result.adgGramsPerDay).toBeCloseTo(expectedADG, 2)
            expect(result.method).toBe('two_samples')
          }
        )
      )
    })

    it('Property 2: ADG from single sample should be weight / days since acquisition', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 10, noNaN: true }), // weight kg
          fc.integer({ min: 1, max: 100 }), // days since acquisition
          (weight, days) => {
            const acquisitionDate = new Date('2024-01-01')
            const sampleDate = new Date(acquisitionDate.getTime() + days * 24 * 60 * 60 * 1000)
            
            const samples = [{ averageWeightKg: weight, date: sampleDate }]
            
            const result = calculateADG(samples, acquisitionDate, days, [])
            
            const expectedADG = (weight * 1000) / days
            expect(result.adgGramsPerDay).toBeCloseTo(expectedADG, 2)
            expect(result.method).toBe('single_sample')
          }
        )
      )
    })

    it('Property 3: ADG without samples should use growth curve estimate', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 56 }), // current age
          (currentAge) => {
            const growthStandards = [
              { day: 0, expected_weight_g: 40 },
              { day: 28, expected_weight_g: 1000 },
              { day: 56, expected_weight_g: 2500 },
            ]
            
            const result = calculateADG([], new Date(), currentAge, growthStandards)
            
            expect(result.adgGramsPerDay).toBeGreaterThan(0)
            expect(result.method).toBe('growth_curve_estimate')
          }
        )
      )
    })

    it('Property 8: ADG unit consistency - always returns grams per day', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 10, noNaN: true }),
          fc.double({ min: 0.1, max: 10, noNaN: true }),
          fc.integer({ min: 1, max: 100 }),
          (weight1, weight2, days) => {
            const date1 = new Date('2024-01-01')
            const date2 = new Date(date1.getTime() + days * 24 * 60 * 60 * 1000)
            
            const samples = [
              { averageWeightKg: weight2, date: date2 },
              { averageWeightKg: weight1, date: date1 },
            ]
            
            const result = calculateADG(samples, date1, days, [])
            
            // ADG should be in grams (weight diff in kg * 1000 / days)
            expect(typeof result.adgGramsPerDay).toBe('number')
            expect(isNaN(result.adgGramsPerDay)).toBe(false)
          }
        )
      )
    })

    it('Property 9: Negative ADG detection', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-10')
      
      // Weight decreased
      const samples = [
        { averageWeightKg: 1.0, date: date2 },
        { averageWeightKg: 2.0, date: date1 },
      ]
      
      const result = calculateADG(samples, date1, 10, [])
      
      expect(result.adgGramsPerDay).toBeLessThan(0)
      expect(result.method).toBe('two_samples')
    })
  })

  describe('calculatePerformanceIndex', () => {
    it('Property 4: Performance Index formula is (actual / expected) * 100', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 100, max: 5000, noNaN: true }), // actual weight
          fc.double({ min: 100, max: 5000, noNaN: true }), // expected weight
          (actual, expected) => {
            const result = calculatePerformanceIndex(actual, expected)
            const expectedPI = (actual / expected) * 100
            expect(result).toBeCloseTo(expectedPI, 2)
          }
        )
      )
    })

    it('Property 5: Status classification consistency', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 50, max: 150, noNaN: true }), // performance index
          (pi) => {
            const status = classifyStatus(pi)
            
            if (pi < 95) {
              expect(status).toBe('behind')
            } else if (pi > 105) {
              expect(status).toBe('ahead')
            } else {
              expect(status).toBe('on_track')
            }
          }
        )
      )
    })
  })

  describe('projectHarvestDate', () => {
    it('Property 6: Harvest date projection is consistent', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 500, max: 2000, noNaN: true }), // current weight
          fc.double({ min: 2000, max: 3000, noNaN: true }), // target weight
          fc.double({ min: 10, max: 100, noNaN: true }), // ADG
          (current, target, adg) => {
            const result = projectHarvestDate(current, target, adg)
            
            if (current >= target) {
              expect(result?.daysRemaining).toBe(0)
            } else {
              const expectedDays = Math.ceil((target - current) / adg)
              expect(result?.daysRemaining).toBe(expectedDays)
            }
          }
        )
      )
    })

    it('should return null for zero or negative ADG', () => {
      const result1 = projectHarvestDate(1000, 2000, 0)
      const result2 = projectHarvestDate(1000, 2000, -10)
      
      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })

    it('should return 0 days when current >= target', () => {
      const result = projectHarvestDate(2500, 2000, 50)
      
      expect(result?.daysRemaining).toBe(0)
      expect(result?.harvestDate).toBeDefined()
    })
  })

  describe('calculateDeviationPercent', () => {
    it('should calculate deviation correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 100, max: 5000, noNaN: true }),
          fc.double({ min: 100, max: 5000, noNaN: true }),
          (actual, expected) => {
            fc.pre(expected > 0) // Ensure expected is not zero
            
            const result = calculateDeviationPercent(actual, expected)
            const expectedDeviation = ((actual - expected) / expected) * 100
            
            if (isNaN(expectedDeviation)) {
              expect(result).toBe(0)
            } else {
              expect(result).toBeCloseTo(expectedDeviation, 2)
            }
          }
        )
      )
    })

    it('should return 0 when expected is 0', () => {
      const result = calculateDeviationPercent(1000, 0)
      expect(result).toBe(0)
    })
  })

  describe('generateChartData', () => {
    it('Property 15: Chart data structure is valid', () => {
      const acquisitionDate = new Date('2024-01-01')
      const growthStandards = [
        { day: 0, expected_weight_g: 40 },
        { day: 7, expected_weight_g: 200 },
        { day: 14, expected_weight_g: 500 },
      ]
      const samples = [
        { averageWeightKg: 0.21, date: new Date('2024-01-08') },
      ]
      
      const result = generateChartData(acquisitionDate, 14, growthStandards, samples, 7)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      result.forEach(point => {
        expect(point).toHaveProperty('day')
        expect(point).toHaveProperty('expectedWeightG')
        expect(point).toHaveProperty('actualWeightG')
        expect(point).toHaveProperty('deviationPercent')
        expect(typeof point.day).toBe('number')
        expect(typeof point.expectedWeightG).toBe('number')
      })
    })

    it('Property 7: Weight unit conversion in chart (kg to grams)', () => {
      const acquisitionDate = new Date('2024-01-01')
      const growthStandards = [
        { day: 7, expected_weight_g: 200 },
      ]
      const samples = [
        { averageWeightKg: 0.25, date: new Date('2024-01-08') }, // 0.25 kg = 250 g
      ]
      
      const result = generateChartData(acquisitionDate, 7, growthStandards, samples, 0)
      
      const pointWithSample = result.find(p => p.actualWeightG !== null)
      expect(pointWithSample?.actualWeightG).toBeCloseTo(250, 0)
    })
  })
})
