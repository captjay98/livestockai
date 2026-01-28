import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 7: Laying Percentage Calculation
 * Feature: poultry-fishery-tracker, Property 7: Laying Percentage Calculation
 * Validates: Requirements 6.3
 *
 * For any layer batch with current_quantity > 0, the laying percentage SHALL equal:
 * (eggs_collected / current_quantity) × 100
 *
 * Property 8: Egg Inventory Calculation
 * Feature: poultry-fishery-tracker, Property 8: Egg Inventory Calculation
 * Validates: Requirements 6.4
 *
 * For any batch, the egg inventory SHALL equal:
 * sum(collected) - sum(sold) - sum(broken)
 */
describe('Property 7: Laying Percentage Calculation', () => {
    // Arbitrary for batch quantity (number of laying hens)
    const batchQuantityArb = fc.integer({ min: 1, max: 10000 })

    // Arbitrary for eggs collected
    const eggsCollectedArb = fc.integer({ min: 0, max: 10000 })

    /**
     * Calculate laying percentage
     * Laying % = (eggs collected / number of hens) × 100
     */
    function calculateLayingPercentage(
        eggsCollected: number,
        currentQuantity: number,
    ): number {
        if (currentQuantity <= 0) return 0
        return (eggsCollected / currentQuantity) * 100
    }

    it('laying percentage equals (eggs / hens) × 100', () => {
        fc.assert(
            fc.property(
                eggsCollectedArb,
                batchQuantityArb,
                (eggsCollected, currentQuantity) => {
                    const percentage = calculateLayingPercentage(
                        eggsCollected,
                        currentQuantity,
                    )
                    const expected = (eggsCollected / currentQuantity) * 100

                    expect(percentage).toBeCloseTo(expected, 10)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('laying percentage is 0 when no eggs collected', () => {
        fc.assert(
            fc.property(batchQuantityArb, (currentQuantity) => {
                const percentage = calculateLayingPercentage(0, currentQuantity)
                expect(percentage).toBe(0)
            }),
            { numRuns: 100 },
        )
    })

    it('laying percentage is 100 when eggs equal hens', () => {
        fc.assert(
            fc.property(batchQuantityArb, (quantity) => {
                const percentage = calculateLayingPercentage(quantity, quantity)
                expect(percentage).toBe(100)
            }),
            { numRuns: 100 },
        )
    })

    it('laying percentage can exceed 100 (multiple eggs per hen)', () => {
        fc.assert(
            fc.property(
                batchQuantityArb,
                fc.integer({ min: 2, max: 5 }), // multiplier
                (quantity, multiplier) => {
                    const eggs = quantity * multiplier
                    const percentage = calculateLayingPercentage(eggs, quantity)

                    expect(percentage).toBe(multiplier * 100)
                    expect(percentage).toBeGreaterThan(100)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('laying percentage is 0 when batch quantity is 0', () => {
        fc.assert(
            fc.property(eggsCollectedArb, (eggsCollected) => {
                const percentage = calculateLayingPercentage(eggsCollected, 0)
                expect(percentage).toBe(0)
            }),
            { numRuns: 100 },
        )
    })

    it('laying percentage is non-negative', () => {
        fc.assert(
            fc.property(
                eggsCollectedArb,
                batchQuantityArb,
                (eggsCollected, currentQuantity) => {
                    const percentage = calculateLayingPercentage(
                        eggsCollected,
                        currentQuantity,
                    )
                    expect(percentage).toBeGreaterThanOrEqual(0)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('typical layer hen laying percentage is 70-95%', () => {
        // Sanity check for realistic values
        fc.assert(
            fc.property(
                fc.integer({ min: 100, max: 5000 }), // flock size
                fc.double({ min: 0.7, max: 0.95, noNaN: true }), // laying rate
                (flockSize, layingRate) => {
                    const eggsCollected = Math.floor(flockSize * layingRate)
                    const percentage = calculateLayingPercentage(
                        eggsCollected,
                        flockSize,
                    )

                    // Allow some tolerance due to floor rounding
                    expect(percentage).toBeGreaterThanOrEqual(69)
                    expect(percentage).toBeLessThanOrEqual(96)
                },
            ),
            { numRuns: 100 },
        )
    })
})

describe('Property 8: Egg Inventory Calculation', () => {
    // Arbitrary for egg quantities
    const eggQuantityArb = fc.integer({ min: 0, max: 10000 })

    /**
     * Calculate egg inventory
     * Inventory = collected - sold - broken
     */
    function calculateEggInventory(
        collected: number,
        sold: number,
        broken: number,
    ): number {
        return collected - sold - broken
    }

    /**
     * Constrain sold and broken to not exceed collected
     */
    function constrainQuantities(
        collected: number,
        sold: number,
        broken: number,
    ): { sold: number; broken: number } {
        const constrainedSold = Math.min(sold, collected)
        const constrainedBroken = Math.min(broken, collected - constrainedSold)
        return { sold: constrainedSold, broken: constrainedBroken }
    }

    it('inventory equals collected - sold - broken', () => {
        fc.assert(
            fc.property(
                eggQuantityArb,
                eggQuantityArb,
                eggQuantityArb,
                (collected, rawSold, rawBroken) => {
                    const { sold, broken } = constrainQuantities(
                        collected,
                        rawSold,
                        rawBroken,
                    )
                    const inventory = calculateEggInventory(
                        collected,
                        sold,
                        broken,
                    )

                    expect(inventory).toBe(collected - sold - broken)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('inventory is non-negative for valid operations', () => {
        fc.assert(
            fc.property(
                eggQuantityArb,
                eggQuantityArb,
                eggQuantityArb,
                (collected, rawSold, rawBroken) => {
                    const { sold, broken } = constrainQuantities(
                        collected,
                        rawSold,
                        rawBroken,
                    )
                    const inventory = calculateEggInventory(
                        collected,
                        sold,
                        broken,
                    )

                    expect(inventory).toBeGreaterThanOrEqual(0)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('inventory equals collected when nothing sold or broken', () => {
        fc.assert(
            fc.property(eggQuantityArb, (collected) => {
                const inventory = calculateEggInventory(collected, 0, 0)
                expect(inventory).toBe(collected)
            }),
            { numRuns: 100 },
        )
    })

    it('inventory is 0 when all eggs sold', () => {
        fc.assert(
            fc.property(eggQuantityArb, (collected) => {
                const inventory = calculateEggInventory(collected, collected, 0)
                expect(inventory).toBe(0)
            }),
            { numRuns: 100 },
        )
    })

    it('inventory is 0 when all eggs broken', () => {
        fc.assert(
            fc.property(eggQuantityArb, (collected) => {
                const inventory = calculateEggInventory(collected, 0, collected)
                expect(inventory).toBe(0)
            }),
            { numRuns: 100 },
        )
    })

    it('cumulative records sum correctly', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        collected: eggQuantityArb,
                        sold: eggQuantityArb,
                        broken: eggQuantityArb,
                    }),
                    { minLength: 1, maxLength: 10 },
                ),
                (records) => {
                    let totalCollected = 0
                    let totalSold = 0
                    let totalBroken = 0

                    for (const record of records) {
                        totalCollected += record.collected
                        // Constrain sold and broken to available inventory
                        const available =
                            totalCollected - totalSold - totalBroken
                        const sold = Math.min(record.sold, available)
                        const broken = Math.min(record.broken, available - sold)
                        totalSold += sold
                        totalBroken += broken
                    }

                    const inventory = calculateEggInventory(
                        totalCollected,
                        totalSold,
                        totalBroken,
                    )

                    expect(inventory).toBe(
                        totalCollected - totalSold - totalBroken,
                    )
                    expect(inventory).toBeGreaterThanOrEqual(0)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('inventory decreases when eggs are sold or broken', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100, max: 10000 }),
                fc.integer({ min: 1, max: 50 }),
                fc.integer({ min: 1, max: 50 }),
                (collected, soldAmount, brokenAmount) => {
                    const initialInventory = calculateEggInventory(
                        collected,
                        0,
                        0,
                    )
                    const afterSale = calculateEggInventory(
                        collected,
                        soldAmount,
                        0,
                    )
                    const afterBroken = calculateEggInventory(
                        collected,
                        0,
                        brokenAmount,
                    )

                    expect(afterSale).toBeLessThan(initialInventory)
                    expect(afterBroken).toBeLessThan(initialInventory)
                },
            ),
            { numRuns: 100 },
        )
    })
})
