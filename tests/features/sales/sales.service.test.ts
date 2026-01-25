import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateSaleInput, UpdateSaleInput } from '~/features/sales/server'
import type { SaleWithJoins } from '~/features/sales/repository'
import {
  buildSalesSummary,
  calculateNewBatchQuantity,
  calculateNewTotalAmount,
  calculateQuantityDifference,
  calculateSaleTotal,
  determineBatchStatusAfterSale,
  transformPaginatedResults,
  validateSaleData,
  validateUpdateData,
} from '~/features/sales/service'

describe('Sales Service', () => {
  describe('calculateSaleTotal', () => {
    it('should calculate total = quantity * unitPrice', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 100000 }),
          (quantity, priceCents) => {
            const unitPrice = priceCents / 100
            const result = calculateSaleTotal(quantity, unitPrice)
            const expected = (quantity * unitPrice).toFixed(2)
            expect(result).toBe(expected)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return 0 for zero or negative quantities', () => {
      expect(calculateSaleTotal(0, 10)).toBe('0.00')
      expect(calculateSaleTotal(-10, 10)).toBe('0.00')
    })

    it('should return 0 for negative unit price', () => {
      expect(calculateSaleTotal(100, -10)).toBe('0.00')
    })

    it('should handle decimal prices correctly', () => {
      expect(calculateSaleTotal(50, 5.5)).toBe('275.00')
      expect(calculateSaleTotal(100, 2.75)).toBe('275.00')
    })
  })

  describe('validateSaleData', () => {
    const validData: CreateSaleInput = {
      farmId: 'farm-1',
      livestockType: 'poultry',
      quantity: 50,
      unitPrice: 5.5,
      date: new Date(),
    }

    it('should accept valid data', () => {
      const result = validateSaleData(validData, 100)
      expect(result).toBeNull()
    })

    it('should reject empty farm ID', () => {
      const result = validateSaleData({ ...validData, farmId: '' }, 100)
      expect(result).toBe('Farm ID is required')
    })

    it('should reject zero or negative quantity', () => {
      expect(validateSaleData({ ...validData, quantity: 0 }, 100)).toBe(
        'Quantity must be greater than 0',
      )
      expect(validateSaleData({ ...validData, quantity: -10 }, 100)).toBe(
        'Quantity must be greater than 0',
      )
    })

    it('should reject negative unit price', () => {
      const result = validateSaleData({ ...validData, unitPrice: -10 }, 100)
      expect(result).toBe('Unit price cannot be negative')
    })

    it('should reject invalid date', () => {
      const result = validateSaleData(
        { ...validData, date: new Date('invalid') as any },
        100,
      )
      expect(result).toBe('Sale date is required')
    })

    it('should reject quantity exceeding batch stock', () => {
      const result = validateSaleData(
        { ...validData, batchId: 'batch-1', livestockType: 'poultry' },
        30, // batch quantity
      )
      expect(result).toBe(
        'Insufficient stock in batch. Available: 30, Requested: 50',
      )
    })

    it('should not check batch stock for eggs', () => {
      const result = validateSaleData(
        {
          ...validData,
          batchId: 'batch-1',
          livestockType: 'eggs',
          quantity: 100,
        },
        30, // batch quantity (should be ignored for eggs)
      )
      expect(result).toBeNull()
    })

    it('should accept sale within batch stock', () => {
      const result = validateSaleData(
        {
          ...validData,
          batchId: 'batch-1',
          livestockType: 'poultry',
          quantity: 25,
        },
        30, // batch quantity
      )
      expect(result).toBeNull()
    })

    it('should accept equal quantity to batch stock', () => {
      const result = validateSaleData(
        {
          ...validData,
          batchId: 'batch-1',
          livestockType: 'poultry',
          quantity: 30,
        },
        30, // batch quantity
      )
      expect(result).toBeNull()
    })

    it('should reject invalid payment status', () => {
      const result = validateSaleData(
        { ...validData, paymentStatus: 'invalid' as any },
        100,
      )
      expect(result).toBe('Invalid payment status')
    })

    it('should reject invalid payment method', () => {
      const result = validateSaleData(
        { ...validData, paymentMethod: 'invalid' as any },
        100,
      )
      expect(result).toBe('Invalid payment method')
    })

    it('should reject invalid unit type', () => {
      const result = validateSaleData(
        { ...validData, unitType: 'invalid' as any },
        100,
      )
      expect(result).toBe('Invalid unit type')
    })

    it('should accept valid payment statuses', () => {
      expect(
        validateSaleData({ ...validData, paymentStatus: 'paid' }, 100),
      ).toBeNull()
      expect(
        validateSaleData({ ...validData, paymentStatus: 'pending' }, 100),
      ).toBeNull()
      expect(
        validateSaleData({ ...validData, paymentStatus: 'partial' }, 100),
      ).toBeNull()
    })

    it('should accept valid payment methods', () => {
      expect(
        validateSaleData({ ...validData, paymentMethod: 'cash' }, 100),
      ).toBeNull()
      expect(
        validateSaleData({ ...validData, paymentMethod: 'transfer' }, 100),
      ).toBeNull()
      expect(
        validateSaleData({ ...validData, paymentMethod: 'credit' }, 100),
      ).toBeNull()
    })

    it('should accept valid unit types', () => {
      expect(
        validateSaleData({ ...validData, unitType: 'bird' }, 100),
      ).toBeNull()
      expect(validateSaleData({ ...validData, unitType: 'kg' }, 100)).toBeNull()
      expect(
        validateSaleData({ ...validData, unitType: 'crate' }, 100),
      ).toBeNull()
      expect(
        validateSaleData({ ...validData, unitType: 'piece' }, 100),
      ).toBeNull()
    })
  })

  describe('calculateNewBatchQuantity', () => {
    it('should subtract sold quantity from current', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 10000 }),
          fc.integer({ min: 1, max: 100 }),
          (current, sold) => {
            const result = calculateNewBatchQuantity(current, sold)
            expect(result).toBe(Math.max(0, current - sold))
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should never return negative values', () => {
      expect(calculateNewBatchQuantity(10, 15)).toBe(0)
      expect(calculateNewBatchQuantity(0, 5)).toBe(0)
    })

    it('should handle zero sold quantity', () => {
      expect(calculateNewBatchQuantity(100, 0)).toBe(100)
    })

    it('should return zero when all stock sold', () => {
      expect(calculateNewBatchQuantity(100, 100)).toBe(0)
    })
  })

  describe('determineBatchStatusAfterSale', () => {
    it('should return sold when all units sold', () => {
      expect(determineBatchStatusAfterSale(0, 100)).toBe('sold')
      expect(determineBatchStatusAfterSale(0, 50)).toBe('sold')
      expect(determineBatchStatusAfterSale(0, 1)).toBe('sold')
    })

    it('should return active when some units remain', () => {
      expect(determineBatchStatusAfterSale(50, 50)).toBe('active')
      expect(determineBatchStatusAfterSale(10, 90)).toBe('active')
      expect(determineBatchStatusAfterSale(99, 1)).toBe('active')
    })

    it('should return active when no units sold', () => {
      expect(determineBatchStatusAfterSale(100, 0)).toBe('active')
    })
  })

  describe('calculateQuantityDifference', () => {
    it('should return positive when quantity increases', () => {
      expect(calculateQuantityDifference(50, 60)).toBe(10)
      expect(calculateQuantityDifference(10, 100)).toBe(90)
    })

    it('should return negative when quantity decreases', () => {
      expect(calculateQuantityDifference(60, 50)).toBe(-10)
      expect(calculateQuantityDifference(100, 10)).toBe(-90)
    })

    it('should return zero when quantity unchanged', () => {
      expect(calculateQuantityDifference(50, 50)).toBe(0)
    })
  })

  describe('calculateNewTotalAmount', () => {
    it('should calculate total = quantity * unitPrice', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 100000 }),
          (quantity, priceCents) => {
            const unitPrice = priceCents / 100
            const result = calculateNewTotalAmount(quantity, unitPrice)
            const expected = (quantity * unitPrice).toFixed(2)
            expect(result).toBe(expected)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should use same calculation as calculateSaleTotal', () => {
      expect(calculateNewTotalAmount(50, 5.5)).toBe(calculateSaleTotal(50, 5.5))
      expect(calculateNewTotalAmount(100, 2.75)).toBe(
        calculateSaleTotal(100, 2.75),
      )
    })
  })

  describe('buildSalesSummary', () => {
    it('should build summary from raw sales data', () => {
      const sales = [
        {
          livestockType: 'poultry' as const,
          count: '5',
          totalQuantity: '250',
          totalRevenue: '1250.00',
        },
        {
          livestockType: 'fish' as const,
          count: '3',
          totalQuantity: '100',
          totalRevenue: '500.00',
        },
        {
          livestockType: 'eggs' as const,
          count: '10',
          totalQuantity: '500',
          totalRevenue: '250.00',
        },
      ]

      const result = buildSalesSummary(sales)

      expect(result.poultry).toEqual({
        count: 5,
        quantity: 250,
        revenue: 1250.0,
      })
      expect(result.fish).toEqual({ count: 3, quantity: 100, revenue: 500.0 })
      expect(result.eggs).toEqual({ count: 10, quantity: 500, revenue: 250.0 })
      expect(result.total).toEqual({
        count: 18,
        quantity: 850,
        revenue: 2000.0,
      })
    })

    it('should handle empty array', () => {
      const result = buildSalesSummary([])

      expect(result.poultry).toEqual({ count: 0, quantity: 0, revenue: 0 })
      expect(result.fish).toEqual({ count: 0, quantity: 0, revenue: 0 })
      expect(result.eggs).toEqual({ count: 0, quantity: 0, revenue: 0 })
      expect(result.total).toEqual({ count: 0, quantity: 0, revenue: 0 })
    })

    it('should only include known livestock types', () => {
      const sales = [
        {
          livestockType: 'poultry' as const,
          count: '5',
          totalQuantity: '250',
          totalRevenue: '1250.00',
        },
      ]

      const result = buildSalesSummary(sales)

      expect(result.poultry.count).toBe(5)
      expect(result.fish.count).toBe(0)
      expect(result.eggs.count).toBe(0)
      expect(result.total.count).toBe(5)
    })
  })

  describe('transformPaginatedResults', () => {
    it('should transform nullable fields to null', () => {
      const sales: Array<SaleWithJoins> = [
        {
          id: '1',
          farmId: 'farm-1',
          batchId: 'batch-1',
          customerId: 'customer-1',
          livestockType: 'poultry',
          quantity: 50,
          unitPrice: '5.50',
          totalAmount: '275.00',
          date: new Date(),
          notes: null,
          unitType: 'bird',
          ageWeeks: null,
          averageWeightKg: null,
          paymentStatus: 'paid',
          paymentMethod: 'cash',
          createdAt: new Date(),
          farmName: 'Farm A',
          customerName: 'Customer B',
          batchSpecies: 'Broiler',
        },
        {
          id: '2',
          farmId: 'farm-2',
          batchId: null,
          customerId: null,
          livestockType: 'fish',
          quantity: 30,
          unitPrice: '3.00',
          totalAmount: '90.00',
          date: new Date(),
          notes: null,
          unitType: 'kg',
          ageWeeks: null,
          averageWeightKg: null,
          paymentStatus: 'paid',
          paymentMethod: null,
          createdAt: new Date(),
          farmName: null,
          customerName: null,
          batchSpecies: null,
        },
      ]

      const result = transformPaginatedResults(sales)

      expect(result[0].farmName).toBe('Farm A')
      expect(result[0].customerName).toBe('Customer B')
      expect(result[0].batchSpecies).toBe('Broiler')

      expect(result[1].farmName).toBe(null)
      expect(result[1].customerName).toBe(null)
      expect(result[1].batchSpecies).toBe(null)
    })

    it('should preserve other fields', () => {
      const sales: Array<SaleWithJoins> = [
        {
          id: '1',
          farmId: 'farm-1',
          batchId: 'batch-1',
          customerId: 'customer-1',
          livestockType: 'poultry',
          quantity: 50,
          unitPrice: '5.50',
          totalAmount: '275.00',
          date: new Date(),
          notes: null,
          unitType: 'bird',
          ageWeeks: null,
          averageWeightKg: null,
          paymentStatus: 'paid',
          paymentMethod: 'cash',
          createdAt: new Date(),
          farmName: 'Farm A',
          customerName: 'Customer B',
          batchSpecies: 'Broiler',
        },
      ]

      const result = transformPaginatedResults(sales)

      expect(result[0].id).toBe('1')
      expect(result[0].quantity).toBe(50)
      expect(result[0].totalAmount).toBe('275.00')
    })
  })

  describe('validateUpdateData', () => {
    const validData: UpdateSaleInput = {
      quantity: 50,
      unitPrice: 5.5,
      date: new Date(),
    }

    it('should accept valid data', () => {
      const result = validateUpdateData(validData)
      expect(result).toBeNull()
    })

    it('should accept partial updates', () => {
      expect(validateUpdateData({ quantity: 60 })).toBeNull()
      expect(validateUpdateData({ unitPrice: 6.0 })).toBeNull()
      expect(validateUpdateData({ notes: 'Updated' })).toBeNull()
      expect(validateUpdateData({})).toBeNull()
    })

    it('should reject zero or negative quantity', () => {
      expect(validateUpdateData({ quantity: 0 })).toBe(
        'Quantity must be greater than 0',
      )
      expect(validateUpdateData({ quantity: -10 })).toBe(
        'Quantity must be greater than 0',
      )
    })

    it('should reject negative unit price', () => {
      const result = validateUpdateData({ unitPrice: -10 })
      expect(result).toBe('Unit price cannot be negative')
    })

    it('should reject invalid date', () => {
      const result = validateUpdateData({
        date: new Date('invalid') as any,
      })
      expect(result).toBe('Sale date is invalid')
    })

    it('should reject invalid payment status', () => {
      const result = validateUpdateData({ paymentStatus: 'invalid' as any })
      expect(result).toBe('Invalid payment status')
    })

    it('should reject invalid payment method', () => {
      const result = validateUpdateData({ paymentMethod: 'invalid' as any })
      expect(result).toBe('Invalid payment method')
    })

    it('should reject invalid unit type', () => {
      const result = validateUpdateData({ unitType: 'invalid' as any })
      expect(result).toBe('Invalid unit type')
    })

    it('should accept valid payment statuses', () => {
      expect(validateUpdateData({ paymentStatus: 'paid' })).toBeNull()
      expect(validateUpdateData({ paymentStatus: 'pending' })).toBeNull()
      expect(validateUpdateData({ paymentStatus: 'partial' })).toBeNull()
    })

    it('should accept valid payment methods', () => {
      expect(validateUpdateData({ paymentMethod: 'cash' })).toBeNull()
      expect(validateUpdateData({ paymentMethod: 'transfer' })).toBeNull()
      expect(validateUpdateData({ paymentMethod: 'credit' })).toBeNull()
    })

    it('should accept valid unit types', () => {
      expect(validateUpdateData({ unitType: 'bird' })).toBeNull()
      expect(validateUpdateData({ unitType: 'kg' })).toBeNull()
      expect(validateUpdateData({ unitType: 'crate' })).toBeNull()
      expect(validateUpdateData({ unitType: 'piece' })).toBeNull()
    })
  })
})
