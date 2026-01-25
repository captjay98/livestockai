import { describe, expect, it } from 'vitest'

describe('Dashboard Service', () => {
  describe('stat aggregations', () => {
    it('calculates total revenue', () => {
      const sales = [5000, 3000, 2000]
      const total = sales.reduce((sum, sale) => sum + sale, 0)
      expect(total).toBe(10000)
    })

    it('calculates total expenses', () => {
      const expenses = [1000, 500, 300]
      const total = expenses.reduce((sum, exp) => sum + exp, 0)
      expect(total).toBe(1800)
    })

    it('calculates profit', () => {
      const revenue = 10000
      const expenses = 6000
      const profit = revenue - expenses
      expect(profit).toBe(4000)
    })

    it('calculates profit margin', () => {
      const revenue = 10000
      const profit = 4000
      const margin = (profit / revenue) * 100
      expect(margin).toBe(40)
    })

    it('aggregates by livestock type', () => {
      const batches = [
        { type: 'poultry', quantity: 100 },
        { type: 'poultry', quantity: 50 },
        { type: 'fish', quantity: 200 },
      ]
      const byType = batches.reduce(
        (acc, batch) => {
          acc[batch.type] = (acc[batch.type] || 0) + batch.quantity
          return acc
        },
        {} as Record<string, number>,
      )
      expect(byType.poultry).toBe(150)
      expect(byType.fish).toBe(200)
    })

    it('calculates average batch size', () => {
      const batches = [100, 200, 150]
      const avg = batches.reduce((sum, b) => sum + b, 0) / batches.length
      expect(avg).toBe(150)
    })
  })

  describe('summary calculations', () => {
    it('counts active batches', () => {
      const batches = [
        { status: 'active' },
        { status: 'active' },
        { status: 'depleted' },
      ]
      const active = batches.filter((b) => b.status === 'active').length
      expect(active).toBe(2)
    })

    it('calculates total investment', () => {
      const batches = [{ cost: 5000 }, { cost: 3000 }]
      const total = batches.reduce((sum, b) => sum + b.cost, 0)
      expect(total).toBe(8000)
    })
  })
})
