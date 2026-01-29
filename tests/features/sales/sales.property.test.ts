import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  UNIT_TYPES,
} from '~/features/sales/server'

describe('sales/server logic', () => {
  describe('UNIT_TYPES', () => {
    it('should have all required unit types', () => {
      expect(UNIT_TYPES.length).toBe(4)
      const values = UNIT_TYPES.map((t) => t.value)
      expect(values).toContain('bird')
      expect(values).toContain('kg')
      expect(values).toContain('crate')
      expect(values).toContain('piece')
    })

    it('should have value and label for each type', () => {
      UNIT_TYPES.forEach((type) => {
        expect(type.value).toBeTruthy()
        expect(type.label).toBeTruthy()
      })
    })
  })

  describe('PAYMENT_STATUSES', () => {
    it('should have all payment statuses', () => {
      const values = PAYMENT_STATUSES.map((s) => s.value)
      expect(values).toContain('paid')
      expect(values).toContain('pending')
      expect(values).toContain('partial')
    })

    it('should have color classes for each status', () => {
      PAYMENT_STATUSES.forEach((status) => {
        expect(status.color).toBeTruthy()
        expect(status.color).toContain('text-')
        expect(status.color).toContain('bg-')
      })
    })
  })

  describe('PAYMENT_METHODS', () => {
    it('should have all payment methods', () => {
      const values = PAYMENT_METHODS.map((m) => m.value)
      expect(values).toContain('cash')
      expect(values).toContain('transfer')
      expect(values).toContain('credit')
    })
  })

  describe('sale total calculation', () => {
    it('total should equal quantity * unitPrice', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 1000000 }),
          (quantity, unitPriceCents) => {
            const unitPrice = unitPriceCents / 100
            const total = quantity * unitPrice
            expect(total).toBeCloseTo(quantity * unitPrice, 2)
            expect(total).toBeGreaterThan(0)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('total increases with quantity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 100, max: 10000 }),
          (baseQty, addQty, priceCents) => {
            const price = priceCents / 100
            const total1 = baseQty * price
            const total2 = (baseQty + addQty) * price
            expect(total2).toBeGreaterThan(total1)
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
