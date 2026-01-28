/**
 * Property tests for feed formulation optimization logic
 * Tests mathematical invariants and business rules
 */

import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type { IngredientWithPrice } from '~/features/feed-formulation/repository'
import { buildOptimizationIngredients } from '~/features/feed-formulation/service'

describe('Feed Formulation - Property Tests', () => {
  // Helper to create valid ingredient
  const ingredientArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    category: fc.constantFrom(
      'cereal',
      'protein',
      'fat',
      'mineral',
      'vitamin',
      'additive',
    ),
    proteinPercent: fc.double({ min: 0, max: 100 }).map((n) => n.toFixed(2)),
    energyKcalKg: fc.integer({ min: 0, max: 5000 }),
    fatPercent: fc.double({ min: 0, max: 100 }).map((n) => n.toFixed(2)),
    fiberPercent: fc.double({ min: 0, max: 100 }).map((n) => n.toFixed(2)),
    calciumPercent: fc.double({ min: 0, max: 10 }).map((n) => n.toFixed(2)),
    phosphorusPercent: fc.double({ min: 0, max: 10 }).map((n) => n.toFixed(2)),
    lysinePercent: fc.double({ min: 0, max: 5 }).map((n) => n.toFixed(2)),
    methioninePercent: fc.double({ min: 0, max: 5 }).map((n) => n.toFixed(2)),
    maxInclusionPercent: fc
      .double({ min: 0, max: 100 })
      .map((n) => n.toFixed(2)),
  })

  it('should filter out unavailable ingredients', () => {
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        fc.array(
          fc.record({
            ingredientId: fc.uuid(),
            pricePerKg: fc
              .double({ min: 0, max: 100 })
              .map((n) => n.toFixed(2)),
            isAvailable: fc.boolean(),
          }),
        ),
        (ingredients, prices) => {
          const result = buildOptimizationIngredients(
            ingredients as Array<IngredientWithPrice>,
            prices,
          )

          // All unavailable ingredients should be filtered out
          const unavailableIds = prices
            .filter((p) => !p.isAvailable)
            .map((p) => p.ingredientId)

          const resultIds = result.map((r) => r.id)
          const hasUnavailable = unavailableIds.some((id) =>
            resultIds.includes(id),
          )

          expect(hasUnavailable).toBe(false)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('should convert all string percentages to numbers', () => {
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        (ingredients) => {
          const prices = ingredients.map((ing) => ({
            ingredientId: ing.id,
            pricePerKg: '10.00',
            isAvailable: true,
          }))

          const result = buildOptimizationIngredients(
            ingredients as Array<IngredientWithPrice>,
            prices,
          )

          // All numeric fields should be numbers, not strings
          result.forEach((ing) => {
            expect(typeof ing.proteinPercent).toBe('number')
            expect(typeof ing.fatPercent).toBe('number')
            expect(typeof ing.fiberPercent).toBe('number')
            expect(typeof ing.calciumPercent).toBe('number')
            expect(typeof ing.phosphorusPercent).toBe('number')
            expect(typeof ing.lysinePercent).toBe('number')
            expect(typeof ing.methioninePercent).toBe('number')
            expect(typeof ing.maxInclusionPercent).toBe('number')
            expect(typeof ing.pricePerKg).toBe('number')
          })
        },
      ),
      { numRuns: 50 },
    )
  })

  it('should use user prices when available, otherwise 0', () => {
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 2, maxLength: 5 }),
        (ingredients) => {
          // Only provide prices for half the ingredients
          const prices = ingredients
            .slice(0, Math.floor(ingredients.length / 2))
            .map((ing) => ({
              ingredientId: ing.id,
              pricePerKg: '15.50',
              isAvailable: true,
            }))

          const result = buildOptimizationIngredients(
            ingredients as Array<IngredientWithPrice>,
            prices,
          )

          result.forEach((ing) => {
            const hasPrice = prices.some((p) => p.ingredientId === ing.id)
            if (hasPrice) {
              expect(ing.pricePerKg).toBe(15.5)
            } else {
              expect(ing.pricePerKg).toBe(0)
            }
          })
        },
      ),
      { numRuns: 50 },
    )
  })

  it('should preserve ingredient IDs and names', () => {
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        (ingredients) => {
          const prices = ingredients.map((ing) => ({
            ingredientId: ing.id,
            pricePerKg: '10.00',
            isAvailable: true,
          }))

          const result = buildOptimizationIngredients(
            ingredients as Array<IngredientWithPrice>,
            prices,
          )

          // All result IDs should exist in input
          result.forEach((resultIng) => {
            const original = ingredients.find((i) => i.id === resultIng.id)
            expect(original).toBeDefined()
            expect(resultIng.name).toBe(original!.name)
          })
        },
      ),
      { numRuns: 50 },
    )
  })

  it('should handle empty ingredient list', () => {
    const result = buildOptimizationIngredients([], [])
    expect(result).toEqual([])
  })

  it('should handle all ingredients unavailable', () => {
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 5 }),
        (ingredients) => {
          const prices = ingredients.map((ing) => ({
            ingredientId: ing.id,
            pricePerKg: '10.00',
            isAvailable: false, // All unavailable
          }))

          const result = buildOptimizationIngredients(
            ingredients as Array<IngredientWithPrice>,
            prices,
          )

          expect(result).toEqual([])
        },
      ),
      { numRuns: 20 },
    )
  })
})
