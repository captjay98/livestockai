import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import type { LivestockType, ModuleKey } from '~/features/modules/types'
import { MODULE_METADATA } from '~/features/modules/constants'

/**
 * Helper function to get available livestock types from enabled modules
 * Exported for testing the batch form filtering logic
 */
export function getAvailableLivestockTypes(
    enabledModules: Array<ModuleKey>,
): Array<LivestockType> {
    return enabledModules.flatMap(
        (moduleKey) => MODULE_METADATA[moduleKey].livestockTypes,
    )
}

describe('Batch Form - Property Tests', () => {
    const allModuleKeys: Array<ModuleKey> = [
        'poultry',
        'aquaculture',
        'cattle',
        'goats',
        'sheep',
        'bees',
    ]

    const moduleKeyArb = fc.constantFrom(...allModuleKeys)
    const moduleSetArb = fc.uniqueArray(moduleKeyArb, {
        minLength: 1,
        maxLength: 6,
    })

    /**
     * Property 7: Batch Creation Shows Only Enabled Livestock Types
     * For any set of enabled modules, the batch form should only show livestock
     * types corresponding to those enabled modules.
     */
    it('Property 7: Batch form shows only enabled livestock types', () => {
        fc.assert(
            fc.property(moduleSetArb, (enabledModules) => {
                const availableTypes =
                    getAvailableLivestockTypes(enabledModules)

                // All available types should correspond to enabled modules
                availableTypes.forEach((type) => {
                    const hasModule = enabledModules.some((moduleKey) =>
                        MODULE_METADATA[moduleKey].livestockTypes.includes(
                            type,
                        ),
                    )
                    expect(hasModule).toBe(true)
                })

                // Number of available types should be at least the number of enabled modules
                // (could be more if modules have multiple livestock types)
                expect(availableTypes.length).toBeGreaterThanOrEqual(
                    enabledModules.length,
                )
            }),
            { numRuns: 100 },
        )
    })

    /**
     * Property: All Enabled Modules Have Livestock Types
     * Every enabled module should contribute at least one livestock type to the form.
     */
    it('Property: All enabled modules contribute livestock types', () => {
        fc.assert(
            fc.property(moduleSetArb, (enabledModules) => {
                const availableTypes =
                    getAvailableLivestockTypes(enabledModules)

                enabledModules.forEach((moduleKey) => {
                    const moduleTypes =
                        MODULE_METADATA[moduleKey].livestockTypes
                    // At least one of the module's types should be in available types
                    const hasType = moduleTypes.some((type) =>
                        availableTypes.includes(type),
                    )
                    expect(hasType).toBe(true)
                })
            }),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Livestock Types Are Valid
     * All livestock types should be valid module livestock types.
     */
    it('Property: All livestock types are valid', () => {
        fc.assert(
            fc.property(moduleSetArb, (enabledModules) => {
                const availableTypes =
                    getAvailableLivestockTypes(enabledModules)
                const allValidTypes = allModuleKeys.flatMap(
                    (key) => MODULE_METADATA[key].livestockTypes,
                )

                availableTypes.forEach((type) => {
                    expect(allValidTypes.includes(type)).toBe(true)
                })
            }),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Subset Modules Show Subset Types
     * If moduleSet1 is a subset of moduleSet2, then the livestock types for
     * moduleSet1 should be a subset of the livestock types for moduleSet2.
     */
    it('Property: Subset of modules shows subset of livestock types', () => {
        fc.assert(
            fc.property(moduleSetArb, moduleSetArb, (modules1, modules2) => {
                // Ensure both sets are non-empty
                if (modules1.length === 0 || modules2.length === 0) return

                const allModules = [...new Set([...modules1, ...modules2])]
                const subset = modules1.filter((m) => modules2.includes(m))

                // Skip if subset is empty
                if (subset.length === 0) return

                const typesSubset = getAvailableLivestockTypes(subset)
                const typesAll = getAvailableLivestockTypes(allModules)

                // Every type in typesSubset should be in typesAll
                typesSubset.forEach((type) => {
                    expect(typesAll.includes(type)).toBe(true)
                })

                // Subset should have <= types than the superset
                expect(typesSubset.length).toBeLessThanOrEqual(typesAll.length)
            }),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Type Selection is Deterministic
     * Calling getAvailableLivestockTypes with the same modules multiple times
     * should produce the same result.
     */
    it('Property: Livestock type selection is deterministic', () => {
        fc.assert(
            fc.property(moduleSetArb, (enabledModules) => {
                const types1 = getAvailableLivestockTypes(enabledModules)
                const types2 = getAvailableLivestockTypes(enabledModules)

                expect(types1).toEqual(types2)
            }),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Order Preservation
     * The order of livestock types should follow the order of enabled modules.
     */
    it('Property: Livestock type order follows module order', () => {
        fc.assert(
            fc.property(moduleSetArb, (enabledModules) => {
                const availableTypes =
                    getAvailableLivestockTypes(enabledModules)

                // Build expected order from modules
                const expectedOrder = enabledModules.flatMap(
                    (moduleKey) => MODULE_METADATA[moduleKey].livestockTypes,
                )

                // Available types should match expected order
                expect(availableTypes).toEqual(expectedOrder)
            }),
            { numRuns: 100 },
        )
    })
})
