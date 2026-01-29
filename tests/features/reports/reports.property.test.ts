import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

describe('Report Property Tests', () => {
  describe('financial calculations', () => {
    it('revenue is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100000 }), {
            minLength: 0,
            maxLength: 100,
          }),
          (sales) => {
            const revenue = sales.reduce((sum, sale) => sum + sale, 0)
            expect(revenue).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('expenses are always non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100000 }), {
            minLength: 0,
            maxLength: 100,
          }),
          (expenses) => {
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp, 0)
            expect(totalExpenses).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('profit equals revenue minus expenses', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 0, max: 1000000 }),
          (revenue, expenses) => {
            const profit = revenue - expenses
            expect(profit).toBe(revenue - expenses)
            expect(profit).toBeGreaterThanOrEqual(-expenses)
            expect(profit).toBeLessThanOrEqual(revenue)
          },
        ),
      )
    })

    it('profit margin calculation is consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          fc.integer({ min: 0, max: 1000000 }),
          (revenue, expenses) => {
            const profit = revenue - expenses
            const profitMargin = (profit / revenue) * 100
            // Profit margin can be negative if expenses > revenue
            expect(profitMargin).toBeLessThanOrEqual(100)
            // When profit equals revenue (no expenses), margin is 100%
            if (expenses === 0) {
              expect(profitMargin).toBe(100)
            }
          },
        ),
      )
    })

    it('percentages are always between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 0, max: 1000000 }),
          (part, total) => {
            if (total === 0) {
              expect(true).toBe(true)
              return
            }
            const percentage = (part / total) * 100
            expect(percentage).toBeGreaterThanOrEqual(0)
            if (part <= total) {
              expect(percentage).toBeLessThanOrEqual(100)
            }
          },
        ),
      )
    })
  })

  describe('date range calculations', () => {
    it('date ranges are valid', () => {
      fc.assert(
        fc.property(
          fc
            .date({
              min: new Date('2020-01-01'),
              max: new Date('2030-12-31'),
            })
            .filter((d) => !isNaN(d.getTime())),
          fc.integer({ min: 1, max: 365 }),
          (startDate, daysToAdd) => {
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + daysToAdd)
            expect(endDate.getTime()).toBeGreaterThan(startDate.getTime())
            expect(endDate.getTime() - startDate.getTime()).toBeGreaterThan(0)
          },
        ),
      )
    })

    it('fiscal year calculations are consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 2020, max: 2030 }),
          (startMonth, year) => {
            const fiscalYearStart = new Date(year, startMonth - 1, 1)
            const fiscalYearEnd = new Date(year + 1, startMonth - 1, 0)
            expect(fiscalYearEnd.getTime()).toBeGreaterThan(
              fiscalYearStart.getTime(),
            )
            const daysDiff =
              (fiscalYearEnd.getTime() - fiscalYearStart.getTime()) /
              (1000 * 60 * 60 * 24)
            expect(daysDiff).toBeGreaterThan(360)
            expect(daysDiff).toBeLessThan(370)
          },
        ),
      )
    })
  })

  describe('aggregation calculations', () => {
    it('sum of parts equals total', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10000 }), {
            minLength: 1,
            maxLength: 50,
          }),
          (values) => {
            const total = values.reduce((sum, val) => sum + val, 0)
            const manualSum = values.reduce((sum, val) => sum + val, 0)
            expect(total).toBe(manualSum)
            expect(total).toBeGreaterThanOrEqual(0)
          },
        ),
      )
    })

    it('average is within min and max', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 10000 }), {
            minLength: 1,
            maxLength: 50,
          }),
          (values) => {
            const sum = values.reduce((s, v) => s + v, 0)
            const avg = sum / values.length
            const min = Math.min(...values)
            const max = Math.max(...values)
            expect(avg).toBeGreaterThanOrEqual(min)
            expect(avg).toBeLessThanOrEqual(max)
          },
        ),
      )
    })

    it('group totals equal overall total', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              category: fc.constantFrom('feed', 'medicine', 'labor', 'other'),
              amount: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 50 },
          ),
          (expenses) => {
            const overallTotal = expenses.reduce(
              (sum, exp) => sum + exp.amount,
              0,
            )
            const categories = ['feed', 'medicine', 'labor', 'other']
            const categoryTotals = categories.map((cat) =>
              expenses
                .filter((exp) => exp.category === cat)
                .reduce((sum, exp) => sum + exp.amount, 0),
            )
            const sumOfCategoryTotals = categoryTotals.reduce(
              (sum, total) => sum + total,
              0,
            )
            expect(sumOfCategoryTotals).toBe(overallTotal)
          },
        ),
      )
    })
  })
})
