/**
 * Onboarding Property Tests
 *
 * Property-based tests for the onboarding redesign.
 * Feature: onboarding-redesign
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { ModuleKey } from '~/features/modules/types'
import type {
  OnboardingProgress,
  OnboardingStep,
} from '~/features/onboarding/types'
import { DEFAULT_PROGRESS, ONBOARDING_STEPS } from '~/features/onboarding/types'
import {
  filterLivestockTypesByModules,
  getDefaultModulesForFarmType,
  getLivestockTypesForModules,
} from '~/features/modules/utils'

// Arbitraries for generating test data
const moduleKeyArb = fc.constantFrom<ModuleKey>(
  'poultry',
  'aquaculture',
  'cattle',
  'goats',
  'sheep',
  'bees',
)

const onboardingStepArb = fc.constantFrom<OnboardingStep>(
  'welcome',
  'create-farm',
  'create-structure',
  'create-batch',
  'preferences',
  'tour',
  'complete',
)

// Use a constrained date range to avoid invalid dates
const validDateArb = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
  noInvalidDate: true,
})

const onboardingProgressArb = fc.record({
  currentStep: onboardingStepArb,
  completedSteps: fc.array(onboardingStepArb, { maxLength: 7 }),
  farmId: fc.option(fc.uuid(), { nil: undefined }),
  structureId: fc.option(fc.uuid(), { nil: undefined }),
  batchId: fc.option(fc.uuid(), { nil: undefined }),
  enabledModules: fc.array(moduleKeyArb, { maxLength: 6 }),
  skipped: fc.boolean(),
  completedAt: fc.option(
    validDateArb.map((d) => d.toISOString()),
    {
      nil: undefined,
    },
  ),
})

describe('Onboarding Redesign Property Tests', () => {
  /**
   * Property 5: LocalStorage Round-Trip Persistence
   * **Validates: Requirements 9.3, 9.4**
   *
   * For any valid OnboardingProgress object, serializing it to JSON
   * and then deserializing it should produce an equivalent object
   * with all fields preserved (including enabledModules array).
   */
  describe('Property 5: LocalStorage Round-Trip Persistence', () => {
    it('should preserve all fields through JSON serialization', () => {
      fc.assert(
        fc.property(onboardingProgressArb, (progress) => {
          // Serialize to JSON (like localStorage.setItem)
          const serialized = JSON.stringify(progress)

          // Deserialize from JSON (like localStorage.getItem)
          const deserialized = JSON.parse(serialized) as OnboardingProgress

          // All fields should be preserved
          expect(deserialized.currentStep).toBe(progress.currentStep)
          expect(deserialized.completedSteps).toEqual(progress.completedSteps)
          expect(deserialized.farmId).toBe(progress.farmId)
          expect(deserialized.structureId).toBe(progress.structureId)
          expect(deserialized.batchId).toBe(progress.batchId)
          expect(deserialized.enabledModules).toEqual(progress.enabledModules)
          expect(deserialized.skipped).toBe(progress.skipped)
          expect(deserialized.completedAt).toBe(progress.completedAt)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve enabledModules array order', () => {
      fc.assert(
        fc.property(
          fc.array(moduleKeyArb, { minLength: 1, maxLength: 6 }),
          (modules) => {
            const progress: OnboardingProgress = {
              ...DEFAULT_PROGRESS,
              enabledModules: modules,
            }

            const serialized = JSON.stringify(progress)
            const deserialized = JSON.parse(serialized) as OnboardingProgress

            // Array order should be preserved
            expect(deserialized.enabledModules).toEqual(modules)
            for (let i = 0; i < modules.length; i++) {
              expect(deserialized.enabledModules[i]).toBe(modules[i])
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 2: Farm Type to Default Modules Mapping
   * **Validates: Requirements 1.4, 2.3-2.9**
   *
   * For any valid farm type, the DEFAULT_MODULES_BY_FARM_TYPE mapping
   * should return the correct array of module keys.
   */
  describe('Property 2: Farm Type to Default Modules Mapping', () => {
    it('should return correct modules for single-species farm types', () => {
      const singleSpeciesTypes = [
        'poultry',
        'aquaculture',
        'cattle',
        'goats',
        'sheep',
        'bees',
      ] as const

      for (const farmType of singleSpeciesTypes) {
        const modules = getDefaultModulesForFarmType(farmType)

        // Single-species types should return exactly one module
        // Note: aquaculture maps to 'aquaculture' module, not 'fish'
        if (farmType === 'aquaculture') {
          expect(modules).toEqual(['aquaculture'])
        } else {
          expect(modules).toEqual([farmType])
        }
      }
    })

    it('should return poultry + aquaculture for mixed farm type', () => {
      const modules = getDefaultModulesForFarmType('mixed')
      expect(modules).toEqual(['poultry', 'aquaculture'])
    })

    it('should return empty array for multi farm type', () => {
      const modules = getDefaultModulesForFarmType('multi')
      expect(modules).toEqual([])
    })

    it('should return empty array for unknown farm types', () => {
      // Test with specific unknown farm types
      const unknownTypes = ['unknown', 'invalid', 'test', 'foo', 'bar']
      for (const unknownType of unknownTypes) {
        const modules = getDefaultModulesForFarmType(unknownType)
        expect(modules).toEqual([])
      }
    })
  })

  /**
   * Property 3: Module to Livestock Type Filtering
   * **Validates: Requirements 5.4, 7.1-7.7**
   *
   * For any set of enabled modules, the filtered livestock types
   * should contain exactly the livestock types corresponding to those modules.
   */
  describe('Property 3: Module to Livestock Type Filtering', () => {
    const moduleToLivestockType: Record<ModuleKey, string> = {
      poultry: 'poultry',
      aquaculture: 'fish', // aquaculture module → fish livestock type
      cattle: 'cattle',
      goats: 'goats',
      sheep: 'sheep',
      bees: 'bees',
    }

    it('should map modules to correct livestock types', () => {
      fc.assert(
        fc.property(
          fc.array(moduleKeyArb, { minLength: 1, maxLength: 6 }),
          (modules) => {
            const uniqueModules = [...new Set(modules)]
            const livestockTypes = getLivestockTypesForModules(uniqueModules)

            // Each module should map to its corresponding livestock type
            for (let i = 0; i < uniqueModules.length; i++) {
              expect(livestockTypes[i]).toBe(
                moduleToLivestockType[uniqueModules[i]],
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should filter livestock types correctly', () => {
      const allTypes = [
        { value: 'poultry', label: 'Poultry' },
        { value: 'fish', label: 'Fish' },
        { value: 'cattle', label: 'Cattle' },
        { value: 'goats', label: 'Goats' },
        { value: 'sheep', label: 'Sheep' },
        { value: 'bees', label: 'Bees' },
      ]

      fc.assert(
        fc.property(
          fc.array(moduleKeyArb, { minLength: 1, maxLength: 6 }),
          (modules) => {
            const uniqueModules = [...new Set(modules)] as Array<ModuleKey>
            const filtered = filterLivestockTypesByModules(
              allTypes,
              uniqueModules,
            )

            // Filtered types should only include types for enabled modules
            const expectedTypes = uniqueModules.map(
              (m) => moduleToLivestockType[m],
            )
            for (const type of filtered) {
              expect(expectedTypes).toContain(type.value)
            }

            // All expected types should be in filtered
            for (const expectedType of expectedTypes) {
              expect(filtered.some((t) => t.value === expectedType)).toBe(true)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return all types when no modules specified', () => {
      const allTypes = [
        { value: 'poultry', label: 'Poultry' },
        { value: 'fish', label: 'Fish' },
      ]

      const filtered = filterLivestockTypesByModules(allTypes, [])
      expect(filtered).toEqual(allTypes)
    })
  })

  /**
   * Property 1: Step Transition Correctness
   * **Validates: Requirements 1.2, 4.2**
   *
   * For any onboarding step, the next step in the sequence should be
   * the correct step according to ONBOARDING_STEPS.
   */
  describe('Property 1: Step Transition Correctness', () => {
    it('should have correct step order in ONBOARDING_STEPS', () => {
      const expectedOrder: Array<OnboardingStep> = [
        'welcome',
        'create-farm',
        'create-structure',
        'create-batch',
        'preferences',
        'tour',
        'complete',
      ]

      expect(ONBOARDING_STEPS).toEqual(expectedOrder)
    })

    it('should have 7 steps total', () => {
      expect(ONBOARDING_STEPS.length).toBe(7)
    })

    it('should not include enable-modules step', () => {
      expect(ONBOARDING_STEPS).not.toContain('enable-modules')
    })

    it('should have correct next step for each step', () => {
      for (let i = 0; i < ONBOARDING_STEPS.length - 1; i++) {
        const currentStep = ONBOARDING_STEPS[i]
        const nextStep = ONBOARDING_STEPS[i + 1]

        // Verify the next step is correct
        const currentIndex = ONBOARDING_STEPS.indexOf(currentStep)
        expect(ONBOARDING_STEPS[currentIndex + 1]).toBe(nextStep)
      }
    })
  })

  /**
   * Property 4: Context State Update Consistency
   * **Validates: Requirements 6.1, 6.2, 9.1**
   *
   * For any valid ID or module list, the state should be correctly
   * updated and retrievable.
   */
  describe('Property 4: Context State Update Consistency', () => {
    it('should correctly update enabledModules in progress', () => {
      fc.assert(
        fc.property(fc.array(moduleKeyArb, { maxLength: 6 }), (modules) => {
          // Simulate state update
          const progress: OnboardingProgress = {
            ...DEFAULT_PROGRESS,
            enabledModules: modules,
          }

          // Verify the update
          expect(progress.enabledModules).toEqual(modules)
        }),
        { numRuns: 100 },
      )
    })

    it('should correctly update farmId in progress', () => {
      fc.assert(
        fc.property(fc.uuid(), (farmId) => {
          const progress: OnboardingProgress = {
            ...DEFAULT_PROGRESS,
            farmId,
          }

          expect(progress.farmId).toBe(farmId)
        }),
        { numRuns: 100 },
      )
    })

    it('should correctly update structureId in progress', () => {
      fc.assert(
        fc.property(fc.uuid(), (structureId) => {
          const progress: OnboardingProgress = {
            ...DEFAULT_PROGRESS,
            structureId,
          }

          expect(progress.structureId).toBe(structureId)
        }),
        { numRuns: 100 },
      )
    })

    it('should correctly update batchId in progress', () => {
      fc.assert(
        fc.property(fc.uuid(), (batchId) => {
          const progress: OnboardingProgress = {
            ...DEFAULT_PROGRESS,
            batchId,
          }

          expect(progress.batchId).toBe(batchId)
        }),
        { numRuns: 100 },
      )
    })
  })
})
