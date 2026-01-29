import { describe, expect, it } from 'vitest'
import type {
  CreateStructureInput,
  UpdateStructureInput,
} from '~/features/structures/server'
import {
  buildStructuresSummary,
  calculateOccupancyPercentage,
  calculateStructureCapacity,
  canDeleteStructure,
  determineStructureStatus,
  validateStructureData,
  validateUpdateData,
} from '~/features/structures/service'

describe('Structure Service', () => {
  describe('validateStructureData', () => {
    const validData: CreateStructureInput = {
      farmId: 'farm-1',
      name: 'House A',
      type: 'house',
      capacity: 1000,
      status: 'active',
    }

    it('should accept valid data', () => {
      const result = validateStructureData(validData)
      expect(result).toBeNull()
    })

    it('should reject empty farm ID', () => {
      const result = validateStructureData({ ...validData, farmId: '' })
      expect(result).toBe('Farm ID is required')
    })

    it('should reject whitespace-only farm ID', () => {
      const result = validateStructureData({
        ...validData,
        farmId: '   ',
      })
      expect(result).toBe('Farm ID is required')
    })

    it('should reject empty name', () => {
      const result = validateStructureData({ ...validData, name: '' })
      expect(result).toBe('Structure name is required')
    })

    it('should reject whitespace-only name', () => {
      const result = validateStructureData({ ...validData, name: '   ' })
      expect(result).toBe('Structure name is required')
    })

    it('should reject empty type', () => {
      const result = validateStructureData({
        ...validData,
        type: '' as any,
      })
      expect(result).toBe('Structure type is required')
    })

    it('should reject empty status', () => {
      const result = validateStructureData({
        ...validData,
        status: '' as any,
      })
      expect(result).toBe('Structure status is required')
    })

    it('should reject negative capacity', () => {
      const result = validateStructureData({
        ...validData,
        capacity: -10,
      })
      expect(result).toBe('Capacity cannot be negative')
    })

    it('should accept null capacity', () => {
      const result = validateStructureData({
        ...validData,
        capacity: null,
      })
      expect(result).toBeNull()
    })

    it('should reject negative area', () => {
      const result = validateStructureData({ ...validData, areaSqm: -10 })
      expect(result).toBe('Area cannot be negative')
    })

    it('should accept all structure types', () => {
      const types = [
        'house',
        'pond',
        'pen',
        'cage',
        'barn',
        'pasture',
        'hive',
        'milking_parlor',
        'shearing_shed',
        'tank',
        'tarpaulin',
        'raceway',
        'feedlot',
        'kraal',
      ] as const

      for (const type of types) {
        const result = validateStructureData({ ...validData, type })
        expect(result).toBeNull()
      }
    })

    it('should accept all status values', () => {
      const statuses = ['active', 'empty', 'maintenance'] as const

      for (const status of statuses) {
        const result = validateStructureData({ ...validData, status })
        expect(result).toBeNull()
      }
    })
  })

  describe('calculateStructureCapacity', () => {
    it('should return null for null dimensions', () => {
      const result = calculateStructureCapacity('house', null)
      expect(result).toBeNull()
    })

    it('should return null for zero or negative dimensions', () => {
      expect(
        calculateStructureCapacity('house', { length: 0, width: 10 }),
      ).toBeNull()
      expect(
        calculateStructureCapacity('house', { length: -5, width: 10 }),
      ).toBeNull()
      expect(
        calculateStructureCapacity('house', { length: 10, width: 0 }),
      ).toBeNull()
    })

    it('should calculate capacity for house type', () => {
      const result = calculateStructureCapacity('house', {
        length: 20,
        width: 10,
      })
      // 20 * 10 = 200 sqm, * 10 density = 2000 capacity
      expect(result).toBe(2000)
    })

    it('should calculate capacity for pond type', () => {
      const result = calculateStructureCapacity('pond', {
        length: 10,
        width: 10,
      })
      // 10 * 10 = 100 sqm, * 0.5 density = 50 capacity
      expect(result).toBe(50)
    })

    it('should calculate capacity for cage type', () => {
      const result = calculateStructureCapacity('cage', {
        length: 5,
        width: 5,
      })
      // 5 * 5 = 25 sqm, * 20 density = 500 capacity
      expect(result).toBe(500)
    })

    it('should use default density for unknown types', () => {
      const result = calculateStructureCapacity('unknown_type', {
        length: 10,
        width: 10,
      })
      // 10 * 10 = 100 sqm, * 2 default density = 200 capacity
      expect(result).toBe(200)
    })

    it('should handle fractional results correctly', () => {
      const result = calculateStructureCapacity('pond', {
        length: 3,
        width: 3,
      })
      // 3 * 3 = 9 sqm, * 0.5 density = 4.5 -> floor = 4
      expect(result).toBe(4)
    })
  })

  describe('determineStructureStatus', () => {
    it('should return inactive for non-active structures', () => {
      expect(determineStructureStatus(false, 0, 1000)).toBe('inactive')
      expect(determineStructureStatus(false, 500, 1000)).toBe('inactive')
    })

    it('should return full when at capacity', () => {
      expect(determineStructureStatus(true, 1000, 1000)).toBe('full')
      expect(determineStructureStatus(true, 1500, 1000)).toBe('full')
    })

    it('should return active when below capacity', () => {
      expect(determineStructureStatus(true, 0, 1000)).toBe('active')
      expect(determineStructureStatus(true, 500, 1000)).toBe('active')
      expect(determineStructureStatus(true, 999, 1000)).toBe('active')
    })

    it('should return active when no capacity set', () => {
      expect(determineStructureStatus(true, 500, null)).toBe('active')
      expect(determineStructureStatus(true, 0, null)).toBe('active')
    })
  })

  describe('buildStructuresSummary', () => {
    it('should return empty summary for empty array', () => {
      const result = buildStructuresSummary([])
      expect(result).toEqual({
        total: 0,
        byType: {},
        byStatus: {},
        totalCapacity: null,
        activeCapacity: null,
      })
    })

    it('should count structures by type', () => {
      const result = buildStructuresSummary([
        { type: 'house', status: 'active', capacity: 1000 },
        { type: 'house', status: 'active', capacity: 1000 },
        { type: 'pond', status: 'active', capacity: 500 },
      ])

      expect(result.total).toBe(3)
      expect(result.byType).toEqual({ house: 2, pond: 1 })
    })

    it('should count structures by status', () => {
      const result = buildStructuresSummary([
        { type: 'house', status: 'active', capacity: 1000 },
        { type: 'house', status: 'inactive', capacity: 1000 },
        { type: 'house', status: 'empty', capacity: 1000 },
      ])

      expect(result.byStatus).toEqual({
        active: 1,
        inactive: 1,
        empty: 1,
      })
    })

    it('should sum capacities', () => {
      const result = buildStructuresSummary([
        { type: 'house', status: 'active', capacity: 1000 },
        { type: 'pond', status: 'active', capacity: 500 },
        { type: 'pen', status: 'inactive', capacity: 200 },
      ])

      expect(result.totalCapacity).toBe(1700)
      expect(result.activeCapacity).toBe(1500)
    })

    it('should return null for capacities when none set', () => {
      const result = buildStructuresSummary([
        { type: 'house', status: 'active', capacity: null },
        { type: 'pond', status: 'active', capacity: null },
      ])

      expect(result.totalCapacity).toBeNull()
      expect(result.activeCapacity).toBeNull()
    })
  })

  describe('validateUpdateData', () => {
    const validData: UpdateStructureInput = {
      name: 'Updated House',
      type: 'house',
      status: 'active',
    }

    it('should accept valid data', () => {
      const result = validateUpdateData(validData)
      expect(result).toBeNull()
    })

    it('should accept partial updates', () => {
      expect(validateUpdateData({ name: 'New Name' })).toBeNull()
      expect(validateUpdateData({ status: 'empty' })).toBeNull()
      expect(validateUpdateData({})).toBeNull()
    })

    it('should reject empty name', () => {
      const result = validateUpdateData({ name: '' })
      expect(result).toBe('Structure name cannot be empty')
    })

    it('should reject whitespace-only name', () => {
      const result = validateUpdateData({ name: '   ' })
      expect(result).toBe('Structure name cannot be empty')
    })

    it('should reject empty type', () => {
      const result = validateUpdateData({ type: '' as any })
      expect(result).toBe('Structure type cannot be empty')
    })

    it('should reject empty status', () => {
      const result = validateUpdateData({ status: '' as any })
      expect(result).toBe('Structure status cannot be empty')
    })

    it('should reject negative capacity', () => {
      const result = validateUpdateData({ capacity: -10 })
      expect(result).toBe('Capacity cannot be negative')
    })

    it('should reject negative area', () => {
      const result = validateUpdateData({ areaSqm: -10 })
      expect(result).toBe('Area cannot be negative')
    })
  })

  describe('calculateOccupancyPercentage', () => {
    it('should return null when no capacity set', () => {
      expect(calculateOccupancyPercentage(500, null)).toBeNull()
    })

    it('should return null for zero capacity', () => {
      expect(calculateOccupancyPercentage(500, 0)).toBeNull()
    })

    it('should return 0 for zero occupancy', () => {
      expect(calculateOccupancyPercentage(0, 1000)).toBe(0)
    })

    it('should calculate percentage correctly', () => {
      expect(calculateOccupancyPercentage(500, 1000)).toBe(50)
      expect(calculateOccupancyPercentage(250, 1000)).toBe(25)
      expect(calculateOccupancyPercentage(750, 1000)).toBe(75)
    })

    it('should cap at 100% for over-capacity', () => {
      expect(calculateOccupancyPercentage(1500, 1000)).toBe(100)
    })

    it('should handle decimal percentages', () => {
      // 333/1000 = 33.3%, floor gives 33
      const result = calculateOccupancyPercentage(333, 1000)
      expect(result).toBe(33)
    })
  })

  describe('canDeleteStructure', () => {
    it('should return true when no active batches', () => {
      expect(canDeleteStructure(0)).toBe(true)
    })

    it('should return false when has active batches', () => {
      expect(canDeleteStructure(1)).toBe(false)
      expect(canDeleteStructure(5)).toBe(false)
    })
  })
})
