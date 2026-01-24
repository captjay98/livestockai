 
import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '~/features/expenses/server'
import {
  buildExpensesSummary,
  calculateNewFeedInventory,
  mapSortColumnToDbColumn,
  shouldUpdateFeedInventory,
  transformPaginatedResults,
  validateExpenseData,
  validateUpdateData,
} from '~/features/expenses/service'

describe('Expenses Service', () => {
  describe('calculateNewFeedInventory', () => {
    it('should calculate new quantity correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          (existing, added) => {
            const result = calculateNewFeedInventory(existing.toFixed(2), added)
            const expected = existing + added
            expect(result).toBeCloseTo(expected, 2)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return 0 for negative existing quantity', () => {
      expect(calculateNewFeedInventory('-10.50', 50)).toBe(0)
    })

    it('should return 0 for negative added quantity', () => {
      expect(calculateNewFeedInventory('100.50', -50)).toBe(0)
    })

    it('should handle decimal values correctly', () => {
      expect(calculateNewFeedInventory('100.50', 50.75)).toBe(151.25)
      expect(calculateNewFeedInventory('0.25', 0.5)).toBe(0.75)
    })

    it('should handle zero values', () => {
      expect(calculateNewFeedInventory('0', 100)).toBe(100)
      expect(calculateNewFeedInventory('100', 0)).toBe(100)
    })
  })

  describe('validateExpenseData', () => {
    const validData: CreateExpenseInput = {
      farmId: 'farm-1',
      category: 'feed',
      amount: 100.5,
      date: new Date(),
      description: 'Chicken feed',
      feedType: 'starter',
      feedQuantityKg: 50,
    }

    it('should accept valid data', () => {
      const result = validateExpenseData(validData)
      expect(result).toBeNull()
    })

    it('should reject empty farm ID', () => {
      const result = validateExpenseData({ ...validData, farmId: '' })
      expect(result).toBe('Farm ID is required')
    })

    it('should reject whitespace-only farm ID', () => {
      const result = validateExpenseData({ ...validData, farmId: '   ' })
      expect(result).toBe('Farm ID is required')
    })

    it('should reject empty description', () => {
      const result = validateExpenseData({ ...validData, description: '' })
      expect(result).toBe('Description is required')
    })

    it('should reject negative amount', () => {
      const result = validateExpenseData({ ...validData, amount: -10 })
      expect(result).toBe('Amount cannot be negative')
    })

    it('should accept zero amount', () => {
      const result = validateExpenseData({ ...validData, amount: 0 })
      expect(result).toBeNull()
    })

    it('should reject invalid date', () => {
      const result = validateExpenseData({
        ...validData,
        date: new Date('invalid') as any,
      })
      expect(result).toBe('Date is required')
    })

    it('should reject negative feed quantity for feed category', () => {
      const result = validateExpenseData({
        ...validData,
        category: 'feed',
        feedQuantityKg: -10,
      })
      expect(result).toBe('Feed quantity cannot be negative')
    })

    it('should accept zero feed quantity for feed category', () => {
      const result = validateExpenseData({
        ...validData,
        category: 'feed',
        feedQuantityKg: 0,
      })
      expect(result).toBeNull()
    })

    it('should not validate feed quantity for non-feed category', () => {
      const result = validateExpenseData({
        ...validData,
        category: 'medicine',
        feedQuantityKg: -10, // Should be ignored for non-feed
      })
      expect(result).toBeNull()
    })
  })

  describe('buildExpensesSummary', () => {
    it('should build summary by category', () => {
      const expenses = [
        { category: 'feed', amount: '100.00', count: 2 },
        { category: 'feed', amount: '50.00', count: 1 },
        { category: 'medicine', amount: '25.00', count: 1 },
      ]

      const result = buildExpensesSummary(expenses)

      expect(result.byCategory.feed).toEqual({ count: 3, amount: 150.0 })
      expect(result.byCategory.medicine).toEqual({ count: 1, amount: 25.0 })
      expect(result.total).toEqual({ count: 4, amount: 175.0 })
    })

    it('should handle empty expenses array', () => {
      const result = buildExpensesSummary([])
      expect(result.byCategory).toEqual({})
      expect(result.total).toEqual({ count: 0, amount: 0 })
    })

    it('should handle expenses without count field', () => {
      const expenses = [
        { category: 'feed', amount: '100.00' },
        { category: 'medicine', amount: '25.00' },
      ]

      const result = buildExpensesSummary(expenses)

      expect(result.byCategory.feed).toEqual({ count: 1, amount: 100.0 })
      expect(result.byCategory.medicine).toEqual({ count: 1, amount: 25.0 })
      expect(result.total).toEqual({ count: 2, amount: 125.0 })
    })

    it('should handle decimal amounts correctly', () => {
      const expenses = [
        { category: 'feed', amount: '99.99' },
        { category: 'feed', amount: '0.01' },
      ]

      const result = buildExpensesSummary(expenses)

      expect(result.byCategory.feed.amount).toBe(100.0)
    })
  })

  describe('mapSortColumnToDbColumn', () => {
    it('should map valid sort columns', () => {
      expect(mapSortColumnToDbColumn('amount')).toBe('expenses.amount')
      expect(mapSortColumnToDbColumn('category')).toBe('expenses.category')
      expect(mapSortColumnToDbColumn('description')).toBe(
        'expenses.description',
      )
      expect(mapSortColumnToDbColumn('supplierName')).toBe('suppliers.name')
      expect(mapSortColumnToDbColumn('date')).toBe('expenses.date')
    })

    it('should default to date for invalid columns', () => {
      expect(mapSortColumnToDbColumn('invalid' as any)).toBe('expenses.date')
      expect(mapSortColumnToDbColumn('' as any)).toBe('expenses.date')
    })
  })

  describe('transformPaginatedResults', () => {
    it('should transform results with null values', () => {
      const expenses = [
        {
          id: '1',
          farmId: 'farm-1',
          category: 'feed',
          amount: '100.00',
          date: new Date(),
          description: 'Test',
          isRecurring: false,
          farmName: 'My Farm',
          supplierName: 'Supplier',
          batchSpecies: 'Chicken',
          batchType: 'poultry',
        },
        {
          id: '2',
          farmId: 'farm-1',
          category: 'medicine',
          amount: '25.00',
          date: new Date(),
          description: 'Test',
          isRecurring: false,
          farmName: null,
          supplierName: null,
          batchSpecies: null,
          batchType: null,
        },
      ]

      const result = transformPaginatedResults(expenses)

      expect(result[0].farmName).toBe('My Farm')
      expect(result[0].supplierName).toBe('Supplier')
      expect(result[0].batchSpecies).toBe('Chicken')
      expect(result[0].batchType).toBe('poultry')

      expect(result[1].farmName).toBeNull()
      expect(result[1].supplierName).toBeNull()
      expect(result[1].batchSpecies).toBeNull()
      expect(result[1].batchType).toBeNull()
    })

    it('should handle undefined values as null', () => {
      const expenses = [
        {
          id: '1',
          farmId: 'farm-1',
          category: 'feed',
          amount: '100.00',
          date: new Date(),
          description: 'Test',
          isRecurring: false,
          farmName: undefined as any,
          supplierName: undefined as any,
          batchSpecies: undefined as any,
          batchType: undefined as any,
        },
      ]

      const result = transformPaginatedResults(expenses)

      expect(result[0].farmName).toBeNull()
      expect(result[0].supplierName).toBeNull()
      expect(result[0].batchSpecies).toBeNull()
      expect(result[0].batchType).toBeNull()
    })

    it('should preserve all other fields', () => {
      const expense = {
        id: '1',
        farmId: 'farm-1',
        category: 'feed',
        amount: '100.00',
        date: new Date('2024-01-01'),
        description: 'Test expense',
        isRecurring: true,
        farmName: 'My Farm',
        supplierName: 'Supplier',
        batchSpecies: 'Chicken',
        batchType: 'poultry',
      }

      const result = transformPaginatedResults([expense])

      expect(result[0].id).toBe('1')
      expect(result[0].farmId).toBe('farm-1')
      expect(result[0].category).toBe('feed')
      expect(result[0].amount).toBe('100.00')
      expect(result[0].description).toBe('Test expense')
      expect(result[0].isRecurring).toBe(true)
    })
  })

  describe('validateUpdateData', () => {
    const validData: UpdateExpenseInput = {
      amount: 100,
      description: 'Updated description',
    }

    it('should accept valid data', () => {
      const result = validateUpdateData(validData)
      expect(result).toBeNull()
    })

    it('should accept empty update object', () => {
      const result = validateUpdateData({})
      expect(result).toBeNull()
    })

    it('should reject negative amount', () => {
      const result = validateUpdateData({ amount: -10 })
      expect(result).toBe('Amount cannot be negative')
    })

    it('should accept zero amount', () => {
      const result = validateUpdateData({ amount: 0 })
      expect(result).toBeNull()
    })

    it('should reject invalid date', () => {
      const result = validateUpdateData({
        date: new Date('invalid') as any,
      })
      expect(result).toBe('Date is invalid')
    })

    it('should reject empty description', () => {
      const result = validateUpdateData({ description: '' })
      expect(result).toBe('Description cannot be empty')
    })

    it('should reject whitespace-only description', () => {
      const result = validateUpdateData({ description: '   ' })
      expect(result).toBe('Description cannot be empty')
    })

    it('should accept partial updates', () => {
      expect(validateUpdateData({ amount: 100 })).toBeNull()
      expect(validateUpdateData({ description: 'Valid' })).toBeNull()
      expect(validateUpdateData({ category: 'feed' })).toBeNull()
    })
  })

  describe('shouldUpdateFeedInventory', () => {
    it('should return true for feed category with feed type and quantity', () => {
      const result = shouldUpdateFeedInventory('feed', 'starter', 50)
      expect(result).toBe(true)
    })

    it('should return false for non-feed category', () => {
      const result = shouldUpdateFeedInventory('medicine', 'starter', 50)
      expect(result).toBe(false)
    })

    it('should return false when feed type is missing', () => {
      const result = shouldUpdateFeedInventory('feed', undefined, 50)
      expect(result).toBe(false)
    })

    it('should return false when feed quantity is missing', () => {
      const result = shouldUpdateFeedInventory('feed', 'starter', undefined)
      expect(result).toBe(false)
    })

    it('should return false for zero or negative quantity', () => {
      expect(shouldUpdateFeedInventory('feed', 'starter', 0)).toBe(false)
      expect(shouldUpdateFeedInventory('feed', 'starter', -10)).toBe(false)
    })

    it('should handle all feed types', () => {
      const feedTypes = [
        'starter',
        'grower',
        'finisher',
        'layer_mash',
        'fish_feed',
      ] as const

      for (const feedType of feedTypes) {
        expect(shouldUpdateFeedInventory('feed', feedType, 50)).toBe(true)
      }
    })
  })

  describe('property-based tests', () => {
    describe('calculateNewFeedInventory properties', () => {
      it('should never return negative values', () => {
        fc.assert(
          fc.property(
            fc.float({ min: -1000, max: 1000, noNaN: true }),
            fc.float({ min: -1000, max: 1000, noNaN: true }),
            (existing, added) => {
              const result = calculateNewFeedInventory(
                existing.toFixed(2),
                added,
              )
              expect(result).toBeGreaterThanOrEqual(0)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should be commutative with integer values', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 10000 }),
            fc.integer({ min: 0, max: 1000 }),
            (existingInt, addedInt) => {
              const existing = existingInt / 100
              const added = addedInt / 100
              const result1 = calculateNewFeedInventory(
                existing.toFixed(2),
                added,
              )
              const result2 = calculateNewFeedInventory(
                (existing + added).toFixed(2),
                0,
              )
              expect(result1).toBeCloseTo(result2, 2)
            },
          ),
          { numRuns: 100 },
        )
      })
    })
  })
})
