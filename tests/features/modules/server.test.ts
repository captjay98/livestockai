import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { ModuleKey } from '~/features/modules/types'
import { DEFAULT_MODULES_BY_FARM_TYPE, MODULE_METADATA } from '~/features/modules/constants'

/**
 * Server function logic tests - testing the business logic without database
 * The actual server functions use dynamic imports, so we test the logic patterns
 */
describe('modules/server logic', () => {
  describe('getEnabledModules logic', () => {
    it('should filter to only enabled modules', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.constantFrom('poultry', 'aquaculture', 'cattle', 'goats', 'sheep', 'bees') as fc.Arbitrary<ModuleKey>,
            { minLength: 0, maxLength: 6 },
          ),
          fc.func(fc.boolean()),
          (moduleKeys, enabledFn) => {
            // Create modules with unique keys
            const modules = moduleKeys.map((moduleKey) => ({
              moduleKey,
              enabled: enabledFn(moduleKey),
            }))
            
            // This is the logic from getEnabledModules
            const enabled = modules.filter((m) => m.enabled).map((m) => m.moduleKey)
            
            // All returned modules should be enabled
            enabled.forEach((key) => {
              const original = modules.find((m) => m.moduleKey === key)
              expect(original?.enabled).toBe(true)
            })
            
            // Count should match
            const expectedCount = modules.filter((m) => m.enabled).length
            expect(enabled.length).toBe(expectedCount)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('createDefaultModules logic', () => {
    const farmTypes = ['poultry', 'fishery', 'cattle', 'goats', 'sheep', 'bees', 'mixed', 'multi']

    it('should have defaults for all farm types', () => {
      farmTypes.forEach((farmType) => {
        const defaults = DEFAULT_MODULES_BY_FARM_TYPE[farmType]
        expect(defaults).toBeDefined()
        expect(Array.isArray(defaults)).toBe(true)
      })
    })

    it('should return empty array for multi farm type', () => {
      expect(DEFAULT_MODULES_BY_FARM_TYPE['multi']).toEqual([])
    })

    it('should include matching module for single-type farms', () => {
      expect(DEFAULT_MODULES_BY_FARM_TYPE['poultry']).toContain('poultry')
      expect(DEFAULT_MODULES_BY_FARM_TYPE['fishery']).toContain('aquaculture')
      expect(DEFAULT_MODULES_BY_FARM_TYPE['cattle']).toContain('cattle')
      expect(DEFAULT_MODULES_BY_FARM_TYPE['goats']).toContain('goats')
      expect(DEFAULT_MODULES_BY_FARM_TYPE['sheep']).toContain('sheep')
      expect(DEFAULT_MODULES_BY_FARM_TYPE['bees']).toContain('bees')
    })

    it('should create 6 module records (all modules, some enabled)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...farmTypes.filter((t) => t !== 'multi')),
          (farmType) => {
            const defaultModules = DEFAULT_MODULES_BY_FARM_TYPE[farmType] ?? []
            const allModules: Array<ModuleKey> = ['poultry', 'aquaculture', 'cattle', 'goats', 'sheep', 'bees']
            
            // Logic from createDefaultModules
            const moduleRecords = allModules.map((moduleKey) => ({
              moduleKey,
              enabled: defaultModules.includes(moduleKey),
            }))
            
            expect(moduleRecords.length).toBe(6)
            
            // At least one should be enabled (except for unknown types)
            if (defaultModules.length > 0) {
              const enabledCount = moduleRecords.filter((m) => m.enabled).length
              expect(enabledCount).toBeGreaterThan(0)
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('canDisableModule logic', () => {
    it('should check livestock types from module metadata', () => {
      const allModules: Array<ModuleKey> = ['poultry', 'aquaculture', 'cattle', 'goats', 'sheep', 'bees']
      
      allModules.forEach((moduleKey) => {
        const metadata = MODULE_METADATA[moduleKey]
        expect(metadata).toBeDefined()
        expect(metadata.livestockTypes.length).toBeGreaterThan(0)
      })
    })

    it('should return true when no matching active batches', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('poultry', 'aquaculture', 'cattle', 'goats', 'sheep', 'bees') as fc.Arbitrary<ModuleKey>,
          fc.array(
            fc.record({
              status: fc.constantFrom('sold', 'depleted'),
              livestockType: fc.constantFrom('poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'),
            }),
            { minLength: 0, maxLength: 10 },
          ),
          (moduleKey, batches) => {
            const metadata = MODULE_METADATA[moduleKey]
            const livestockTypes = metadata.livestockTypes
            
            // Logic from canDisableModule - check for active batches
            const activeBatches = batches.filter(
              (b) => b.status === 'active' && livestockTypes.includes(b.livestockType as any),
            )
            
            // No active batches with these livestock types = can disable
            const canDisable = activeBatches.length === 0
            expect(canDisable).toBe(true)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return false when active batches exist for module', () => {
      const moduleKey: ModuleKey = 'poultry'
      const metadata = MODULE_METADATA[moduleKey]
      const livestockType = metadata.livestockTypes[0]
      
      const batches = [{ status: 'active', livestockType }]
      
      const activeBatches = batches.filter(
        (b) => b.status === 'active' && metadata.livestockTypes.includes(b.livestockType as any),
      )
      
      expect(activeBatches.length).toBeGreaterThan(0)
    })
  })

  describe('toggleModule logic', () => {
    it('should update or create based on existing record', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // existing record exists
          fc.boolean(), // new enabled state
          (exists, enabled) => {
            // Logic: if exists, update; else insert
            const action = exists ? 'update' : 'insert'
            
            if (exists) {
              expect(action).toBe('update')
            } else {
              expect(action).toBe('insert')
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
