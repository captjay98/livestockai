import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { EXPENSE_CATEGORIES } from '~/features/expenses/constants'

describe('expenses/constants', () => {
  it('should have all required categories', () => {
    const categories = EXPENSE_CATEGORIES.map((c) => c.value)
    expect(categories).toContain('feed')
    expect(categories).toContain('medicine')
    expect(categories).toContain('equipment')
    expect(categories).toContain('utilities')
    expect(categories).toContain('labor')
    expect(categories).toContain('transport')
    expect(categories).toContain('livestock')
    expect(categories).toContain('maintenance')
    expect(categories).toContain('marketing')
    expect(categories).toContain('other')
  })

  it('should have value and label for each entry', () => {
    EXPENSE_CATEGORIES.forEach((cat) => {
      expect(typeof cat.value).toBe('string')
      expect(typeof cat.label).toBe('string')
    })
  })
})

describe('expenses aggregation logic', () => {
  // Pure function representing the logic in getExpensesSummary
  function calculateSummary(
    results: Array<{
      category: string
      count: string | number
      totalAmount: string
    }>,
  ) {
    const summary: Record<string, { count: number; amount: number }> = {}
    let totalCount = 0
    let totalAmount = 0

    for (const row of results) {
      const count = Number(row.count)
      const amount = parseFloat(row.totalAmount)
      summary[row.category] = { count, amount }
      totalCount += count
      totalAmount += amount
    }

    return {
      byCategory: summary,
      total: { count: totalCount, amount: totalAmount },
    }
  }

  it('should correctly sum totals and counts across categories', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            category: fc.string({ minLength: 1 }),
            count: fc.integer({ min: 1, max: 1000 }),
            totalAmount: fc
              .float({ min: 0, max: 1000000, noNaN: true })
              .map((n) => n.toFixed(2)),
          }),
          { minLength: 0, maxLength: 20 },
        ),
        (rows) => {
          // Filter to unique categories for the summary logic test to match typical DB group by
          const uniqueRows = Array.from(
            new Map(rows.map((r) => [r.category, r])).values(),
          )

          const result = calculateSummary(uniqueRows)

          let expectedAmount = 0
          let expectedCount = 0

          uniqueRows.forEach((row) => {
            expect(result.byCategory[row.category].amount).toBe(
              parseFloat(row.totalAmount),
            )
            expect(result.byCategory[row.category].count).toBe(
              Number(row.count),
            )
            expectedAmount += parseFloat(row.totalAmount)
            expectedCount += Number(row.count)
          })

          expect(result.total.amount).toBeCloseTo(expectedAmount, 2)
          expect(result.total.count).toBe(expectedCount)
        },
      ),
    )
  })

  it('should return empty summary for empty results', () => {
    const result = calculateSummary([])
    expect(result.byCategory).toEqual({})
    expect(result.total.amount).toBe(0)
    expect(result.total.count).toBe(0)
  })
})
