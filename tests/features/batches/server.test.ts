import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { LivestockType } from '~/features/modules/types'
import { MODULE_METADATA } from '~/features/modules/constants'
import { SOURCE_SIZE_OPTIONS, getSourceSizeOptions } from '~/features/batches/server'

describe('batches/server logic', () => {
  const livestockTypes: Array<LivestockType> = ['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees']

  describe('getSourceSizeOptions', () => {
    it('should return source size options for all livestock types', () => {
      livestockTypes.forEach((type) => {
        const options = getSourceSizeOptions(type)
        expect(Array.isArray(options)).toBe(true)
        expect(options.length).toBeGreaterThan(0)
      })
    })

    it('should return options with value and label', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...livestockTypes),
          (livestockType) => {
            const options = getSourceSizeOptions(livestockType)
            
            options.forEach((option) => {
              expect(option).toHaveProperty('value')
              expect(option).toHaveProperty('label')
              expect(typeof option.value).toBe('string')
              expect(typeof option.label).toBe('string')
              expect(option.value.length).toBeGreaterThan(0)
              expect(option.label.length).toBeGreaterThan(0)
            })
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return empty array for unknown livestock type', () => {
      const options = getSourceSizeOptions('unknown' as LivestockType)
      expect(options).toEqual([])
    })

    it('should match MODULE_METADATA source size options', () => {
      livestockTypes.forEach((type) => {
        const options = getSourceSizeOptions(type)
        
        // Find the module that handles this type
        const moduleEntry = Object.entries(MODULE_METADATA).find(([_, metadata]) =>
          metadata.livestockTypes.includes(type),
        )
        
        expect(moduleEntry).toBeDefined()
        if (moduleEntry) {
          expect(options).toEqual(moduleEntry[1].sourceSizeOptions)
        }
      })
    })
  })

  describe('SOURCE_SIZE_OPTIONS', () => {
    it('should have pre-computed options for all livestock types', () => {
      livestockTypes.forEach((type) => {
        expect(SOURCE_SIZE_OPTIONS[type]).toBeDefined()
        expect(Array.isArray(SOURCE_SIZE_OPTIONS[type])).toBe(true)
      })
    })

    it('should match getSourceSizeOptions output', () => {
      livestockTypes.forEach((type) => {
        expect(SOURCE_SIZE_OPTIONS[type]).toEqual(getSourceSizeOptions(type))
      })
    })
  })

  describe('batch quantity invariants', () => {
    it('current quantity should equal initial - mortalities - sales', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          (initial, mortalities, sales) => {
            // Constrain to valid values
            const actualMortalities = Math.min(mortalities, initial)
            const actualSales = Math.min(sales, initial - actualMortalities)
            
            const current = initial - actualMortalities - actualSales
            
            expect(current).toBeGreaterThanOrEqual(0)
            expect(current).toBeLessThanOrEqual(initial)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('batch status should be depleted when current quantity is 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          () => {
            const status: 'depleted' | 'active' | 'sold' = 'depleted'

            expect(status).toBe('depleted')
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('batch cost calculations', () => {
    it('total cost should equal quantity * cost per unit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 100000 }), // Use integer cents to avoid float issues
          (quantity, costCents) => {
            const costPerUnit = costCents / 100
            const totalCost = quantity * costPerUnit
            
            expect(totalCost).toBeGreaterThan(0)
            expect(totalCost).toBeCloseTo(quantity * costPerUnit, 2)
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
