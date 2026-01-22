import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

describe('suppliers/server logic', () => {
  const SUPPLIER_TYPES = [
    'hatchery',
    'feed_mill',
    'pharmacy',
    'equipment',
    'fingerlings',
    'other',
  ]

  describe('supplier types', () => {
    it('should have all expected supplier types', () => {
      expect(SUPPLIER_TYPES.length).toBe(6)
      expect(SUPPLIER_TYPES).toContain('hatchery')
      expect(SUPPLIER_TYPES).toContain('feed_mill')
      expect(SUPPLIER_TYPES).toContain('pharmacy')
      expect(SUPPLIER_TYPES).toContain('equipment')
      expect(SUPPLIER_TYPES).toContain('fingerlings')
      expect(SUPPLIER_TYPES).toContain('other')
    })
  })

  describe('total spent calculation', () => {
    function calculateTotalSpent(expenses: Array<{ amount: string }>): number {
      return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
    }

    it('should sum all expense amounts correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .float({ min: 0, max: 1000000, noNaN: true })
              .map((v) => ({ amount: v.toFixed(2) })),
            { minLength: 0, maxLength: 50 },
          ),
          (expenses) => {
            const total = calculateTotalSpent(expenses)
            const expected = expenses.reduce(
              (sum, e) => sum + parseFloat(e.amount),
              0,
            )
            expect(total).toBeCloseTo(expected, 2)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return 0 for empty expenses', () => {
      expect(calculateTotalSpent([])).toBe(0)
    })

    it('should handle large numbers correctly', () => {
      const expenses = [{ amount: '1000000.50' }, { amount: '2000000.75' }]
      expect(calculateTotalSpent(expenses)).toBe(3000001.25)
    })
  })
})
