import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 15: Customer Revenue Aggregation
 * Feature: poultry-fishery-tracker, Property 15: Customer Revenue Aggregation
 * Validates: Requirements 15.3, 15.4
 *
 * For any customer, their total_spent SHALL equal:
 * sum(sales.total_amount) where sales.customer_id = customer.id
 */
describe('Property 15: Customer Revenue Aggregation', () => {
    // Arbitrary for customer ID
    const customerIdArb = fc.uuid()

    // Arbitrary for sale amount (in Naira)
    const saleAmountArb = fc
        .double({ min: 100, max: 10000000, noNaN: true })
        .map((n) => Math.round(n * 100) / 100) // Round to 2 decimal places

    // Arbitrary for sale record
    const saleRecordArb = fc.record({
        id: fc.uuid(),
        customerId: fc.uuid(),
        totalAmount: saleAmountArb,
    })

    /**
     * Calculate total spent by a customer
     */
    function calculateCustomerTotalSpent(
        sales: Array<{ customerId: string; totalAmount: number }>,
        customerId: string,
    ): number {
        return sales
            .filter((sale) => sale.customerId === customerId)
            .reduce((sum, sale) => sum + sale.totalAmount, 0)
    }

    /**
     * Get top customers by revenue
     */
    function getTopCustomers(
        sales: Array<{ customerId: string; totalAmount: number }>,
        limit: number,
    ): Array<{ customerId: string; totalSpent: number }> {
        const customerTotals = new Map<string, number>()

        for (const sale of sales) {
            const current = customerTotals.get(sale.customerId) || 0
            customerTotals.set(sale.customerId, current + sale.totalAmount)
        }

        return Array.from(customerTotals.entries())
            .map(([customerId, totalSpent]) => ({ customerId, totalSpent }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit)
    }

    it('total_spent equals sum of sales for customer', () => {
        fc.assert(
            fc.property(
                fc.array(saleRecordArb, { minLength: 0, maxLength: 100 }),
                customerIdArb,
                (sales, customerId) => {
                    const totalSpent = calculateCustomerTotalSpent(
                        sales,
                        customerId,
                    )

                    // Manual calculation
                    const expected = sales
                        .filter((s) => s.customerId === customerId)
                        .reduce((sum, s) => sum + s.totalAmount, 0)

                    expect(totalSpent).toBeCloseTo(expected, 2)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('total_spent is 0 for customer with no sales', () => {
        fc.assert(
            fc.property(
                fc.array(saleRecordArb, { minLength: 0, maxLength: 50 }),
                customerIdArb,
                (sales, customerId) => {
                    // Ensure no sales have this customer ID
                    const salesWithoutCustomer = sales.map((s) => ({
                        ...s,
                        customerId:
                            s.customerId === customerId
                                ? `other-${s.customerId}`
                                : s.customerId,
                    }))

                    const totalSpent = calculateCustomerTotalSpent(
                        salesWithoutCustomer,
                        customerId,
                    )
                    expect(totalSpent).toBe(0)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('total_spent is non-negative', () => {
        fc.assert(
            fc.property(
                fc.array(saleRecordArb, { minLength: 0, maxLength: 50 }),
                customerIdArb,
                (sales, customerId) => {
                    const totalSpent = calculateCustomerTotalSpent(
                        sales,
                        customerId,
                    )
                    expect(totalSpent).toBeGreaterThanOrEqual(0)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('total_spent increases with each sale', () => {
        fc.assert(
            fc.property(
                customerIdArb,
                fc.array(saleAmountArb, { minLength: 1, maxLength: 20 }),
                (customerId, amounts) => {
                    let runningTotal = 0
                    const sales: Array<{
                        customerId: string
                        totalAmount: number
                    }> = []

                    for (const amount of amounts) {
                        sales.push({ customerId, totalAmount: amount })
                        const newTotal = calculateCustomerTotalSpent(
                            sales,
                            customerId,
                        )

                        expect(newTotal).toBeGreaterThanOrEqual(runningTotal)
                        runningTotal = newTotal
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('top customers are sorted by total spent descending', () => {
        fc.assert(
            fc.property(
                fc.array(saleRecordArb, { minLength: 1, maxLength: 100 }),
                fc.integer({ min: 1, max: 10 }),
                (sales, limit) => {
                    const topCustomers = getTopCustomers(sales, limit)

                    // Verify sorted in descending order
                    for (let i = 1; i < topCustomers.length; i++) {
                        expect(
                            topCustomers[i - 1].totalSpent,
                        ).toBeGreaterThanOrEqual(topCustomers[i].totalSpent)
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('top customers list respects limit', () => {
        fc.assert(
            fc.property(
                fc.array(saleRecordArb, { minLength: 1, maxLength: 100 }),
                fc.integer({ min: 1, max: 20 }),
                (sales, limit) => {
                    const topCustomers = getTopCustomers(sales, limit)

                    // Should not exceed limit
                    expect(topCustomers.length).toBeLessThanOrEqual(limit)

                    // Should include all unique customers if fewer than limit
                    const uniqueCustomers = new Set(
                        sales.map((s) => s.customerId),
                    )
                    expect(topCustomers.length).toBeLessThanOrEqual(
                        uniqueCustomers.size,
                    )
                },
            ),
            { numRuns: 100 },
        )
    })

    it('all sales are accounted for in customer totals', () => {
        fc.assert(
            fc.property(
                fc.array(saleRecordArb, { minLength: 1, maxLength: 50 }),
                (sales) => {
                    // Get all unique customer IDs
                    const customerIds = [
                        ...new Set(sales.map((s) => s.customerId)),
                    ]

                    // Sum of all customer totals should equal sum of all sales
                    const totalFromCustomers = customerIds.reduce(
                        (sum, customerId) =>
                            sum +
                            calculateCustomerTotalSpent(sales, customerId),
                        0,
                    )

                    const totalFromSales = sales.reduce(
                        (sum, s) => sum + s.totalAmount,
                        0,
                    )

                    expect(totalFromCustomers).toBeCloseTo(totalFromSales, 2)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('customer with single large sale ranks higher than multiple small sales', () => {
        fc.assert(
            fc.property(
                fc.uuid(), // customer A
                fc.uuid(), // customer B
                fc.double({ min: 10000, max: 100000, noNaN: true }), // large sale
                fc.array(fc.double({ min: 100, max: 500, noNaN: true }), {
                    minLength: 1,
                    maxLength: 10,
                }), // small sales
                (customerA, customerB, largeSale, smallSales) => {
                    // Ensure different customers
                    if (customerA === customerB) return

                    const smallSalesTotal = smallSales.reduce(
                        (sum, s) => sum + s,
                        0,
                    )

                    // Only test when large sale is actually larger
                    if (largeSale <= smallSalesTotal) return

                    const sales = [
                        { customerId: customerA, totalAmount: largeSale },
                        ...smallSales.map((amount) => ({
                            customerId: customerB,
                            totalAmount: amount,
                        })),
                    ]

                    const topCustomers = getTopCustomers(sales, 2)

                    expect(topCustomers[0].customerId).toBe(customerA)
                    expect(topCustomers[0].totalSpent).toBeCloseTo(largeSale, 2)
                },
            ),
            { numRuns: 100 },
        )
    })
})
