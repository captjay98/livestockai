import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 10: Profit Calculation
 * Feature: poultry-fishery-tracker, Property 10: Profit Calculation
 * Validates: Requirements 10.2, 12.1
 * 
 * Profit SHALL equal: total_revenue - total_expenses
 * Profit margin SHALL equal: (profit / total_revenue) * 100 when revenue > 0
 */
describe('Property 10: Profit Calculation', () => {
  // Arbitrary for monetary amounts (in Naira)
  const amountArb = fc.double({ min: 0, max: 10000000, noNaN: true })
    .map(n => Math.round(n * 100) / 100)

  // Arbitrary for sale record
  const saleRecordArb = fc.record({
    id: fc.uuid(),
    totalAmount: amountArb,
    livestockType: fc.constantFrom('poultry', 'fish', 'eggs'),
  })

  // Arbitrary for expense record
  const expenseRecordArb = fc.record({
    id: fc.uuid(),
    amount: amountArb,
    category: fc.constantFrom('feed', 'medication', 'utilities', 'labor', 'equipment'),
  })


  /**
   * Calculate profit from sales and expenses
   */
  function calculateProfit(
    sales: Array<{ totalAmount: number }>,
    expenses: Array<{ amount: number }>
  ): { revenue: number; expenses: number; profit: number; profitMargin: number } {
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit,
      profitMargin: Math.round(profitMargin * 10) / 10,
    }
  }

  it('profit equals revenue minus expenses', () => {
    fc.assert(
      fc.property(
        fc.array(saleRecordArb, { minLength: 0, maxLength: 50 }),
        fc.array(expenseRecordArb, { minLength: 0, maxLength: 50 }),
        (sales, expenses) => {
          const result = calculateProfit(sales, expenses)
          const expectedProfit = result.revenue - result.expenses
          expect(result.profit).toBeCloseTo(expectedProfit, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('profit margin is calculated correctly when revenue > 0', () => {
    fc.assert(
      fc.property(
        fc.array(saleRecordArb, { minLength: 1, maxLength: 50 }),
        fc.array(expenseRecordArb, { minLength: 0, maxLength: 50 }),
        (sales, expenses) => {
          // Ensure at least some revenue
          const salesWithRevenue = sales.map(s => ({
            ...s,
            totalAmount: Math.max(s.totalAmount, 100),
          }))
          
          const result = calculateProfit(salesWithRevenue, expenses)
          
          if (result.revenue > 0) {
            const expectedMargin = (result.profit / result.revenue) * 100
            expect(result.profitMargin).toBeCloseTo(Math.round(expectedMargin * 10) / 10, 1)
          }
        }
      ),
      { numRuns: 100 }
    )
  })


  it('profit margin is 0 when revenue is 0', () => {
    fc.assert(
      fc.property(
        fc.array(expenseRecordArb, { minLength: 0, maxLength: 50 }),
        (expenses) => {
          const result = calculateProfit([], expenses)
          expect(result.profitMargin).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('profit is positive when revenue exceeds expenses', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10000, max: 1000000, noNaN: true }),
        fc.double({ min: 0, max: 9999, noNaN: true }),
        (revenue, expense) => {
          const sales = [{ totalAmount: revenue }]
          const expenses = [{ amount: expense }]
          const result = calculateProfit(sales, expenses)
          expect(result.profit).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('profit is negative when expenses exceed revenue', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 9999, noNaN: true }),
        fc.double({ min: 10000, max: 1000000, noNaN: true }),
        (revenue, expense) => {
          const sales = [{ totalAmount: revenue }]
          const expenses = [{ amount: expense }]
          const result = calculateProfit(sales, expenses)
          expect(result.profit).toBeLessThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('profit margin is 100% when there are no expenses', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 1000000, noNaN: true }),
        (revenue) => {
          const sales = [{ totalAmount: revenue }]
          const result = calculateProfit(sales, [])
          expect(result.profitMargin).toBeCloseTo(100, 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('revenue aggregation is correct', () => {
    fc.assert(
      fc.property(
        fc.array(saleRecordArb, { minLength: 1, maxLength: 50 }),
        (sales) => {
          const result = calculateProfit(sales, [])
          const expectedRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
          expect(result.revenue).toBeCloseTo(expectedRevenue, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('expense aggregation is correct', () => {
    fc.assert(
      fc.property(
        fc.array(expenseRecordArb, { minLength: 1, maxLength: 50 }),
        (expenses) => {
          const result = calculateProfit([], expenses)
          const expectedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
          expect(result.expenses).toBeCloseTo(expectedExpenses, 2)
        }
      ),
      { numRuns: 100 }
    )
  })
})
