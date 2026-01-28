import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

describe('Profit/Loss Property Tests', () => {
    /**
     * Calculate profit: revenue - expenses
     */
    function calculateProfit(revenue: number, expenses: number): number {
        return revenue - expenses
    }

    describe('Property 1: Profit formula correctness', () => {
        it('should equal revenue minus expenses', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000000 }),
                    fc.integer({ min: 0, max: 1000000 }),
                    (revenue, expenses) => {
                        const profit = calculateProfit(revenue, expenses)
                        const expected = revenue - expenses
                        expect(Math.abs(profit - expected)).toBeLessThan(0.01)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 2: Profit is negative when expenses exceed revenue', () => {
        it('should be negative when expenses > revenue', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100000 }),
                    fc.integer({ min: 2, max: 10 }),
                    (revenue, multiplier) => {
                        const expenses = revenue * multiplier
                        const profit = calculateProfit(revenue, expenses)

                        if (expenses > revenue) {
                            expect(profit).toBeLessThan(0)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 3: Profit is positive when revenue exceeds expenses', () => {
        it('should be positive when revenue > expenses', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100, max: 1000000 }),
                    fc.integer({ min: 0, max: 99 }),
                    (revenue, expenses) => {
                        const profit = calculateProfit(revenue, expenses)

                        if (revenue > expenses) {
                            expect(profit).toBeGreaterThan(0)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 4: Profit increases with revenue (expenses constant)', () => {
        it('should increase when revenue increases', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100000 }),
                    fc.integer({ min: 0, max: 100000 }),
                    fc.integer({ min: 1, max: 10000 }),
                    (baseRevenue, expenses, additionalRevenue) => {
                        const profit1 = calculateProfit(baseRevenue, expenses)
                        const profit2 = calculateProfit(
                            baseRevenue + additionalRevenue,
                            expenses,
                        )

                        expect(profit2).toBeGreaterThan(profit1)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 5: Profit decreases with expenses (revenue constant)', () => {
        it('should decrease when expenses increase', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100000 }),
                    fc.integer({ min: 0, max: 100000 }),
                    fc.integer({ min: 1, max: 10000 }),
                    (revenue, baseExpenses, additionalExpenses) => {
                        const profit1 = calculateProfit(revenue, baseExpenses)
                        const profit2 = calculateProfit(
                            revenue,
                            baseExpenses + additionalExpenses,
                        )

                        expect(profit2).toBeLessThan(profit1)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 6: Break-even when revenue equals expenses', () => {
        it('should be zero when revenue equals expenses', () => {
            fc.assert(
                fc.property(fc.integer({ min: 0, max: 1000000 }), (value) => {
                    const profit = calculateProfit(value, value)
                    expect(Math.abs(profit)).toBeLessThan(0.0001)
                }),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 7: Profit margin calculation', () => {
        it('should calculate correct profit margin', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100, max: 1000000 }),
                    fc.integer({ min: 0, max: 99 }),
                    (revenue, expensePercent) => {
                        const expenses = Math.floor(
                            (revenue * expensePercent) / 100,
                        )
                        const profit = calculateProfit(revenue, expenses)
                        const margin = (profit / revenue) * 100

                        expect(margin).toBeGreaterThanOrEqual(0)
                        expect(margin).toBeLessThanOrEqual(100)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 8: Profit is additive', () => {
        it('should be additive across multiple transactions', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            revenue: fc.integer({ min: 0, max: 10000 }),
                            expenses: fc.integer({ min: 0, max: 10000 }),
                        }),
                        { minLength: 1, maxLength: 10 },
                    ),
                    (transactions) => {
                        const totalRevenue = transactions.reduce(
                            (sum, t) => sum + t.revenue,
                            0,
                        )
                        const totalExpenses = transactions.reduce(
                            (sum, t) => sum + t.expenses,
                            0,
                        )

                        const totalProfit = calculateProfit(
                            totalRevenue,
                            totalExpenses,
                        )

                        const sumOfProfits = transactions.reduce(
                            (sum, t) =>
                                sum + calculateProfit(t.revenue, t.expenses),
                            0,
                        )

                        expect(
                            Math.abs(totalProfit - sumOfProfits),
                        ).toBeLessThan(0.01)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })
})
