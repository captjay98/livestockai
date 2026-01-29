import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateWeightSampleInput } from '~/features/weight/server'
import {
  EXPECTED_ADG_BY_SPECIES,
  buildWeightStats,
  calculateAdgPercentage,
  calculateAverageWeight,
  calculateGrowthRate,
  calculateProjectedWeight,
  calculateWeightGain,
  determineGrowthStatus,
  getAlertSeverity,
  getExpectedAdg,
  validateUpdateData,
  validateWeightRecord,
} from '~/features/weight/service'

describe('Weight Service', () => {
  describe('validateWeightRecord', () => {
    const validData: CreateWeightSampleInput = {
      batchId: 'batch-1',
      date: new Date(),
      sampleSize: 10,
      averageWeightKg: 2.5,
    }

    it('should accept valid data', () => {
      const result = validateWeightRecord(validData)
      expect(result).toBeNull()
    })

    it('should reject empty batch ID', () => {
      const result = validateWeightRecord({ ...validData, batchId: '' })
      expect(result).toBe('Batch ID is required')
    })

    it('should reject whitespace-only batch ID', () => {
      const result = validateWeightRecord({
        ...validData,
        batchId: '   ',
      })
      expect(result).toBe('Batch ID is required')
    })

    it('should reject invalid date', () => {
      const result = validateWeightRecord({
        ...validData,
        date: new Date('invalid'),
      })
      expect(result).toBe('Valid measurement date is required')
    })

    it('should reject zero sample size', () => {
      const result = validateWeightRecord({ ...validData, sampleSize: 0 })
      expect(result).toBe('Sample size must be greater than 0')
    })

    it('should reject negative sample size', () => {
      const result = validateWeightRecord({
        ...validData,
        sampleSize: -5,
      })
      expect(result).toBe('Sample size must be greater than 0')
    })

    it('should reject zero average weight', () => {
      const result = validateWeightRecord({
        ...validData,
        averageWeightKg: 0,
      })
      expect(result).toBe('Average weight must be greater than 0')
    })

    it('should reject negative average weight', () => {
      const result = validateWeightRecord({
        ...validData,
        averageWeightKg: -1,
      })
      expect(result).toBe('Average weight must be greater than 0')
    })

    it('should reject zero min weight', () => {
      const result = validateWeightRecord({
        ...validData,
        minWeightKg: 0,
      })
      expect(result).toBe('Minimum weight must be greater than 0')
    })

    it('should reject zero max weight', () => {
      const result = validateWeightRecord({
        ...validData,
        maxWeightKg: 0,
      })
      expect(result).toBe('Maximum weight must be greater than 0')
    })

    it('should reject min weight greater than max weight', () => {
      const result = validateWeightRecord({
        ...validData,
        minWeightKg: 3.0,
        maxWeightKg: 2.0,
      })
      expect(result).toBe(
        'Minimum weight cannot be greater than maximum weight',
      )
    })

    it('should accept null min and max weights', () => {
      const result = validateWeightRecord({
        ...validData,
        minWeightKg: null,
        maxWeightKg: null,
      })
      expect(result).toBeNull()
    })

    it('should accept valid min and max weights', () => {
      const result = validateWeightRecord({
        ...validData,
        minWeightKg: 2.0,
        maxWeightKg: 3.0,
      })
      expect(result).toBeNull()
    })
  })

  describe('validateUpdateData', () => {
    it('should accept empty update data', () => {
      const result = validateUpdateData({})
      expect(result).toBeNull()
    })

    it('should accept valid partial updates', () => {
      expect(validateUpdateData({ date: new Date() })).toBeNull()
      expect(validateUpdateData({ sampleSize: 5 })).toBeNull()
      expect(validateUpdateData({ averageWeightKg: 3.0 })).toBeNull()
      expect(validateUpdateData({ notes: 'Updated notes' })).toBeNull()
    })

    it('should reject invalid date', () => {
      const result = validateUpdateData({
        date: new Date('invalid'),
      })
      expect(result).toBe('Date must be valid')
    })

    it('should reject zero sample size', () => {
      const result = validateUpdateData({ sampleSize: 0 })
      expect(result).toBe('Sample size must be greater than 0')
    })

    it('should reject negative sample size', () => {
      const result = validateUpdateData({ sampleSize: -5 })
      expect(result).toBe('Sample size must be greater than 0')
    })

    it('should reject zero average weight', () => {
      const result = validateUpdateData({ averageWeightKg: 0 })
      expect(result).toBe('Average weight must be greater than 0')
    })

    it('should reject negative average weight', () => {
      const result = validateUpdateData({ averageWeightKg: -1 })
      expect(result).toBe('Average weight must be greater than 0')
    })

    it('should reject min greater than max', () => {
      const result = validateUpdateData({
        minWeightKg: 3.0,
        maxWeightKg: 2.0,
      })
      expect(result).toBe(
        'Minimum weight cannot be greater than maximum weight',
      )
    })
  })

  describe('calculateAverageWeight', () => {
    it('should calculate average correctly', () => {
      const records = [
        { averageWeightKg: '1.0' },
        { averageWeightKg: '2.0' },
        { averageWeightKg: '3.0' },
      ]
      expect(calculateAverageWeight(records)).toBe(2.0)
    })

    it('should return 0 for empty array', () => {
      expect(calculateAverageWeight([])).toBe(0)
    })

    it('should handle single record', () => {
      const records = [{ averageWeightKg: '2.5' }]
      expect(calculateAverageWeight(records)).toBe(2.5)
    })

    it('should handle decimal values', () => {
      const records = [{ averageWeightKg: '1.5' }, { averageWeightKg: '2.5' }]
      expect(calculateAverageWeight(records)).toBe(2.0)
    })
  })

  describe('calculateGrowthRate', () => {
    it('should calculate positive growth rate', () => {
      const current = { weight: 3.0, date: new Date('2024-01-15') }
      const previous = { weight: 2.0, date: new Date('2024-01-01') }
      const rate = calculateGrowthRate(current, previous)
      // (3.0 - 2.0) / 14 days = 0.0714... kg/day
      expect(rate).toBeGreaterThan(0.07)
      expect(rate).toBeLessThan(0.08)
    })

    it('should calculate negative growth rate (weight loss)', () => {
      const current = { weight: 1.5, date: new Date('2024-01-15') }
      const previous = { weight: 2.0, date: new Date('2024-01-01') }
      const rate = calculateGrowthRate(current, previous)
      expect(rate).toBeApproximately(-0.0357, 0.001)
    })

    it('should return null for same date', () => {
      const date = new Date('2024-01-15')
      const current = { weight: 3.0, date }
      const previous = { weight: 2.0, date }
      expect(calculateGrowthRate(current, previous)).toBeNull()
    })

    it('should return null for current date before previous', () => {
      const current = { weight: 2.0, date: new Date('2024-01-01') }
      const previous = { weight: 2.0, date: new Date('2024-01-15') }
      expect(calculateGrowthRate(current, previous)).toBeNull()
    })

    it('should handle exact dates', () => {
      const previous = { weight: 2.0, date: new Date('2024-01-01') }
      const current = { weight: 3.0, date: new Date('2024-01-08') }
      const rate = calculateGrowthRate(current, previous)
      // (3.0 - 2.0) / 7 days = 0.1428... kg/day
      expect(rate).toBeApproximately(0.1428, 0.001)
    })
  })

  describe('calculateWeightGain', () => {
    it('should calculate positive gain', () => {
      expect(calculateWeightGain(3.5, 2.0)).toBe(1.5)
    })

    it('should calculate negative gain (loss)', () => {
      expect(calculateWeightGain(1.5, 2.0)).toBe(-0.5)
    })

    it('should return 0 for no change', () => {
      expect(calculateWeightGain(2.0, 2.0)).toBe(0)
    })

    it('should handle decimal values', () => {
      expect(calculateWeightGain(2.75, 2.25)).toBe(0.5)
    })
  })

  describe('determineGrowthStatus', () => {
    it('should return slow for growth rate < 70% of baseline', () => {
      expect(determineGrowthStatus(0.02)).toBe('slow')
      expect(determineGrowthStatus(0.01)).toBe('slow')
      expect(determineGrowthStatus(0.027)).toBe('slow')
    })

    it('should return normal for growth rate between 70-130% of baseline', () => {
      expect(determineGrowthStatus(0.04)).toBe('normal')
      expect(determineGrowthStatus(0.05)).toBe('normal')
      expect(determineGrowthStatus(0.03)).toBe('normal')
      expect(determineGrowthStatus(0.052)).toBe('normal')
    })

    it('should return rapid for growth rate > 130% of baseline', () => {
      expect(determineGrowthStatus(0.06)).toBe('rapid')
      const growthRate = calculateGrowthRate(
        { weight: 6.0, date: new Date() },
        { weight: 2.0, date: new Date(Date.now() - 86400000) },
      )
      if (growthRate !== null) {
        expect(determineGrowthStatus(growthRate)).toBe('rapid')
      }
    })
  })

  describe('calculateProjectedWeight', () => {
    it('should project weight correctly', () => {
      const projected = calculateProjectedWeight(2.5, 0.05, 30)
      // 2.5 + 0.05 * 30 = 4.0
      expect(projected).toBe(4.0)
    })

    it('should handle zero growth rate', () => {
      const projected = calculateProjectedWeight(2.5, 0, 30)
      expect(projected).toBe(2.5)
    })

    it('should handle zero days', () => {
      const projected = calculateProjectedWeight(2.5, 0.05, 0)
      expect(projected).toBe(2.5)
    })

    it('should handle negative growth rate', () => {
      const projected = calculateProjectedWeight(3.0, -0.02, 10)
      expect(projected).toBe(2.8)
    })
  })

  describe('buildWeightStats', () => {
    const sampleRecords = [
      { averageWeightKg: '1.0', date: new Date('2024-01-01') },
      { averageWeightKg: '2.0', date: new Date('2024-01-15') },
    ]

    it('should build complete stats', () => {
      const stats = buildWeightStats(sampleRecords)

      expect(stats.averageWeight).toBe(1.5)
      expect(stats.totalGain).toBe(1.0)
      expect(stats.recordCount).toBe(2)
      expect(stats.daysBetween).toBe(14)
      expect(stats.dailyGain).toBeGreaterThan(0.07)
      expect(stats.dailyGain).toBeLessThan(0.08)
    })

    it('should return empty stats for no records', () => {
      const stats = buildWeightStats([])

      expect(stats.averageWeight).toBe(0)
      expect(stats.totalGain).toBe(0)
      expect(stats.recordCount).toBe(0)
      expect(stats.dailyGain).toBeNull()
      expect(stats.latestRecord).toBeNull()
      expect(stats.firstRecord).toBeNull()
    })

    it('should identify first and latest records', () => {
      const stats = buildWeightStats(sampleRecords)

      expect(stats.firstRecord).toBe(sampleRecords[0])
      expect(stats.latestRecord).toBe(sampleRecords[1])
    })
  })

  describe('getExpectedAdg', () => {
    it('should return correct ADG for known species', () => {
      expect(getExpectedAdg('broiler')).toBe(EXPECTED_ADG_BY_SPECIES.broiler)
      expect(getExpectedAdg('layer')).toBe(EXPECTED_ADG_BY_SPECIES.layer)
      expect(getExpectedAdg('catfish')).toBe(EXPECTED_ADG_BY_SPECIES.catfish)
      expect(getExpectedAdg('tilapia')).toBe(EXPECTED_ADG_BY_SPECIES.tilapia)
    })

    it('should be case insensitive', () => {
      expect(getExpectedAdg('BROILER')).toBe(EXPECTED_ADG_BY_SPECIES.broiler)
      expect(getExpectedAdg('Broiler')).toBe(EXPECTED_ADG_BY_SPECIES.broiler)
    })

    it('should return default for unknown species', () => {
      expect(getExpectedAdg('unknown')).toBe(0.03)
    })
  })

  describe('calculateAdgPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateAdgPercentage(0.04, 0.04)).toBe(100)
      expect(calculateAdgPercentage(0.05, 0.04)).toBe(125)
      expect(calculateAdgPercentage(0.02, 0.04)).toBe(50)
    })

    it('should return 100 for zero expected', () => {
      expect(calculateAdgPercentage(0.04, 0)).toBe(100)
    })
  })

  describe('getAlertSeverity', () => {
    it('should return critical for < 50%', () => {
      expect(getAlertSeverity(49)).toBe('critical')
      expect(getAlertSeverity(0)).toBe('critical')
      expect(getAlertSeverity(-10)).toBe('critical')
    })

    it('should return warning for >= 50%', () => {
      expect(getAlertSeverity(50)).toBe('warning')
      expect(getAlertSeverity(70)).toBe('warning')
      expect(getAlertSeverity(100)).toBe('warning')
    })
  })

  describe('Property Tests', () => {
    describe('calculateAverageWeight', () => {
      it('should return average of all values', () => {
        fc.assert(
          fc.property(
            fc.array(fc.nat({ max: 10000 }), {
              minLength: 1,
              maxLength: 100,
            }),
            (values) => {
              const records = values.map((v) => ({
                averageWeightKg: (v / 100).toString(),
              }))
              const expected =
                values.reduce((sum, v) => sum + v / 100, 0) / values.length
              expect(calculateAverageWeight(records)).toBe(expected)
            },
          ),
          { numRuns: 50 },
        )
      })
    })

    describe('calculateWeightGain', () => {
      it('should return current minus initial', () => {
        fc.assert(
          fc.property(
            fc.nat({ max: 10000 }),
            fc.nat({ max: 10000 }),
            (current, initial) => {
              expect(calculateWeightGain(current, initial)).toBe(
                current - initial,
              )
            },
          ),
          { numRuns: 100 },
        )
      })
    })

    describe('calculateProjectedWeight', () => {
      it('should return current + growthRate * days', () => {
        fc.assert(
          fc.property(
            fc.nat({ max: 10000 }),
            fc.nat({ max: 1000 }),
            fc.nat({ max: 365 }),
            (current, growthRate, days) => {
              const projected = calculateProjectedWeight(
                current,
                growthRate / 1000,
                days,
              )
              expect(projected).toBe(current + (growthRate / 1000) * days)
            },
          ),
          { numRuns: 100 },
        )
      })
    })
  })
})

// Custom matcher for approximate equality
function extendExpect() {
  return {
    toBeApproximately(received: number, expected: number, tolerance: number) {
      const pass = Math.abs(received - expected) <= tolerance
      return {
        pass,
        message: () =>
          pass
            ? `expected ${received} not to be approximately ${expected}`
            : `expected ${received} to be approximately ${expected} (tolerance: ${tolerance})`,
      }
    },
  }
}

// Apply custom matcher
expect.extend(extendExpect())

declare module 'vitest' {
  interface Assertion {
    toBeApproximately: (expected: number, tolerance: number) => void
  }
}
