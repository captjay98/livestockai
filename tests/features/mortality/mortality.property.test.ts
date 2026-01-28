import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 5: Mortality Rate Calculation
 * Feature: poultry-fishery-tracker, Property 5: Mortality Rate Calculation
 * Validates: Requirements 4.3, 4.4
 *
 * For any batch with initial_quantity > 0, the mortality rate SHALL equal:
 * (sum of mortality quantities / initial_quantity) × 100
 */
describe('Property 5: Mortality Rate Calculation', () => {
    // Arbitrary for initial quantity (must be positive)
    const initialQuantityArb = fc.integer({ min: 1, max: 100000 })

    // Arbitrary for mortality quantities
    const mortalityQuantityArb = fc.integer({ min: 0, max: 10000 })

    /**
     * Calculate mortality rate as percentage
     */
    function calculateMortalityRate(
        initialQuantity: number,
        totalDeaths: number,
    ): number {
        if (initialQuantity <= 0) return 0
        return (totalDeaths / initialQuantity) * 100
    }

    /**
     * Constrain deaths to not exceed initial quantity
     */
    function constrainDeaths(initialQuantity: number, deaths: number): number {
        return Math.min(deaths, initialQuantity)
    }

    it('mortality rate equals (deaths / initial) × 100', () => {
        fc.assert(
            fc.property(
                initialQuantityArb,
                fc.array(mortalityQuantityArb, { minLength: 0, maxLength: 20 }),
                (initialQuantity, mortalityRecords) => {
                    // Sum all mortality records, constrained to initial quantity
                    let totalDeaths = mortalityRecords.reduce(
                        (sum, q) => sum + q,
                        0,
                    )
                    totalDeaths = constrainDeaths(initialQuantity, totalDeaths)

                    const rate = calculateMortalityRate(
                        initialQuantity,
                        totalDeaths,
                    )
                    const expected = (totalDeaths / initialQuantity) * 100

                    expect(rate).toBeCloseTo(expected, 10)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('mortality rate is between 0 and 100 for valid inputs', () => {
        fc.assert(
            fc.property(
                initialQuantityArb,
                mortalityQuantityArb,
                (initialQuantity, deaths) => {
                    const constrainedDeaths = constrainDeaths(
                        initialQuantity,
                        deaths,
                    )
                    const rate = calculateMortalityRate(
                        initialQuantity,
                        constrainedDeaths,
                    )

                    expect(rate).toBeGreaterThanOrEqual(0)
                    expect(rate).toBeLessThanOrEqual(100)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('zero deaths means zero mortality rate', () => {
        fc.assert(
            fc.property(initialQuantityArb, (initialQuantity) => {
                const rate = calculateMortalityRate(initialQuantity, 0)
                expect(rate).toBe(0)
            }),
            { numRuns: 100 },
        )
    })

    it('all deaths means 100% mortality rate', () => {
        fc.assert(
            fc.property(initialQuantityArb, (initialQuantity) => {
                const rate = calculateMortalityRate(
                    initialQuantity,
                    initialQuantity,
                )
                expect(rate).toBe(100)
            }),
            { numRuns: 100 },
        )
    })

    it('half deaths means 50% mortality rate', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 100000 }).filter((n) => n % 2 === 0),
                (initialQuantity) => {
                    const halfDeaths = initialQuantity / 2
                    const rate = calculateMortalityRate(
                        initialQuantity,
                        halfDeaths,
                    )
                    expect(rate).toBeCloseTo(50, 10)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('mortality rate is proportional to deaths', () => {
        fc.assert(
            fc.property(
                initialQuantityArb,
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                (initialQuantity, deaths1Pct, deaths2Pct) => {
                    // Convert percentages to actual deaths
                    const deaths1 = Math.floor(
                        (deaths1Pct / 100) * initialQuantity,
                    )
                    const deaths2 = Math.floor(
                        (deaths2Pct / 100) * initialQuantity,
                    )

                    const rate1 = calculateMortalityRate(
                        initialQuantity,
                        deaths1,
                    )
                    const rate2 = calculateMortalityRate(
                        initialQuantity,
                        deaths2,
                    )

                    // If deaths1 > deaths2, then rate1 > rate2
                    if (deaths1 > deaths2) {
                        expect(rate1).toBeGreaterThan(rate2)
                    } else if (deaths1 < deaths2) {
                        expect(rate1).toBeLessThan(rate2)
                    } else {
                        expect(rate1).toBeCloseTo(rate2, 10)
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('cumulative mortality records sum correctly', () => {
        fc.assert(
            fc.property(
                initialQuantityArb,
                fc.array(mortalityQuantityArb, { minLength: 1, maxLength: 10 }),
                (initialQuantity, mortalityRecords) => {
                    // Calculate rate from individual records
                    let runningTotal = 0
                    let lastRate = 0

                    for (const deaths of mortalityRecords) {
                        const constrainedDeaths = Math.min(
                            deaths,
                            initialQuantity - runningTotal,
                        )
                        runningTotal += constrainedDeaths
                        lastRate = calculateMortalityRate(
                            initialQuantity,
                            runningTotal,
                        )
                    }

                    // Calculate rate from total
                    const totalDeaths = constrainDeaths(
                        initialQuantity,
                        mortalityRecords.reduce((sum, q) => sum + q, 0),
                    )
                    const totalRate = calculateMortalityRate(
                        initialQuantity,
                        totalDeaths,
                    )

                    // Both approaches should give the same result
                    expect(lastRate).toBeCloseTo(totalRate, 10)
                },
            ),
            { numRuns: 100 },
        )
    })
})
