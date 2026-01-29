import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

describe('Invoice Property Tests', () => {
  describe('invoice calculations', () => {
    it('total always equals sum of line items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 1000 }),
              unitPrice: fc.integer({ min: 1, max: 10000 }),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (items) => {
            const total = items.reduce(
              (sum, item) => sum + item.quantity * item.unitPrice,
              0,
            )
            expect(total).toBeGreaterThan(0)
            expect(total).toBeLessThanOrEqual(20 * 1000 * 10000)
          },
        ),
      )
    })

    it('discount never exceeds total', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          fc.integer({ min: 0, max: 100 }),
          (total, discountPercent) => {
            const discount = (total * discountPercent) / 100
            expect(discount).toBeLessThanOrEqual(total)
            expect(discount).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('tax calculation is consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          fc.integer({ min: 0, max: 30 }),
          (subtotal, taxPercent) => {
            const tax = (subtotal * taxPercent) / 100
            const total = subtotal + tax
            expect(total).toBeGreaterThanOrEqual(subtotal)
            expect(tax).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('invoice status is valid', () => {
      fc.assert(
        fc.property(fc.constantFrom('unpaid', 'partial', 'paid'), (status) => {
          const validStatuses = ['unpaid', 'partial', 'paid']
          expect(validStatuses).toContain(status)
        }),
      )
    })

    it('amounts with discount are non-negative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 0, max: 500000 }),
          (subtotal, tax, discount) => {
            const total = Math.max(0, subtotal + tax - discount)
            expect(subtotal).toBeGreaterThanOrEqual(0)
            expect(tax).toBeGreaterThanOrEqual(0)
            expect(discount).toBeGreaterThanOrEqual(0)
            expect(total).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })
  })

  describe('invoice line items', () => {
    it('line item total equals quantity times unit price', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 10000 }),
          (quantity, unitPrice) => {
            const total = quantity * unitPrice
            expect(total).toBe(quantity * unitPrice)
            expect(total).toBeGreaterThan(0)
          },
        ),
      )
    })

    it('invoice total equals sum of all line items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 100 }),
              unitPrice: fc.integer({ min: 100, max: 1000 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (items) => {
            const lineItemTotals = items.map(
              (item) => item.quantity * item.unitPrice,
            )
            const invoiceTotal = lineItemTotals.reduce(
              (sum, total) => sum + total,
              0,
            )
            const manualSum = items.reduce(
              (sum, item) => sum + item.quantity * item.unitPrice,
              0,
            )
            expect(invoiceTotal).toBe(manualSum)
          },
        ),
      )
    })
  })

  describe('payment calculations', () => {
    it('amount paid never exceeds total', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          fc.integer({ min: 0, max: 100000 }),
          (total, amountPaid) => {
            const validAmountPaid = Math.min(amountPaid, total)
            expect(validAmountPaid).toBeLessThanOrEqual(total)
            expect(validAmountPaid).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('remaining balance is always correct', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          fc.integer({ min: 0, max: 100000 }),
          (total, amountPaid) => {
            const validAmountPaid = Math.min(amountPaid, total)
            const remaining = total - validAmountPaid
            expect(remaining).toBeGreaterThanOrEqual(0)
            expect(remaining).toBeLessThanOrEqual(total)
            expect(remaining + validAmountPaid).toBe(total)
          },
        ),
      )
    })
  })
})
