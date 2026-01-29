import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import type { LivestockType, ModuleKey } from '~/features/modules/types'
import {
  DEFAULT_MODULES_BY_FARM_TYPE,
  MODULE_METADATA,
} from '~/features/modules/constants'
import {
  getEnabledModuleMetadata,
  getFeedTypesForModules,
  getLivestockTypesForModules,
  getSourceSizeForLivestockType,
  getStructureTypesForModules,
} from '~/features/modules/utils'

// Arbitraries
const moduleKeyArb = fc.constantFrom<ModuleKey>(
  'poultry',
  'aquaculture',
  'cattle',
  'goats',
  'sheep',
  'bees',
)

const moduleKeysArb = fc.uniqueArray(moduleKeyArb, {
  minLength: 1,
  maxLength: 6,
})

const livestockTypeArb = fc.constantFrom<LivestockType>(
  'poultry',
  'fish',
  'cattle',
  'goats',
  'sheep',
  'bees',
)

describe('Module Constants Property Tests', () => {
  describe('Property 5: Module Metadata Completeness', () => {
    it('should have complete metadata for all module keys', () => {
      fc.assert(
        fc.property(moduleKeyArb, (moduleKey) => {
          const metadata = MODULE_METADATA[moduleKey]

          // Metadata exists
          expect(metadata).toBeDefined()

          // All required fields are present
          expect(metadata.key).toBe(moduleKey)
          expect(metadata.name).toBeTruthy()
          expect(metadata.description).toBeTruthy()
          expect(metadata.icon).toBeTruthy()

          // Arrays are non-empty
          expect(metadata.livestockTypes.length).toBeGreaterThan(0)
          expect(metadata.productTypes.length).toBeGreaterThan(0)
          expect(metadata.sourceSizeOptions.length).toBeGreaterThan(0)
          expect(metadata.feedTypes.length).toBeGreaterThan(0)
          expect(metadata.structureTypes.length).toBeGreaterThan(0)

          // Source size options have value and label
          metadata.sourceSizeOptions.forEach((option) => {
            expect(option.value).toBeTruthy()
            expect(option.label).toBeTruthy()
          })
        }),
        { numRuns: 100 },
      )
    })

    it('should have unique source size option values within each module', () => {
      fc.assert(
        fc.property(moduleKeyArb, (moduleKey) => {
          const metadata = MODULE_METADATA[moduleKey]
          const values = metadata.sourceSizeOptions.map((o) => o.value)
          const uniqueValues = new Set(values)

          expect(uniqueValues.size).toBe(values.length)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 9: Source Size Options Appropriate Per Livestock Type', () => {
    it('should return source size options that match the livestock type', () => {
      fc.assert(
        fc.property(livestockTypeArb, (livestockType) => {
          const sourceSizes = getSourceSizeForLivestockType(livestockType)

          // Should have at least one source size option
          expect(sourceSizes.length).toBeGreaterThan(0)

          // All source sizes should have value and label
          sourceSizes.forEach((option) => {
            expect(option.value).toBeTruthy()
            expect(option.label).toBeTruthy()
          })

          // Verify the source sizes come from the correct module
          const moduleEntry = Object.entries(MODULE_METADATA).find(
            ([_, metadata]) => metadata.livestockTypes.includes(livestockType),
          )
          expect(moduleEntry).toBeDefined()

          if (moduleEntry) {
            const [_, metadata] = moduleEntry
            expect(sourceSizes).toEqual(metadata.sourceSizeOptions)
          }
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 10: Feed Types Filtered By Livestock Type', () => {
    it('should return only feed types relevant to enabled modules', () => {
      fc.assert(
        fc.property(moduleKeysArb, (enabledModules) => {
          const feedTypes = getFeedTypesForModules(enabledModules)

          // Should have at least one feed type
          expect(feedTypes.length).toBeGreaterThan(0)

          // All feed types should come from enabled modules
          const expectedFeedTypes = new Set<string>(
            enabledModules.flatMap((key) => MODULE_METADATA[key].feedTypes),
          )

          feedTypes.forEach((feedType) => {
            expect(expectedFeedTypes.has(feedType)).toBe(true)
          })

          // No duplicates
          const uniqueFeedTypes = new Set(feedTypes)
          expect(uniqueFeedTypes.size).toBe(feedTypes.length)
        }),
        { numRuns: 100 },
      )
    })

    it('should not include feed types from disabled modules', () => {
      fc.assert(
        fc.property(moduleKeysArb, (enabledModules) => {
          const allModules: Array<ModuleKey> = [
            'poultry',
            'aquaculture',
            'cattle',
            'goats',
            'sheep',
            'bees',
          ]
          const disabledModules = allModules.filter(
            (m) => !enabledModules.includes(m),
          )

          if (disabledModules.length === 0) return true // Skip if all modules enabled

          const feedTypes = getFeedTypesForModules(enabledModules)
          const disabledFeedTypes = new Set<string>(
            disabledModules.flatMap((key) => MODULE_METADATA[key].feedTypes),
          )

          // Check that no feed type is exclusive to disabled modules
          feedTypes.forEach((feedType) => {
            // If this feed type is in disabled modules, it must also be in enabled modules
            if (disabledFeedTypes.has(feedType)) {
              const enabledFeedTypes = new Set<string>(
                enabledModules.flatMap((key) => MODULE_METADATA[key].feedTypes),
              )
              expect(enabledFeedTypes.has(feedType)).toBe(true)
            }
          })

          return true
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 12: Helper Functions Filter By Enabled Modules', () => {
    it('should return metadata only for enabled modules', () => {
      fc.assert(
        fc.property(moduleKeysArb, (enabledModules) => {
          const metadata = getEnabledModuleMetadata(enabledModules)

          // Should return same number of items as enabled modules
          expect(metadata.length).toBe(enabledModules.length)

          // All returned metadata should be for enabled modules
          metadata.forEach((m) => {
            expect(enabledModules.includes(m.key)).toBe(true)
          })

          // Should maintain order
          metadata.forEach((m, index) => {
            expect(m.key).toBe(enabledModules[index])
          })
        }),
        { numRuns: 100 },
      )
    })

    it('should return livestock types only from enabled modules', () => {
      fc.assert(
        fc.property(moduleKeysArb, (enabledModules) => {
          const livestockTypes = getLivestockTypesForModules(enabledModules)

          // Should have at least one livestock type
          expect(livestockTypes.length).toBeGreaterThan(0)

          // All livestock types should come from enabled modules
          const expectedTypes = new Set<string>(
            enabledModules.flatMap(
              (key) => MODULE_METADATA[key].livestockTypes,
            ),
          )

          livestockTypes.forEach((type) => {
            expect(expectedTypes.has(type)).toBe(true)
          })

          // No duplicates
          const uniqueTypes = new Set(livestockTypes)
          expect(uniqueTypes.size).toBe(livestockTypes.length)
        }),
        { numRuns: 100 },
      )
    })

    it('should return structure types only from enabled modules', () => {
      fc.assert(
        fc.property(moduleKeysArb, (enabledModules) => {
          const structureTypes = getStructureTypesForModules(enabledModules)

          // Should have at least one structure type
          expect(structureTypes.length).toBeGreaterThan(0)

          // All structure types should come from enabled modules
          const expectedTypes = new Set<string>(
            enabledModules.flatMap(
              (key) => MODULE_METADATA[key].structureTypes,
            ),
          )

          structureTypes.forEach((type) => {
            expect(expectedTypes.has(type)).toBe(true)
          })

          // No duplicates
          const uniqueTypes = new Set(structureTypes)
          expect(uniqueTypes.size).toBe(structureTypes.length)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Default Modules By Farm Type', () => {
    it('should have default modules defined for all farm types', () => {
      const farmTypes = [
        'poultry',
        'aquaculture',
        'cattle',
        'goats',
        'sheep',
        'bees',
        'mixed',
        'multi',
      ]

      farmTypes.forEach((farmType) => {
        expect(DEFAULT_MODULES_BY_FARM_TYPE[farmType]).toBeDefined()
        expect(Array.isArray(DEFAULT_MODULES_BY_FARM_TYPE[farmType])).toBe(true)
      })
    })

    it('should only include valid module keys in defaults', () => {
      const validModuleKeys: Array<ModuleKey> = [
        'poultry',
        'aquaculture',
        'cattle',
        'goats',
        'sheep',
        'bees',
      ]

      Object.values(DEFAULT_MODULES_BY_FARM_TYPE).forEach((modules) => {
        modules.forEach((moduleKey) => {
          expect(validModuleKeys.includes(moduleKey)).toBe(true)
        })
      })
    })
  })
})
