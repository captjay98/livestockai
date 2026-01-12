import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { filterNavigationByModules } from './useModuleNavigation'
import type { ModuleKey } from '~/lib/modules/types'
import { CORE_NAVIGATION, MODULE_NAVIGATION } from '~/lib/modules/constants'

describe('useModuleNavigation - Property Tests', () => {
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
    minLength: 0,
    maxLength: 6,
  })

  /**
   * Property 1: Core Navigation Always Visible
   * For any set of enabled modules (including empty set), core navigation items
   * should always be present in the filtered navigation.
   */
  it('Property 1: Core navigation items are always visible regardless of enabled modules', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        // Build navigation with core and module items
        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const moduleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        const testNav = [...coreItems, ...moduleItems]
        const filtered = filterNavigationByModules(testNav, enabledModules)

        // All core navigation items should be present
        CORE_NAVIGATION.forEach((coreName) => {
          const found = filtered.some((item) => item.name === coreName)
          expect(found).toBe(true)
        })
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 2: Module-Specific Items Filtered
   * For any set of enabled modules, only navigation items associated with those
   * modules (or core items) should be visible.
   */
  it('Property 2: Only enabled module navigation items are visible', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        // Build navigation with module-specific items
        const allModuleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const testNav = [...coreItems, ...allModuleItems]
        const filtered = filterNavigationByModules(testNav, enabledModules)

        // Get expected module items
        const expectedModuleItems = enabledModules.flatMap(
          (moduleKey) => MODULE_NAVIGATION[moduleKey],
        )

        // Check each filtered item
        filtered.forEach((item) => {
          const isCore = CORE_NAVIGATION.includes(item.name)
          const isExpectedModule = expectedModuleItems.includes(item.name)
          expect(isCore || isExpectedModule).toBe(true)
        })

        // Verify we have at least core items
        expect(filtered.length).toBeGreaterThanOrEqual(CORE_NAVIGATION.length)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 3: Empty Modules Shows Only Core
   * When no modules are enabled, only core navigation items should be visible.
   */
  it('Property 3: Empty module set shows only core navigation', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const moduleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        const testNav = [...coreItems, ...moduleItems]
        const filtered = filterNavigationByModules(testNav, [])

        // Should only have core items
        expect(filtered.length).toBe(CORE_NAVIGATION.length)

        filtered.forEach((item) => {
          expect(CORE_NAVIGATION.includes(item.name)).toBe(true)
        })
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 4: All Modules Enabled Shows All Items
   * When all modules are enabled, all navigation items should be visible.
   */
  it('Property 4: All modules enabled shows all navigation items', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const moduleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        const testNav = [...coreItems, ...moduleItems]
        const filtered = filterNavigationByModules(testNav, allModuleKeys)

        // All core and module items should be present
        const allExpectedItems = [
          ...CORE_NAVIGATION,
          ...allModuleKeys.flatMap((moduleKey) => MODULE_NAVIGATION[moduleKey]),
        ]

        // Remove duplicates from expected items
        const uniqueExpectedItems = [...new Set(allExpectedItems)]

        uniqueExpectedItems.forEach((expectedName) => {
          const found = filtered.some((item) => item.name === expectedName)
          expect(found).toBe(true)
        })
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 5: Filtering is Idempotent
   * Filtering the same navigation with the same modules multiple times
   * should produce the same result.
   */
  it('Property 5: Filtering is idempotent', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const moduleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        const testNav = [...coreItems, ...moduleItems]

        const filtered1 = filterNavigationByModules(testNav, enabledModules)
        const filtered2 = filterNavigationByModules(testNav, enabledModules)

        expect(filtered1).toEqual(filtered2)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 6: Subset Modules Show Subset Items
   * If moduleSet1 is a subset of moduleSet2, then the navigation items for
   * moduleSet1 should be a subset of the navigation items for moduleSet2.
   */
  it('Property 6: Subset of modules shows subset of navigation items', () => {
    fc.assert(
      fc.property(moduleSetArb, moduleSetArb, (modules1, modules2) => {
        const allModules = [...new Set([...modules1, ...modules2])]
        const subset = modules1.filter((m) => modules2.includes(m))

        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const moduleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        const testNav = [...coreItems, ...moduleItems]

        const filteredSubset = filterNavigationByModules(testNav, subset)
        const filteredAll = filterNavigationByModules(testNav, allModules)

        // Every item in filteredSubset should be in filteredAll
        filteredSubset.forEach((item) => {
          const found = filteredAll.some((i) => i.name === item.name)
          expect(found).toBe(true)
        })

        // Subset should have <= items than the superset
        expect(filteredSubset.length).toBeLessThanOrEqual(filteredAll.length)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 7: Order Preservation
   * The relative order of navigation items should be preserved after filtering.
   */
  it('Property 7: Filtering preserves relative order of items', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const moduleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        // Remove duplicates from testNav while preserving order
        const seen = new Set<string>()
        const testNav = [...coreItems, ...moduleItems].filter((item) => {
          if (seen.has(item.name)) return false
          seen.add(item.name)
          return true
        })

        const filtered = filterNavigationByModules(testNav, enabledModules)

        // Check that the order is preserved (only if we have items)
        if (filtered.length > 1) {
          const originalIndices = filtered.map((item) =>
            testNav.findIndex((nav) => nav.name === item.name),
          )

          // Indices should be in ascending order
          for (let i = 1; i < originalIndices.length; i++) {
            expect(originalIndices[i]).toBeGreaterThan(originalIndices[i - 1])
          }
        }
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 8: No Duplicates
   * Filtered navigation should not contain duplicate items.
   */
  it('Property 8: Filtered navigation contains no duplicates', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const coreItems = CORE_NAVIGATION.map((name) => ({
          name,
          href: `/${name.toLowerCase()}`,
          icon: () => null,
        }))

        const moduleItems = allModuleKeys.flatMap((moduleKey) =>
          MODULE_NAVIGATION[moduleKey].map((name) => ({
            name,
            href: `/${name.toLowerCase()}`,
            icon: () => null,
          })),
        )

        // testNav may have duplicates (e.g., "Batches" appears in multiple modules)
        const testNav = [...coreItems, ...moduleItems]
        const filtered = filterNavigationByModules(testNav, enabledModules)

        const names = filtered.map((item) => item.name)
        const uniqueNames = [...new Set(names)]

        // Filtered result should have no duplicates
        expect(names.length).toBe(uniqueNames.length)
      }),
      { numRuns: 100 },
    )
  })
})
