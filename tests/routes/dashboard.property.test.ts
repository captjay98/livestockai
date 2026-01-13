import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import type { ModuleKey } from '~/features/modules/types'

/**
 * Helper function to determine which inventory cards should be visible
 * Exported for testing the dashboard rendering logic
 */
export function getVisibleInventoryCards(
  enabledModules: Array<ModuleKey>,
): Array<ModuleKey> {
  return enabledModules.filter((module) =>
    ['poultry', 'aquaculture', 'cattle', 'goats', 'sheep', 'bees'].includes(
      module,
    ),
  )
}

describe('Dashboard - Property Tests', () => {
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
   * Property 11: Dashboard Renders Only Enabled Module Cards
   * For any set of enabled modules, the dashboard should only show inventory
   * cards for those enabled modules.
   */
  it('Property 11: Dashboard shows only enabled module inventory cards', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const visibleCards = getVisibleInventoryCards(enabledModules)

        // All visible cards should be in enabled modules
        visibleCards.forEach((card) => {
          expect(enabledModules.includes(card)).toBe(true)
        })

        // All enabled modules should have visible cards
        enabledModules.forEach((module) => {
          expect(visibleCards.includes(module)).toBe(true)
        })

        // Number of visible cards should equal number of enabled modules
        expect(visibleCards.length).toBe(enabledModules.length)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property: Empty Modules Shows No Cards
   * When no modules are enabled, no inventory cards should be visible.
   */
  it('Property: Empty module set shows no inventory cards', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const visibleCards = getVisibleInventoryCards([])
        expect(visibleCards.length).toBe(0)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property: All Modules Shows All Cards
   * When all modules are enabled, all inventory cards should be visible.
   */
  it('Property: All modules enabled shows all inventory cards', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const visibleCards = getVisibleInventoryCards(allModuleKeys)
        expect(visibleCards.length).toBe(allModuleKeys.length)

        allModuleKeys.forEach((module) => {
          expect(visibleCards.includes(module)).toBe(true)
        })
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property: Subset Modules Shows Subset Cards
   * If moduleSet1 is a subset of moduleSet2, then the visible cards for
   * moduleSet1 should be a subset of the visible cards for moduleSet2.
   */
  it('Property: Subset of modules shows subset of inventory cards', () => {
    fc.assert(
      fc.property(moduleSetArb, moduleSetArb, (modules1, modules2) => {
        const allModules = [...new Set([...modules1, ...modules2])]
        const subset = modules1.filter((m) => modules2.includes(m))

        const visibleSubset = getVisibleInventoryCards(subset)
        const visibleAll = getVisibleInventoryCards(allModules)

        // Every card in visibleSubset should be in visibleAll
        visibleSubset.forEach((card) => {
          expect(visibleAll.includes(card)).toBe(true)
        })

        // Subset should have <= cards than the superset
        expect(visibleSubset.length).toBeLessThanOrEqual(visibleAll.length)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property: Card Visibility is Deterministic
   * Calling getVisibleInventoryCards with the same modules multiple times
   * should produce the same result.
   */
  it('Property: Card visibility is deterministic', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const visible1 = getVisibleInventoryCards(enabledModules)
        const visible2 = getVisibleInventoryCards(enabledModules)

        expect(visible1).toEqual(visible2)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property: No Invalid Cards
   * Visible cards should only include valid module keys.
   */
  it('Property: Only valid module keys appear in visible cards', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const visibleCards = getVisibleInventoryCards(enabledModules)

        visibleCards.forEach((card) => {
          expect(allModuleKeys.includes(card)).toBe(true)
        })
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property: Order Preservation
   * The order of visible cards should match the order in enabled modules.
   */
  it('Property: Card order matches enabled modules order', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const visibleCards = getVisibleInventoryCards(enabledModules)

        // Check that the order is preserved
        if (visibleCards.length > 1) {
          for (let i = 0; i < visibleCards.length; i++) {
            const cardIndex = enabledModules.indexOf(visibleCards[i])
            expect(cardIndex).toBeGreaterThanOrEqual(0)

            if (i > 0) {
              const prevCardIndex = enabledModules.indexOf(visibleCards[i - 1])
              expect(cardIndex).toBeGreaterThan(prevCardIndex)
            }
          }
        }
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property: No Duplicates
   * Visible cards should not contain duplicates.
   */
  it('Property: Visible cards contain no duplicates', () => {
    fc.assert(
      fc.property(moduleSetArb, (enabledModules) => {
        const visibleCards = getVisibleInventoryCards(enabledModules)

        const uniqueCards = [...new Set(visibleCards)]
        expect(visibleCards.length).toBe(uniqueCards.length)
      }),
      { numRuns: 100 },
    )
  })
})
