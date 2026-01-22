import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateMortalityData } from '~/features/mortality/server'
import {
  buildMortalityTrends,
  calculateCauseDistribution,
  calculateMortalityRate,
  calculateNewBatchQuantity,
  determineBatchStatusAfterMortality,
  mapTrendPeriodToFormat,
  restoreBatchQuantityOnDelete,
  validateMortalityData,
} from '~/features/mortality/service'

describe('Mortality Service', () => {
  describe('validateMortalityData', () => {
    it('should accept valid data', () => {
      const validData: CreateMortalityData = {
        batchId: 'batch-123',
        quantity: 5,
        date: new Date(),
        cause: 'disease',
      }
      expect(validateMortalityData(validData, 100)).toBeNull()
    })

    it('should accept all valid causes', () => {
      const causes = [
        'disease',
        'predator',
        'weather',
        'unknown',
        'other',
        'starvation',
        'injury',
        'poisoning',
        'suffocation',
        'culling',
      ] as const

      for (const cause of causes) {
        const result = validateMortalityData(
          {
            batchId: 'batch-123',
            quantity: 1,
            date: new Date(),
            cause,
          },
          100,
        )
        expect(result).toBeNull()
      }
    })

    it('should reject zero or negative quantity', () => {
      expect(
        validateMortalityData(
          {
            batchId: 'batch-123',
            quantity: 0,
            date: new Date(),
            cause: 'disease',
          },
          100,
        ),
      ).toBe('Mortality quantity must be greater than 0')

      expect(
        validateMortalityData(
          {
            batchId: 'batch-123',
            quantity: -5,
            date: new Date(),
            cause: 'disease',
          },
          100,
        ),
      ).toBe('Mortality quantity must be greater than 0')
    })

    it('should reject quantity exceeding batch quantity', () => {
      expect(
        validateMortalityData(
          {
            batchId: 'batch-123',
            quantity: 50,
            date: new Date(),
            cause: 'disease',
          },
          10,
        ),
      ).toBe('Mortality quantity cannot exceed current batch quantity')
    })
  })

  describe('calculateNewBatchQuantity', () => {
    it('should subtract mortality from existing quantity', () => {
      expect(calculateNewBatchQuantity(100, 5)).toBe(95)
    })

    it('should handle decimal quantities', () => {
      expect(calculateNewBatchQuantity(100.5, 0.5)).toBe(100)
    })

    it('should return 0 when mortality equals quantity', () => {
      expect(calculateNewBatchQuantity(10, 10)).toBe(0)
    })
  })

  describe('determineBatchStatusAfterMortality', () => {
    it('should return active when quantity is greater than 0', () => {
      expect(determineBatchStatusAfterMortality(10)).toBe('active')
    })

    it('should return depleted when quantity is 0', () => {
      expect(determineBatchStatusAfterMortality(0)).toBe('depleted')
    })
  })

  describe('calculateMortalityRate', () => {
    it('should calculate correct rate', () => {
      expect(calculateMortalityRate(100, 5)).toBe(5)
    })

    it('should return 0 when initial quantity is 0', () => {
      expect(calculateMortalityRate(0, 5)).toBe(0)
    })

    it('should handle decimal rates', () => {
      expect(calculateMortalityRate(1000, 1)).toBe(0.1)
    })
  })

  describe('calculateCauseDistribution', () => {
    it('should calculate correct percentages', () => {
      const causeCounts = [
        { cause: 'disease', quantity: 10 },
        { cause: 'predator', quantity: 5 },
        { cause: 'unknown', quantity: 3 },
      ]
      const result = calculateCauseDistribution(causeCounts)
      const disease = result.find((r) => r.cause === 'disease')
      const predator = result.find((r) => r.cause === 'predator')
      const unknown = result.find((r) => r.cause === 'unknown')

      expect(disease?.percentage).toBeCloseTo(55.56, 1)
      expect(predator?.percentage).toBeCloseTo(27.78, 1)
      expect(unknown?.percentage).toBeCloseTo(16.67, 1)
    })

    it('should handle empty causes', () => {
      const result = calculateCauseDistribution([])
      expect(result).toEqual([])
    })
  })

  describe('mapTrendPeriodToFormat', () => {
    it('should map daily period correctly', () => {
      expect(mapTrendPeriodToFormat('daily')).toBe('YYYY-MM-DD')
    })

    it('should map weekly period correctly', () => {
      expect(mapTrendPeriodToFormat('weekly')).toBe('YYYY-"W"WW')
    })

    it('should map monthly period correctly', () => {
      expect(mapTrendPeriodToFormat('monthly')).toBe('YYYY-MM')
    })
  })

  describe('buildMortalityTrends', () => {
    it('should return empty array for no records', () => {
      const result = buildMortalityTrends([])
      expect(result).toEqual([])
    })

    it('should process single record', () => {
      const records = [{ period: '2024-01-15', records: 2, quantity: 5 }]
      const result = buildMortalityTrends(records)
      expect(result).toHaveLength(1)
      expect(result[0].period).toBe('2024-01-15')
      expect(result[0].records).toBe(2)
      expect(result[0].quantity).toBe(5)
    })
  })

  describe('restoreBatchQuantityOnDelete', () => {
    it('should add quantity back to batch', () => {
      const currentQuantity = 90
      const deletedQuantity = 5
      const result = restoreBatchQuantityOnDelete(
        currentQuantity,
        deletedQuantity,
      )
      expect(result).toBe(95)
    })
  })
})

describe('Mortality Service - Property Tests', () => {
  describe('calculateNewBatchQuantity', () => {
    it('should always return non-negative values', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100000 }),
          fc.nat({ max: 100000 }),
          (existing, mortality) => {
            const result = calculateNewBatchQuantity(existing, mortality)
            expect(result).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('should never return negative values even with large inputs', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100000, noNaN: true }),
          fc.double({ min: 0, max: 100000, noNaN: true }),
          (existing, mortality) => {
            const result = calculateNewBatchQuantity(existing, mortality)
            expect(result).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('should subtract exactly the mortality amount when existing >= mortality', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100000 }),
          fc.nat({ max: 100000 }),
          (existing, mortality) => {
            if (existing >= mortality) {
              expect(calculateNewBatchQuantity(existing, mortality)).toBe(
                existing - mortality,
              )
            }
          },
        ),
      )
    })
  })

  describe('calculateMortalityRate', () => {
    it('should always return non-negative values', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100000 }),
          fc.nat({ max: 100000 }),
          (initialQuantity, totalDeaths) => {
            const rate = calculateMortalityRate(initialQuantity, totalDeaths)
            expect(rate).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('should return 0 when no mortality', () => {
      fc.assert(
        fc.property(fc.nat({ max: 100000 }), (initialQuantity) => {
          expect(calculateMortalityRate(initialQuantity, 0)).toBe(0)
        }),
      )
    })

    it('should return 100 when all animals in the batch died', () => {
      // Test with a positive initial quantity
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (initialQuantity) => {
          expect(calculateMortalityRate(initialQuantity, initialQuantity)).toBe(
            100,
          )
        }),
      )
    })
  })

  describe('validateMortalityData', () => {
    it('should always accept valid data when quantity is positive', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.nat({ max: 10000 }),
          fc.date(),
          fc.oneof(
            fc.constant('disease'),
            fc.constant('predator'),
            fc.constant('weather'),
            fc.constant('unknown'),
            fc.constant('other'),
            fc.constant('starvation'),
            fc.constant('injury'),
            fc.constant('poisoning'),
            fc.constant('suffocation'),
            fc.constant('culling'),
          ),
          (batchId, quantity, date, cause) => {
            // Skip test cases where quantity is 0 (validation should fail)
            if (quantity === 0) return
            // Skip invalid dates
            if (isNaN(date.getTime())) return
            // Use a batch quantity that's guaranteed to be larger than any test quantity
            const result = validateMortalityData(
              {
                batchId,
                quantity,
                date,
                cause,
              },
              100000,
            )
            expect(result).toBeNull()
          },
        ),
      )
    })
  })

  describe('buildMortalityTrends', () => {
    it('should always return an array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              period: fc.option(fc.string()),
              records: fc.oneof(fc.nat(), fc.bigInt()),
              quantity: fc.oneof(fc.nat(), fc.bigInt()),
            }),
          ),
          (records) => {
            const result = buildMortalityTrends(records)
            expect(Array.isArray(result)).toBe(true)
          },
        ),
      )
    })
  })
})
