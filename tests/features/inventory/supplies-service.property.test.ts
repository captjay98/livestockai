import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type {
  CreateSupplyInput,
  UpdateSupplyInput,
} from '~/features/inventory/supplies-service'
import {
  SUPPLY_CATEGORIES,
  SUPPLY_UNITS,
  calculateDaysUntilExpiry,
  calculateTotalValue,
  isExpired,
  isExpiringSoon,
  isLowStock,
  validateSupplyData,
  validateSupplyUpdateData,
} from '~/features/inventory/supplies-service'

describe('Supplies Service - Property-Based Tests', () => {
  describe('Property 2: Input Validation Rejects Invalid Data', () => {
    it('should reject empty item names', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SUPPLY_CATEGORIES),
          fc.constantFrom(...SUPPLY_UNITS),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (category, unit, quantity, threshold) => {
            const input: CreateSupplyInput = {
              farmId: 'farm-123',
              itemName: '', // Empty name
              category,
              quantityKg: quantity,
              unit,
              minThresholdKg: threshold,
            }
            const error = validateSupplyData(input)
            expect(error).not.toBeNull()
            expect(error?.toLowerCase()).toContain('name')
          },
        ),
      )
    })

    it('should reject whitespace-only item names', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SUPPLY_CATEGORIES),
          fc.constantFrom(...SUPPLY_UNITS),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (category, unit, quantity, threshold) => {
            const input: CreateSupplyInput = {
              farmId: 'farm-123',
              itemName: '   ', // Whitespace only
              category,
              quantityKg: quantity,
              unit,
              minThresholdKg: threshold,
            }
            const error = validateSupplyData(input)
            expect(error).not.toBeNull()
          },
        ),
      )
    })

    it('should reject negative quantities', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.constantFrom(...SUPPLY_CATEGORIES),
          fc.constantFrom(...SUPPLY_UNITS),
          fc.double({ min: -1000, max: -0.01, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (name, category, unit, quantity, threshold) => {
            const input: CreateSupplyInput = {
              farmId: 'farm-123',
              itemName: name,
              category,
              quantityKg: quantity,
              unit,
              minThresholdKg: threshold,
            }
            const error = validateSupplyData(input)
            expect(error).not.toBeNull()
            expect(error?.toLowerCase()).toContain('quantity')
          },
        ),
      )
    })

    it('should reject negative thresholds', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.constantFrom(...SUPPLY_CATEGORIES),
          fc.constantFrom(...SUPPLY_UNITS),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: -1000, max: -0.01, noNaN: true }),
          (name, category, unit, quantity, threshold) => {
            const input: CreateSupplyInput = {
              farmId: 'farm-123',
              itemName: name,
              category,
              quantityKg: quantity,
              unit,
              minThresholdKg: threshold,
            }
            const error = validateSupplyData(input)
            expect(error).not.toBeNull()
            expect(error).toContain('threshold')
          },
        ),
      )
    })

    it('should reject negative costs', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.constantFrom(...SUPPLY_CATEGORIES),
          fc.constantFrom(...SUPPLY_UNITS),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: -1000, max: -0.01, noNaN: true }),
          (name, category, unit, quantity, threshold, cost) => {
            const input: CreateSupplyInput = {
              farmId: 'farm-123',
              itemName: name,
              category,
              quantityKg: quantity,
              unit,
              minThresholdKg: threshold,
              costPerUnit: cost,
            }
            const error = validateSupplyData(input)
            expect(error).not.toBeNull()
            expect(error?.toLowerCase()).toContain('cost')
          },
        ),
      )
    })

    it('should reject past expiry dates', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.constantFrom(...SUPPLY_CATEGORIES),
          fc.constantFrom(...SUPPLY_UNITS),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.integer({ min: 1, max: 365 }),
          (name, category, unit, quantity, threshold, daysAgo) => {
            const pastDate = new Date()
            pastDate.setDate(pastDate.getDate() - daysAgo)

            const input: CreateSupplyInput = {
              farmId: 'farm-123',
              itemName: name,
              category,
              quantityKg: quantity,
              unit,
              minThresholdKg: threshold,
              expiryDate: pastDate,
            }
            const error = validateSupplyData(input)
            expect(error).not.toBeNull()
            expect(error?.toLowerCase()).toContain('expiry')
          },
        ),
      )
    })

    it('should accept valid supply data', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.constantFrom(...SUPPLY_CATEGORIES),
          fc.constantFrom(...SUPPLY_UNITS),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (name, category, unit, quantity, threshold, cost) => {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 30)

            const input: CreateSupplyInput = {
              farmId: 'farm-123',
              itemName: name,
              category,
              quantityKg: quantity,
              unit,
              minThresholdKg: threshold,
              costPerUnit: cost,
              expiryDate: futureDate,
            }
            const error = validateSupplyData(input)
            expect(error).toBeNull()
          },
        ),
      )
    })

    it('should validate update data correctly', () => {
      fc.assert(
        fc.property(
          fc.option(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            {
              nil: undefined,
            },
          ),
          fc.option(fc.double({ min: 0, max: 1000, noNaN: true }), {
            nil: undefined,
          }),
          fc.option(fc.double({ min: 0, max: 1000, noNaN: true }), {
            nil: undefined,
          }),
          (name, quantity, threshold) => {
            const input: UpdateSupplyInput = {
              itemName: name,
              quantityKg: quantity,
              minThresholdKg: threshold,
            }
            const error = validateSupplyUpdateData(input)
            expect(error).toBeNull()
          },
        ),
      )
    })
  })

  describe('Property 5: Low Stock Detection', () => {
    it('should return true when quantity equals threshold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (threshold) => {
            expect(isLowStock(threshold, threshold)).toBe(true)
          },
        ),
      )
    })

    it('should return true when quantity is less than threshold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0.01, max: 100, noNaN: true }),
          (quantity, delta) => {
            const threshold = quantity + delta
            expect(isLowStock(quantity, threshold)).toBe(true)
          },
        ),
      )
    })

    it('should return false when quantity is greater than threshold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0.01, max: 100, noNaN: true }),
          (threshold, delta) => {
            const quantity = threshold + delta
            expect(isLowStock(quantity, threshold)).toBe(false)
          },
        ),
      )
    })

    it('should satisfy: isLowStock(q, t) ⟺ q ≤ t', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (quantity, threshold) => {
            const result = isLowStock(quantity, threshold)
            const expected = quantity <= threshold
            expect(result).toBe(expected)
          },
        ),
      )
    })
  })

  describe('Property 6: Expiry Date Calculations', () => {
    it('should return false for null expiry dates', () => {
      expect(isExpired(null)).toBe(false)
      expect(isExpiringSoon(null)).toBe(false)
      expect(calculateDaysUntilExpiry(null)).toBeNull()
    })

    it('should correctly identify expired items', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (daysAgo) => {
          const pastDate = new Date()
          pastDate.setDate(pastDate.getDate() - daysAgo)
          expect(isExpired(pastDate)).toBe(true)
        }),
      )
    })

    it('should correctly identify non-expired items', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (daysAhead) => {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + daysAhead)
          expect(isExpired(futureDate)).toBe(false)
        }),
      )
    })

    it('should correctly identify expiring soon items (within 30 days)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 30 }), (daysAhead) => {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + daysAhead)
          expect(isExpiringSoon(futureDate, 30)).toBe(true)
        }),
      )
    })

    it('should correctly identify not expiring soon items (beyond 30 days)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 31, max: 365 }), (daysAhead) => {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + daysAhead)
          expect(isExpiringSoon(futureDate, 30)).toBe(false)
        }),
      )
    })

    it('should not mark expired items as expiring soon', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (daysAgo) => {
          const pastDate = new Date()
          pastDate.setDate(pastDate.getDate() - daysAgo)
          expect(isExpiringSoon(pastDate, 30)).toBe(false)
        }),
      )
    })

    it('should calculate days until expiry correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (daysAhead) => {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + daysAhead)
          const calculated = calculateDaysUntilExpiry(futureDate)
          expect(calculated).not.toBeNull()
          // Allow for small rounding differences
          expect(Math.abs(calculated! - daysAhead)).toBeLessThanOrEqual(1)
        }),
      )
    })

    it('should return negative days for expired items', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (daysAgo) => {
          const pastDate = new Date()
          pastDate.setDate(pastDate.getDate() - daysAgo)
          const calculated = calculateDaysUntilExpiry(pastDate)
          expect(calculated).not.toBeNull()
          expect(calculated!).toBeLessThan(0)
        }),
      )
    })

    it('should satisfy: isExpiringSoon(d, n) ⟺ 0 < daysUntil ≤ n', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -365, max: 365 }),
          fc.integer({ min: 1, max: 90 }),
          (daysOffset, threshold) => {
            const date = new Date()
            date.setDate(date.getDate() + daysOffset)
            const result = isExpiringSoon(date, threshold)
            const daysUntil = calculateDaysUntilExpiry(date)
            const expected =
              daysUntil !== null && daysUntil > 0 && daysUntil <= threshold
            expect(result).toBe(expected)
          },
        ),
      )
    })
  })

  describe('Property 7: Total Value Calculation', () => {
    it('should return null when cost is null', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (quantity) => {
            expect(calculateTotalValue(quantity, null)).toBeNull()
          },
        ),
      )
    })

    it('should calculate total value as quantity × cost', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (quantity, cost) => {
            const result = calculateTotalValue(quantity, cost)
            const expected = quantity * cost
            expect(result).not.toBeNull()
            expect(result).toBeCloseTo(expected, 10)
          },
        ),
      )
    })

    it('should return 0 when quantity is 0', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (cost) => {
          expect(calculateTotalValue(0, cost)).toBe(0)
        }),
      )
    })

    it('should return 0 when cost is 0', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (quantity) => {
            expect(calculateTotalValue(quantity, 0)).toBe(0)
          },
        ),
      )
    })

    it('should satisfy: calculateTotalValue(q, c) = q × c', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (quantity, cost) => {
            const result = calculateTotalValue(quantity, cost)
            expect(result).toBeCloseTo(quantity * cost, 10)
          },
        ),
      )
    })
  })
})
