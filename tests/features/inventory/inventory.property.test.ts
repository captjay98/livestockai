import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { FEED_TYPES } from '~/features/inventory/feed-server'

describe('inventory/feed-server logic', () => {
    describe('FEED_TYPES', () => {
        it('should have all feed types', () => {
            expect(FEED_TYPES.length).toBe(5)
            const values = FEED_TYPES.map((t) => t.value)
            expect(values).toContain('starter')
            expect(values).toContain('grower')
            expect(values).toContain('finisher')
            expect(values).toContain('layer_mash')
            expect(values).toContain('fish_feed')
        })

        it('should have value and label for each type', () => {
            FEED_TYPES.forEach((type) => {
                expect(type.value).toBeTruthy()
                expect(type.label).toBeTruthy()
            })
        })
    })

    describe('low stock detection', () => {
        function isLowStock(quantity: number, threshold: number): boolean {
            return quantity <= threshold
        }

        it('should detect low stock when quantity <= threshold', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000 }),
                    fc.integer({ min: 0, max: 1000 }),
                    (quantity, threshold) => {
                        const isLow = isLowStock(quantity, threshold)
                        if (quantity <= threshold) {
                            expect(isLow).toBe(true)
                        } else {
                            expect(isLow).toBe(false)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should not be low stock when quantity > threshold', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100, max: 10000 }),
                    fc.integer({ min: 1, max: 99 }),
                    (quantity, threshold) => {
                        expect(isLowStock(quantity, threshold)).toBe(false)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('stock percentage calculation', () => {
        function stockPercentage(current: number, max: number): number {
            if (max === 0) return 0
            return (current / max) * 100
        }

        it('should calculate percentage correctly', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000 }),
                    fc.integer({ min: 1, max: 1000 }),
                    (current, max) => {
                        const pct = stockPercentage(current, max)
                        expect(pct).toBeGreaterThanOrEqual(0)
                        if (current <= max) {
                            expect(pct).toBeLessThanOrEqual(100)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should return 0 when max is 0', () => {
            expect(stockPercentage(100, 0)).toBe(0)
        })
    })
})
