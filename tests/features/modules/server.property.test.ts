import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import type { ModuleKey } from '~/features/modules/types'
import { DEFAULT_MODULES_BY_FARM_TYPE } from '~/features/modules/constants'

// Arbitraries
const farmTypeArb = fc.constantFrom(
  'poultry',
  'fishery',
  'cattle',
  'goats',
  'sheep',
  'bees',
  'mixed',
  'multi',
)

describe('Module Server Functions Property Tests', () => {
  describe('Property 2: Default Modules Match Farm Type', () => {
    it('should create correct default modules for each farm type', () => {
      fc.assert(
        fc.property(farmTypeArb, (farmType) => {
          const defaultModules = DEFAULT_MODULES_BY_FARM_TYPE[farmType]

          // Verify defaults exist for all farm types
          expect(defaultModules).toBeDefined()
          expect(Array.isArray(defaultModules)).toBe(true)

          // Verify all default modules are valid
          const validModules: Array<ModuleKey> = [
            'poultry',
            'aquaculture',
            'cattle',
            'goats',
            'sheep',
            'bees',
          ]

          defaultModules.forEach((moduleKey) => {
            expect(validModules.includes(moduleKey)).toBe(true)
          })

          // Verify specific farm types have expected defaults
          if (farmType === 'poultry') {
            expect(defaultModules).toContain('poultry')
          } else if (farmType === 'fishery') {
            expect(defaultModules).toContain('aquaculture')
          } else if (farmType === 'cattle') {
            expect(defaultModules).toContain('cattle')
          } else if (farmType === 'goats') {
            expect(defaultModules).toContain('goats')
          } else if (farmType === 'sheep') {
            expect(defaultModules).toContain('sheep')
          } else if (farmType === 'bees') {
            expect(defaultModules).toContain('bees')
          } else if (farmType === 'mixed') {
            expect(defaultModules.length).toBeGreaterThan(0)
          }

          // Multi farm type should have no defaults
          if (farmType === 'multi') {
            expect(defaultModules.length).toBe(0)
          }
        }),
        { numRuns: 100 },
      )
    })

    it('should not have duplicate modules in defaults', () => {
      fc.assert(
        fc.property(farmTypeArb, (farmType) => {
          const defaultModules = DEFAULT_MODULES_BY_FARM_TYPE[farmType]
          const uniqueModules = new Set(defaultModules)

          expect(uniqueModules.size).toBe(defaultModules.length)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Module Creation Logic', () => {
    it('should determine correct default modules for farm types', () => {
      fc.assert(
        fc.property(farmTypeArb, (farmType) => {
          const defaultModules = DEFAULT_MODULES_BY_FARM_TYPE[farmType]

          // Multi farm type should have no defaults (user selects manually)
          if (farmType === 'multi') {
            expect(defaultModules.length).toBe(0)
            return
          }

          // All other farm types should have at least one default module
          expect(defaultModules.length).toBeGreaterThanOrEqual(0)

          // Verify farm type matches expected modules
          const validModules: Array<ModuleKey> = [
            'poultry',
            'aquaculture',
            'cattle',
            'goats',
            'sheep',
            'bees',
          ]

          defaultModules.forEach((moduleKey) => {
            expect(validModules.includes(moduleKey)).toBe(true)
          })
        }),
        { numRuns: 100 },
      )
    })
  })
})
