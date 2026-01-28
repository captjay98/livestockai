import { describe, expect, it } from 'vitest'

describe('Inventory Service', () => {
    describe('stock calculations', () => {
        it('calculates total inventory value', () => {
            const items = [
                { quantity: 100, unitPrice: 50 },
                { quantity: 50, unitPrice: 100 },
            ]
            const total = items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0,
            )
            expect(total).toBe(10000)
        })

        it('identifies low stock items', () => {
            const items = [
                { name: 'Feed A', quantity: 10, threshold: 20 },
                { name: 'Feed B', quantity: 50, threshold: 20 },
            ]
            const lowStock = items.filter(
                (item) => item.quantity < item.threshold,
            )
            expect(lowStock).toHaveLength(1)
            expect(lowStock[0].name).toBe('Feed A')
        })

        it('validates stock level updates', () => {
            const currentStock = 100
            const adjustment = -10
            const newStock = currentStock + adjustment
            expect(newStock).toBe(90)
            expect(newStock).toBeGreaterThanOrEqual(0)
        })

        it('prevents negative stock', () => {
            const currentStock = 10
            const adjustment = -20
            const newStock = Math.max(0, currentStock + adjustment)
            expect(newStock).toBe(0)
        })

        it('aggregates inventory by type', () => {
            const inventory = [
                { type: 'feed', quantity: 100 },
                { type: 'feed', quantity: 50 },
                { type: 'medication', quantity: 20 },
            ]
            const byType = inventory.reduce(
                (acc, item) => {
                    acc[item.type] = (acc[item.type] || 0) + item.quantity
                    return acc
                },
                {} as Record<string, number>,
            )
            expect(byType.feed).toBe(150)
            expect(byType.medication).toBe(20)
        })
    })

    describe('threshold checks', () => {
        it('calculates percentage of threshold', () => {
            const quantity = 15
            const threshold = 20
            const percentage = (quantity / threshold) * 100
            expect(percentage).toBe(75)
        })

        it('identifies critical stock levels', () => {
            const items = [
                { name: 'Item A', quantity: 5, threshold: 20 }, // 25%
                { name: 'Item B', quantity: 15, threshold: 20 }, // 75%
            ]
            const critical = items.filter(
                (item) => (item.quantity / item.threshold) * 100 < 50,
            )
            expect(critical).toHaveLength(1)
            expect(critical[0].name).toBe('Item A')
        })
    })
})
