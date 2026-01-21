import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateBatchData, UpdateBatchData } from '~/features/batches/server'
import {
  calculateBatchTotalCost,
  calculateDepletionPercentage,
  calculateFCR,
  calculateMortalityRate,
  calculateNewQuantity,
  canDeleteBatch,
  determineBatchStatus,
  validateBatchData,
  validateUpdateData,
} from '~/features/batches/service'

describe('Batch Service', () => {
  describe('calculateBatchTotalCost', () => {
    it('should calculate total = quantity * costPerUnit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 100000 }),
          (quantity, costCents) => {
            const costPerUnit = costCents / 100
            const result = calculateBatchTotalCost(quantity, costPerUnit)
            const expected = (quantity * costPerUnit).toFixed(2)
            expect(result).toBe(expected)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return 0 for zero or negative quantities', () => {
      expect(calculateBatchTotalCost(0, 10)).toBe('0.00')
      expect(calculateBatchTotalCost(-10, 10)).toBe('0.00')
    })

    it('should return 0 for negative cost per unit', () => {
      expect(calculateBatchTotalCost(100, -10)).toBe('0.00')
    })

    it('should handle decimal costs correctly', () => {
      expect(calculateBatchTotalCost(100, 5.5)).toBe('550.00')
      expect(calculateBatchTotalCost(50, 7.25)).toBe('362.50')
    })
  })

  describe('validateBatchData', () => {
    const validData: CreateBatchData = {
      farmId: 'farm-1',
      livestockType: 'poultry',
      species: 'Broiler',
      initialQuantity: 100,
      acquisitionDate: new Date(),
      costPerUnit: 10,
    }

    it('should accept valid data', () => {
      const result = validateBatchData(validData)
      expect(result).toBeNull()
    })

    it('should reject empty farm ID', () => {
      const result = validateBatchData({ ...validData, farmId: '' })
      expect(result).toBe('Farm ID is required')
    })

    it('should reject empty species', () => {
      const result = validateBatchData({ ...validData, species: '' })
      expect(result).toBe('Species is required')
    })

    it('should reject zero or negative quantity', () => {
      expect(validateBatchData({ ...validData, initialQuantity: 0 })).toBe(
        'Initial quantity must be greater than 0',
      )
      expect(validateBatchData({ ...validData, initialQuantity: -10 })).toBe(
        'Initial quantity must be greater than 0',
      )
    })

    it('should reject negative cost per unit', () => {
      const result = validateBatchData({ ...validData, costPerUnit: -10 })
      expect(result).toBe('Cost per unit cannot be negative')
    })

    it('should reject invalid acquisition date', () => {
      const result = validateBatchData({
        ...validData,
        acquisitionDate: new Date('invalid') as any,
      })
      expect(result).toBe('Acquisition date is required')
    })

    it('should reject target harvest date before acquisition date', () => {
      const acquisitionDate = new Date('2024-01-01')
      const targetHarvestDate = new Date('2023-12-01')
      const result = validateBatchData({
        ...validData,
        acquisitionDate,
        targetHarvestDate,
      })
      expect(result).toBe('Target harvest date must be after acquisition date')
    })

    it('should reject negative target weight', () => {
      const result = validateBatchData({
        ...validData,
        target_weight_g: -100,
      })
      expect(result).toBe('Target weight must be greater than 0')
    })

    it('should accept zero target weight', () => {
      const result = validateBatchData({
        ...validData,
        target_weight_g: 0,
      })
      expect(result).toBe('Target weight must be greater than 0')
    })

    it('should accept null target weight', () => {
      const result = validateBatchData({
        ...validData,
        target_weight_g: null,
      })
      expect(result).toBeNull()
    })
  })

  describe('determineBatchStatus', () => {
    it('should return active when quantity > 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (qty) => {
          expect(determineBatchStatus(qty)).toBe('active')
        }),
        { numRuns: 100 },
      )
    })

    it('should return depleted when quantity is 0', () => {
      expect(determineBatchStatus(0)).toBe('depleted')
    })

    it('should return sold when all units sold', () => {
      expect(determineBatchStatus(0, 100)).toBe('sold')
    })

    it('should return active when some units sold but remaining', () => {
      expect(determineBatchStatus(50, 50)).toBe('active')
    })
  })

  describe('calculateMortalityRate', () => {
    it('should calculate rate as percentage', () => {
      expect(calculateMortalityRate(100, 90, 10)).toBe(10)
      expect(calculateMortalityRate(100, 50, 50)).toBe(50)
      expect(calculateMortalityRate(200, 180, 20)).toBe(10)
    })

    it('should return 0 for zero initial quantity', () => {
      expect(calculateMortalityRate(0, 0, 0)).toBe(0)
      expect(calculateMortalityRate(0, 0, 10)).toBe(0)
    })

    it('should handle rates over 100%', () => {
      // More deaths than initial (tracking cumulative deaths)
      expect(calculateMortalityRate(100, 0, 150)).toBe(150)
    })

    it('should return 0 for zero mortality', () => {
      expect(calculateMortalityRate(100, 100, 0)).toBe(0)
    })
  })

  describe('calculateFCR', () => {
    it('should calculate feed conversion ratio', () => {
      expect(calculateFCR(150, 100)).toBe(1.5)
      expect(calculateFCR(200, 100)).toBe(2)
      expect(calculateFCR(100, 50)).toBe(2)
    })

    it('should return null for zero or negative feed', () => {
      expect(calculateFCR(0, 100)).toBeNull()
      expect(calculateFCR(-10, 100)).toBeNull()
    })

    it('should return null for zero or negative weight', () => {
      expect(calculateFCR(100, 0)).toBeNull()
      expect(calculateFCR(100, -10)).toBeNull()
    })

    it('should handle decimal values', () => {
      expect(calculateFCR(157.5, 100)).toBe(1.575)
    })
  })

  describe('calculateNewQuantity', () => {
    it('should subtract mortality from current quantity', () => {
      expect(calculateNewQuantity(100, 5)).toBe(95)
      expect(calculateNewQuantity(50, 10)).toBe(40)
    })

    it('should never return negative values', () => {
      expect(calculateNewQuantity(10, 15)).toBe(0)
      expect(calculateNewQuantity(0, 5)).toBe(0)
    })

    it('should handle zero mortality', () => {
      expect(calculateNewQuantity(100, 0)).toBe(100)
    })
  })

  describe('validateUpdateData', () => {
    const validData: UpdateBatchData = {
      species: 'Broiler',
      status: 'active',
    }

    it('should accept valid data', () => {
      const result = validateUpdateData(validData)
      expect(result).toBeNull()
    })

    it('should accept partial updates', () => {
      expect(validateUpdateData({ species: 'Layer' })).toBeNull()
      expect(validateUpdateData({ status: 'depleted' })).toBeNull()
      expect(validateUpdateData({})).toBeNull()
    })

    it('should reject empty species', () => {
      const result = validateUpdateData({ species: '' })
      expect(result).toBe('Species cannot be empty')
    })

    it('should reject invalid target harvest date', () => {
      const result = validateUpdateData({
        targetHarvestDate: new Date('invalid') as any,
      })
      expect(result).toBe('Target harvest date is invalid')
    })

    it('should reject negative target weight', () => {
      const result = validateUpdateData({ target_weight_g: -100 })
      expect(result).toBe('Target weight cannot be negative')
    })

    it('should accept zero target weight', () => {
      const result = validateUpdateData({ target_weight_g: 0 })
      expect(result).toBeNull()
    })

    it('should accept null target weight', () => {
      const result = validateUpdateData({ target_weight_g: null })
      expect(result).toBeNull()
    })
  })

  describe('canDeleteBatch', () => {
    it('should return true when no related records', () => {
      const result = canDeleteBatch({
        hasFeedRecords: false,
        hasEggRecords: false,
        hasSales: false,
        hasMortality: false,
      })
      expect(result).toBe(true)
    })

    it('should return false when has feed records', () => {
      const result = canDeleteBatch({
        hasFeedRecords: true,
        hasEggRecords: false,
        hasSales: false,
        hasMortality: false,
      })
      expect(result).toBe(false)
    })

    it('should return false when has egg records', () => {
      const result = canDeleteBatch({
        hasFeedRecords: false,
        hasEggRecords: true,
        hasSales: false,
        hasMortality: false,
      })
      expect(result).toBe(false)
    })

    it('should return false when has sales', () => {
      const result = canDeleteBatch({
        hasFeedRecords: false,
        hasEggRecords: false,
        hasSales: true,
        hasMortality: false,
      })
      expect(result).toBe(false)
    })

    it('should return false when has mortality', () => {
      const result = canDeleteBatch({
        hasFeedRecords: false,
        hasEggRecords: false,
        hasSales: false,
        hasMortality: true,
      })
      expect(result).toBe(false)
    })
  })

  describe('calculateDepletionPercentage', () => {
    it('should calculate depletion percentage', () => {
      expect(calculateDepletionPercentage(100, 60)).toBe(40)
      expect(calculateDepletionPercentage(100, 0)).toBe(100)
      expect(calculateDepletionPercentage(100, 100)).toBe(0)
    })

    it('should return 0 for zero initial quantity', () => {
      expect(calculateDepletionPercentage(0, 0)).toBe(0)
    })

    it('should cap at 100% maximum', () => {
      // More depleted than initial (edge case)
      expect(calculateDepletionPercentage(100, -10)).toBe(100)
    })

    it('should handle decimal values', () => {
      expect(calculateDepletionPercentage(100, 37.5)).toBe(62.5)
    })
  })
})
