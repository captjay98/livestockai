import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateFeedRecordInput } from '~/features/feed/server'
import {
  buildFeedStats,
  buildFeedSummary,
  calculateFCR,
  calculateNewInventoryQuantity,
  mapSortColumnToDbColumn,
  validateFeedRecord,
  validateUpdateData,
} from '~/features/feed/service'

describe('Feed Service', () => {
  describe('calculateNewInventoryQuantity', () => {
    it('should subtract deducted quantity from existing', () => {
      fc.assert(
        fc.property(
          // Use values that won't lose precision when rounded to 2 decimal places
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          fc.double({ min: 0, max: 10000, noNaN: true }),
          (existing, deducted) => {
            const result = calculateNewInventoryQuantity(
              existing.toFixed(2),
              deducted,
            )
            const expected = Math.max(0, existing - deducted)
            // Account for floating point precision and toFixed(2) rounding
            expect(Math.abs(result - expected)).toBeLessThanOrEqual(0.01)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should never return negative values', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (existing, deducted) => {
            const result = calculateNewInventoryQuantity(
              existing.toFixed(2),
              deducted,
            )
            expect(result).toBeGreaterThanOrEqual(0)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should handle edge cases', () => {
      expect(calculateNewInventoryQuantity('100.00', 100)).toBe(0)
      expect(calculateNewInventoryQuantity('50.50', 25.25)).toBe(25.25)
      expect(calculateNewInventoryQuantity('10.00', 0)).toBe(10)
      expect(calculateNewInventoryQuantity('0.00', 10)).toBe(0)
    })

    it('should handle decimal string inputs correctly', () => {
      expect(calculateNewInventoryQuantity('100.75', 25.5)).toBe(75.25)
      expect(calculateNewInventoryQuantity('1000.999', 500.499)).toBeCloseTo(
        500.5,
        5,
      )
    })
  })

  describe('validateFeedRecord', () => {
    const validData: CreateFeedRecordInput = {
      batchId: 'batch-1',
      feedType: 'starter',
      quantityKg: 25,
      cost: 15000,
      date: new Date('2024-01-01'),
    }

    it('should accept valid data', () => {
      const result = validateFeedRecord(validData)
      expect(result).toBeNull()
    })

    it('should accept all valid feed types', () => {
      const validFeedTypes = [
        'starter',
        'grower',
        'finisher',
        'layer_mash',
        'fish_feed',
        'cattle_feed',
        'goat_feed',
        'sheep_feed',
        'hay',
        'silage',
        'bee_feed',
      ] as const

      for (const feedType of validFeedTypes) {
        const result = validateFeedRecord({ ...validData, feedType })
        expect(result).toBeNull()
      }
    })

    it('should reject empty batch ID', () => {
      expect(validateFeedRecord({ ...validData, batchId: '' })).toBe(
        'Batch ID is required',
      )
      expect(validateFeedRecord({ ...validData, batchId: '   ' })).toBe(
        'Batch ID is required',
      )
    })

    it('should reject zero or negative quantity', () => {
      expect(validateFeedRecord({ ...validData, quantityKg: 0 })).toBe(
        'Quantity must be greater than 0',
      )
      expect(validateFeedRecord({ ...validData, quantityKg: -10 })).toBe(
        'Quantity must be greater than 0',
      )
    })

    it('should reject negative cost', () => {
      expect(validateFeedRecord({ ...validData, cost: -1000 })).toBe(
        'Cost cannot be negative',
      )
    })

    it('should reject invalid date', () => {
      const result = validateFeedRecord({
        ...validData,
        date: new Date('invalid') as any,
      })
      expect(result).toBe('Date is required')
    })

    it('should reject invalid feed type', () => {
      const result = validateFeedRecord({
        ...validData,
        feedType: 'invalid_type' as any,
      })
      expect(result).toBe('Invalid feed type')
    })

    it('should accept zero cost', () => {
      expect(validateFeedRecord({ ...validData, cost: 0 })).toBeNull()
    })

    it('should validate batchId parameter', () => {
      expect(validateFeedRecord(validData, '')).toBe('Batch ID is required')
      expect(validateFeedRecord(validData, '   ')).toBe('Batch ID is required')
      expect(validateFeedRecord(validData, 'valid-batch-id')).toBeNull()
    })
  })

  describe('buildFeedSummary', () => {
    it('should calculate total quantity and cost', () => {
      const records = [
        { feedType: 'starter', quantityKg: '25.00', cost: '15000.00' },
        { feedType: 'grower', quantityKg: '30.00', cost: '18000.00' },
        { feedType: 'starter', quantityKg: '15.00', cost: '9000.00' },
      ]

      const result = buildFeedSummary(records)

      expect(result.totalQuantityKg).toBe(70)
      expect(result.totalCost).toBe(42000)
      expect(result.recordCount).toBe(3)
    })

    it('should group by feed type', () => {
      const records = [
        { feedType: 'starter', quantityKg: '25.00', cost: '15000.00' },
        { feedType: 'grower', quantityKg: '30.00', cost: '18000.00' },
        { feedType: 'starter', quantityKg: '15.00', cost: '9000.00' },
      ]

      const result = buildFeedSummary(records)

      expect(result.byType.starter).toEqual({ quantityKg: 40, cost: 24000 })
      expect(result.byType.grower).toEqual({ quantityKg: 30, cost: 18000 })
    })

    it('should handle empty records', () => {
      const result = buildFeedSummary([])
      expect(result).toEqual({
        totalQuantityKg: 0,
        totalCost: 0,
        byType: {},
        recordCount: 0,
      })
    })

    it('should handle decimal values correctly', () => {
      const records = [
        { feedType: 'starter', quantityKg: '25.75', cost: '15000.50' },
        { feedType: 'grower', quantityKg: '30.25', cost: '18000.75' },
      ]

      const result = buildFeedSummary(records)

      expect(result.totalQuantityKg).toBeCloseTo(56, 5)
      expect(result.totalCost).toBeCloseTo(33001.25, 5)
    })

    it('should handle single record', () => {
      const records = [
        { feedType: 'starter', quantityKg: '100.00', cost: '50000.00' },
      ]

      const result = buildFeedSummary(records)

      expect(result.totalQuantityKg).toBe(100)
      expect(result.totalCost).toBe(50000)
      expect(result.recordCount).toBe(1)
      expect(result.byType.starter).toEqual({ quantityKg: 100, cost: 50000 })
    })
  })

  describe('calculateFCR', () => {
    it('should calculate feed conversion ratio', () => {
      expect(calculateFCR(150, 100, 100)).toBe(1.5)
      expect(calculateFCR(200, 100, 100)).toBe(2)
      expect(calculateFCR(100, 50, 100)).toBe(2)
    })

    it('should return null for zero or negative feed', () => {
      expect(calculateFCR(0, 100, 100)).toBeNull()
      expect(calculateFCR(-10, 100, 100)).toBeNull()
    })

    it('should return null for zero or negative weight gain', () => {
      expect(calculateFCR(100, 0, 100)).toBeNull()
      expect(calculateFCR(100, -10, 100)).toBeNull()
    })

    it('should return null for zero or negative initial quantity', () => {
      expect(calculateFCR(100, 100, 0)).toBeNull()
      expect(calculateFCR(100, 100, -10)).toBeNull()
    })

    it('should round to 2 decimal places', () => {
      expect(calculateFCR(157.5, 100, 100)).toBe(1.58)
      expect(calculateFCR(100.333, 100, 100)).toBe(1)
      expect(calculateFCR(100.666, 100, 100)).toBe(1.01)
    })

    it('should handle realistic poultry FCR values', () => {
      // Typical broiler FCR is 1.5-2.5
      expect(calculateFCR(300, 150, 100)).toBe(2)
      expect(calculateFCR(225, 150, 100)).toBe(1.5)
    })

    it('should handle property-based testing', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 100000, noNaN: true }), // totalFeedKg
          fc.double({ min: 0.1, max: 10000, noNaN: true }), // weightGainKg
          fc.integer({ min: 10, max: 10000 }), // initialQuantity
          (totalFeedKg, weightGainKg, _initialQuantity) => {
            const fcr = calculateFCR(totalFeedKg, weightGainKg, 100)
            expect(fcr).not.toBeNull()
            if (fcr !== null) {
              expect(fcr).toBeGreaterThanOrEqual(0) // FCR can be 0 for very small feed amounts
              // FCR should equal totalFeedKg / weightGainKg (rounded to 2 decimal places)
              const expected = totalFeedKg / weightGainKg
              const roundedExpected = Math.round(expected * 100) / 100
              // Allow for small floating point differences
              expect(Math.abs(fcr - roundedExpected)).toBeLessThanOrEqual(0.01)
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('buildFeedStats', () => {
    it('should calculate total quantity and cost', () => {
      const records = [
        { quantityKg: '25.00', cost: '15000.00' },
        { quantityKg: '30.00', cost: '18000.00' },
        { quantityKg: '15.00', cost: '9000.00' },
      ]

      const result = buildFeedStats(records)

      expect(result.totalQuantityKg).toBe(70)
      expect(result.totalCost).toBe(42000)
      expect(result.recordCount).toBe(3)
    })

    it('should handle empty records', () => {
      const result = buildFeedStats([])
      expect(result).toEqual({
        totalQuantityKg: 0,
        totalCost: 0,
        recordCount: 0,
      })
    })

    it('should handle decimal values correctly', () => {
      const records = [
        { quantityKg: '25.75', cost: '15000.50' },
        { quantityKg: '30.25', cost: '18000.75' },
      ]

      const result = buildFeedStats(records)

      expect(result.totalQuantityKg).toBeCloseTo(56, 5)
      expect(result.totalCost).toBeCloseTo(33001.25, 5)
    })

    it('should handle single record', () => {
      const records = [{ quantityKg: '100.00', cost: '50000.00' }]

      const result = buildFeedStats(records)

      expect(result.totalQuantityKg).toBe(100)
      expect(result.totalCost).toBe(50000)
      expect(result.recordCount).toBe(1)
    })

    it('should handle property-based testing', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.double({ min: 0, max: 10000, noNaN: true }),
              fc.double({ min: 0, max: 1000000, noNaN: true }),
            ),
            { minLength: 0, maxLength: 100 },
          ),
          (data) => {
            const records = data.map(([qty, cost]) => ({
              quantityKg: qty.toFixed(2),
              cost: cost.toFixed(2),
            }))
            const result = buildFeedStats(records)

            // Verify totals - handle potential precision issues
            const expectedTotalQty = data.reduce((sum, [qty]) => sum + qty, 0)
            const expectedTotalCost = data.reduce(
              (sum, [, cost]) => sum + cost,
              0,
            )

            // Use relative comparison for floating point precision
            // Allow for small differences due to parseFloat and string conversion
            const qtyDiff = Math.abs(result.totalQuantityKg - expectedTotalQty)
            const costDiff = Math.abs(result.totalCost - expectedTotalCost)

            // For small values (< 1), allow absolute difference of 0.02
            // For large values, allow relative difference of 0.15% to account for fp precision and toFixed(2)
            if (expectedTotalQty < 1) {
              expect(qtyDiff).toBeLessThanOrEqual(0.02)
            } else {
              expect(qtyDiff / expectedTotalQty).toBeLessThanOrEqual(0.0015)
            }

            if (expectedTotalCost < 1) {
              expect(costDiff).toBeLessThanOrEqual(0.02)
            } else {
              expect(costDiff / expectedTotalCost).toBeLessThanOrEqual(0.0015)
            }

            expect(result.recordCount).toBe(records.length)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('mapSortColumnToDbColumn', () => {
    it('should map known columns to database columns', () => {
      expect(mapSortColumnToDbColumn('date')).toBe('feed_records.date')
      expect(mapSortColumnToDbColumn('cost')).toBe('feed_records.cost')
      expect(mapSortColumnToDbColumn('quantityKg')).toBe(
        'feed_records.quantityKg',
      )
      expect(mapSortColumnToDbColumn('feedType')).toBe('feed_records.feedType')
    })

    it('should prefix unknown columns with feed_records.', () => {
      expect(mapSortColumnToDbColumn('unknownColumn')).toBe(
        'feed_records.unknownColumn',
      )
      expect(mapSortColumnToDbColumn('batchId')).toBe('feed_records.batchId')
    })

    it('should handle empty string', () => {
      expect(mapSortColumnToDbColumn('')).toBe('feed_records.')
    })
  })

  describe('validateUpdateData', () => {
    const validData: Partial<CreateFeedRecordInput> = {
      quantityKg: 25,
      cost: 15000,
      feedType: 'starter',
      date: new Date('2024-01-01'),
    }

    it('should accept valid data', () => {
      const result = validateUpdateData(validData)
      expect(result).toBeNull()
    })

    it('should accept partial updates', () => {
      expect(validateUpdateData({ quantityKg: 30 })).toBeNull()
      expect(validateUpdateData({ cost: 20000 })).toBeNull()
      expect(validateUpdateData({ feedType: 'grower' })).toBeNull()
      expect(validateUpdateData({})).toBeNull()
    })

    it('should reject zero or negative quantity', () => {
      expect(validateUpdateData({ quantityKg: 0 })).toBe(
        'Quantity must be greater than 0',
      )
      expect(validateUpdateData({ quantityKg: -10 })).toBe(
        'Quantity must be greater than 0',
      )
    })

    it('should reject negative cost', () => {
      expect(validateUpdateData({ cost: -1000 })).toBe(
        'Cost cannot be negative',
      )
    })

    it('should accept zero cost', () => {
      expect(validateUpdateData({ cost: 0 })).toBeNull()
    })

    it('should reject invalid date', () => {
      const result = validateUpdateData({
        date: new Date('invalid') as any,
      })
      expect(result).toBe('Date is invalid')
    })

    it('should reject invalid feed type', () => {
      const result = validateUpdateData({
        feedType: 'invalid_type' as any,
      })
      expect(result).toBe('Invalid feed type')
    })

    it('should accept all valid feed types', () => {
      const validFeedTypes = [
        'starter',
        'grower',
        'finisher',
        'layer_mash',
        'fish_feed',
        'cattle_feed',
        'goat_feed',
        'sheep_feed',
        'hay',
        'silage',
        'bee_feed',
      ] as const

      for (const feedType of validFeedTypes) {
        const result = validateUpdateData({ feedType })
        expect(result).toBeNull()
      }
    })

    it('should handle multiple validation errors', () => {
      // Should return the first error encountered
      const result = validateUpdateData({
        quantityKg: -10,
        cost: -1000,
        feedType: 'invalid' as any,
      })
      expect(result).toBe('Quantity must be greater than 0')
    })

    it('should accept valid date', () => {
      const result = validateUpdateData({
        date: new Date('2024-01-01'),
      })
      expect(result).toBeNull()
    })

    it('should accept null values for optional fields', () => {
      expect(validateUpdateData({ date: undefined })).toBeNull()
    })
  })
})
