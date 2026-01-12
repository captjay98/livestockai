import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { calculateBatchProfit, calculateROI } from './calculations'

describe('Financial Invariants', () => {
  it('Profit should satisfy P = Revenue - Costs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000000, noNaN: true }), // Revenue
        fc.float({ min: 0, max: 5000000, noNaN: true }), // Initial Cost
        fc.float({ min: 0, max: 5000000, noNaN: true }), // Feed Cost
        fc.float({ min: 0, max: 2000000, noNaN: true }), // Other Expenses
        (revenue, initial, feed, other) => {
          const profit = calculateBatchProfit({
            totalRevenue: revenue,
            initialCost: initial,
            feedCost: feed,
            otherExpenses: other,
          })

          const totalCost = initial + feed + other

          // Floating point precision check (epsilon 0.01)
          expect(Math.abs(profit - (revenue - totalCost))).toBeLessThan(0.01)
        },
      ),
    )
  })

  it('Profit should decrease when expenses increase (Monotonicity)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000, noNaN: true }), // Revenue
        fc.float({ min: 0, max: 100000, noNaN: true }), // Base Cost
        fc.float({ min: 1, max: 10000, noNaN: true }), // Added Cost (min 1 to avoid tiny float issues)
        (revenue, baseCost, addedCost) => {
          const profit1 = calculateBatchProfit({
            totalRevenue: revenue,
            initialCost: baseCost,
            feedCost: 0,
            otherExpenses: 0,
          })

          const profit2 = calculateBatchProfit({
            totalRevenue: revenue,
            initialCost: baseCost + addedCost,
            feedCost: 0,
            otherExpenses: 0,
          })

          expect(profit2).toBeLessThan(profit1)
        },
      ),
    )
  })

  it('ROI should be consistent with Profit logic', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1000, max: 1000000, noNaN: true }), // Investment
        fc.float({ min: -500000, max: 500000, noNaN: true }), // Profit
        (investment, profit) => {
          const roi = calculateROI(profit, investment)
          if (investment === 0) {
            expect(roi).toBe(0)
          } else {
            expect(Math.abs(roi - (profit / investment) * 100)).toBeLessThan(
              0.01,
            )
          }
        },
      ),
    )
  })
})
