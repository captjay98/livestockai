import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { ReportConfigData } from '~/features/reports/service'
import {
  aggregateReportData,
  calculateDateRange,
  calculateEggInventory,
  calculateLayingPercentage,
  calculateMortalityRate,
  calculateProfitMargin,
  formatReportOutput,
  validateReportConfig,
  validateUpdateData,
} from '~/features/reports/service'

describe('Reports Service', () => {
  describe('validateReportConfig', () => {
    const validData: ReportConfigData = {
      name: 'Monthly Sales Report',
      farmId: '123e4567-e89b-12d3-a456-426614174000',
      reportType: 'sales',
      dateRangeType: 'month',
      includeCharts: true,
      includeDetails: true,
    }

    it('should accept valid data', () => {
      const result = validateReportConfig(validData)
      expect(result).toBeNull()
    })

    it('should reject empty name', () => {
      expect(validateReportConfig({ ...validData, name: '' })).toBe(
        'Report name is required',
      )
      expect(validateReportConfig({ ...validData, name: '   ' })).toBe(
        'Report name is required',
      )
    })

    it('should reject name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101)
      expect(validateReportConfig({ ...validData, name: longName })).toBe(
        'Report name cannot exceed 100 characters',
      )
    })

    it('should reject empty farm ID', () => {
      expect(validateReportConfig({ ...validData, farmId: '' })).toBe(
        'Farm ID is required',
      )
    })

    it('should reject invalid report type', () => {
      expect(
        validateReportConfig({ ...validData, reportType: 'invalid' as any }),
      ).toBe('Invalid report type')
    })

    it('should reject invalid date range type', () => {
      expect(
        validateReportConfig({ ...validData, dateRangeType: 'invalid' as any }),
      ).toBe('Invalid date range type')
    })

    it('should reject custom date range without both dates', () => {
      expect(
        validateReportConfig({
          ...validData,
          dateRangeType: 'custom',
          customStartDate: new Date(),
          customEndDate: null,
        }),
      ).toBe('Custom date range requires both start and end dates')

      expect(
        validateReportConfig({
          ...validData,
          dateRangeType: 'custom',
          customStartDate: null,
          customEndDate: new Date(),
        }),
      ).toBe('Custom date range requires both start and end dates')
    })

    it('should reject invalid custom dates', () => {
      expect(
        validateReportConfig({
          ...validData,
          dateRangeType: 'custom',
          customStartDate: new Date('invalid') as any,
          customEndDate: new Date(),
        }),
      ).toBe('Custom dates must be valid dates')
    })

    it('should reject start date after end date', () => {
      const startDate = new Date('2024-01-10')
      const endDate = new Date('2024-01-01')
      expect(
        validateReportConfig({
          ...validData,
          dateRangeType: 'custom',
          customStartDate: startDate,
          customEndDate: endDate,
        }),
      ).toBe('Start date must be before or equal to end date')
    })
  })

  describe('calculateDateRange', () => {
    it('should return today for today period', () => {
      const result = calculateDateRange('today')
      const today = new Date()
      expect(result.startDate.toDateString()).toBe(today.toDateString())
      expect(result.endDate.toDateString()).toBe(today.toDateString())
    })

    it('should return 7-day range for week period', () => {
      const result = calculateDateRange('week')
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      expect(result.startDate.toDateString()).toBe(weekAgo.toDateString())
      expect(result.endDate.toDateString()).toBe(today.toDateString())
    })

    it('should return month range for month period', () => {
      const result = calculateDateRange('month')
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      expect(result.startDate.toDateString()).toBe(monthStart.toDateString())
      expect(result.endDate.toDateString()).toBe(today.toDateString())
    })

    it('should return quarter range for quarter period', () => {
      const result = calculateDateRange('quarter')
      const today = new Date()
      const quarter = Math.floor(today.getMonth() / 3)
      const quarterStart = new Date(today.getFullYear(), quarter * 3, 1)
      expect(result.startDate.toDateString()).toBe(quarterStart.toDateString())
      expect(result.endDate.toDateString()).toBe(today.toDateString())
    })

    it('should return year range for year period', () => {
      const result = calculateDateRange('year')
      const today = new Date()
      const yearStart = new Date(today.getFullYear(), 0, 1)
      expect(result.startDate.toDateString()).toBe(yearStart.toDateString())
      expect(result.endDate.toDateString()).toBe(today.toDateString())
    })

    it('should return custom dates for custom period', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      const result = calculateDateRange('custom', startDate, endDate)
      expect(result.startDate.toDateString()).toBe(startDate.toDateString())
      expect(result.endDate.toDateString()).toBe(endDate.toDateString())
    })

    it('should use today as default for custom period with null dates', () => {
      const result = calculateDateRange('custom', null, null)
      const today = new Date()
      expect(result.startDate.toDateString()).toBe(today.toDateString())
      expect(result.endDate.toDateString()).toBe(today.toDateString())
    })
  })

  describe('calculateProfitMargin', () => {
    it('should calculate profit margin correctly', () => {
      expect(calculateProfitMargin(1000, 800)).toBe(20)
      expect(calculateProfitMargin(500, 250)).toBe(50)
      expect(calculateProfitMargin(1000, 1000)).toBe(0)
    })

    it('should return 0 for zero or negative revenue', () => {
      expect(calculateProfitMargin(0, 100)).toBe(0)
      expect(calculateProfitMargin(-100, 100)).toBe(0)
    })

    it('should handle negative profit', () => {
      expect(calculateProfitMargin(1000, 1500)).toBe(-50)
    })

    it('should round to 1 decimal place', () => {
      expect(calculateProfitMargin(100, 33)).toBe(67)
      expect(calculateProfitMargin(100, 34)).toBe(66)
    })

    it('should always return profit - expenses / revenue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 0, max: 100000 }),
          (revenue, expenses) => {
            const profit = revenue - expenses
            const expected = revenue > 0 ? (profit / revenue) * 100 : 0
            expect(calculateProfitMargin(revenue, expenses)).toBeCloseTo(
              Math.round(expected * 10) / 10,
            )
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('calculateMortalityRate', () => {
    it('should calculate mortality rate correctly', () => {
      expect(calculateMortalityRate(100, 95)).toBe(5)
      expect(calculateMortalityRate(100, 50)).toBe(50)
      expect(calculateMortalityRate(100, 100)).toBe(0)
    })

    it('should return 0 for zero initial quantity', () => {
      expect(calculateMortalityRate(0, 0)).toBe(0)
      expect(calculateMortalityRate(0, 10)).toBe(0)
    })

    it('should handle rate over 100%', () => {
      // More deaths than initial (edge case for tracking cumulative)
      expect(calculateMortalityRate(100, -10)).toBe(110)
    })

    it('should round to 1 decimal place', () => {
      expect(calculateMortalityRate(100, 95.5)).toBe(4.5)
      expect(calculateMortalityRate(100, 94.5)).toBe(5.5)
    })

    it('should calculate as percentage of initial quantity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 15000 }),
          (initial, current) => {
            const mortality = initial - current
            const expected =
              initial > 0 ? (mortality / initial) * 100 : 0
            expect(calculateMortalityRate(initial, current)).toBeCloseTo(
              Math.round(expected * 10) / 10,
            )
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('aggregateReportData', () => {
    it('should return zeros for empty records', () => {
      const result = aggregateReportData([], 'type')
      expect(result.total).toBe(0)
      expect(result.count).toBe(0)
      expect(result.byGroup).toEqual([])
    })

    it('should aggregate by group correctly', () => {
      const records = [
        { type: 'A', value: 100 },
        { type: 'A', value: 200 },
        { type: 'B', value: 150 },
      ]
      const result = aggregateReportData(records, 'type')
      expect(result.total).toBe(450)
      expect(result.count).toBe(3)
      expect(result.byGroup).toHaveLength(2)
    })

    it('should handle numeric fields correctly', () => {
      const records = [
        { type: 'A', qty: 10, cost: 100 },
        { type: 'B', qty: 5, cost: 50 },
      ]
      const result = aggregateReportData(records, 'type')
      expect(result.byGroup.find((g) => g.group === 'A')?.value).toBe(110)
      expect(result.byGroup.find((g) => g.group === 'B')?.value).toBe(55)
    })
  })

  describe('formatReportOutput', () => {
    it('should return raw data for json format', () => {
      const data = { test: 'value' }
      expect(formatReportOutput(data, 'json')).toEqual(data)
    })

    it('should exclude records for summary format', () => {
      const data = { records: [1, 2, 3], summary: { total: 100 } }
      const result = formatReportOutput(data, 'summary')
      expect((result as any).records).toBeUndefined()
      expect((result as any).summary).toBeDefined()
    })

    it('should add metadata for detailed format', () => {
      const data = { test: 'value' }
      const result = formatReportOutput(data, 'detailed') as any
      expect(result.test).toBe('value')
      expect(result.generatedAt).toBeDefined()
      expect(result.version).toBe('1.0')
    })
  })

  describe('validateUpdateData', () => {
    it('should accept valid update data', () => {
      const result = validateUpdateData({ name: 'Updated Name' })
      expect(result).toBeNull()
    })

    it('should accept partial updates', () => {
      expect(validateUpdateData({ name: 'Test' })).toBeNull()
      expect(validateUpdateData({ includeCharts: false })).toBeNull()
      expect(validateUpdateData({})).toBeNull()
    })

    it('should reject empty name', () => {
      expect(validateUpdateData({ name: '' })).toBe(
        'Report name cannot be empty',
      )
      expect(validateUpdateData({ name: '   ' })).toBe(
        'Report name cannot be empty',
      )
    })

    it('should reject name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101)
      expect(validateUpdateData({ name: longName })).toBe(
        'Report name cannot exceed 100 characters',
      )
    })

    it('should reject invalid report type', () => {
      expect(
        validateUpdateData({ reportType: 'invalid' as any }),
      ).toBe('Invalid report type')
    })

    it('should reject invalid date range type', () => {
      expect(
        validateUpdateData({ dateRangeType: 'invalid' as any }),
      ).toBe('Invalid date range type')
    })

    it('should reject custom date range without both dates', () => {
      expect(
        validateUpdateData({
          dateRangeType: 'custom',
          customStartDate: new Date(),
          customEndDate: null,
        }),
      ).toBe('Custom date range requires both start and end dates')
    })
  })

  describe('calculateLayingPercentage', () => {
    it('should calculate laying percentage correctly', () => {
      expect(calculateLayingPercentage(700, 100, 7)).toBe(100)
      expect(calculateLayingPercentage(350, 100, 7)).toBe(50)
    })

    it('should return 0 for zero layer birds', () => {
      expect(calculateLayingPercentage(100, 0, 7)).toBe(0)
    })

    it('should return 0 for zero days', () => {
      expect(calculateLayingPercentage(100, 100, 0)).toBe(0)
    })

    it('should round to 1 decimal place', () => {
      const result = calculateLayingPercentage(333, 100, 7)
      expect(result).toBe(47.6) // 333 / 700 = 0.4757... -> 47.6%
    })

    it('should always return eggs / (birds * days) * 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 365 }),
          (eggs, birds, days) => {
            const expected =
              birds > 0 && days > 0
                ? Math.round((eggs / (birds * days)) * 1000) / 10
                : 0
            expect(calculateLayingPercentage(eggs, birds, days)).toBe(expected)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('calculateEggInventory', () => {
    it('should calculate running inventory correctly', () => {
      const records = [
        { collected: 100, broken: 5, sold: 20 },
        { collected: 90, broken: 3, sold: 15 },
        { collected: 110, broken: 2, sold: 25 },
      ]
      const result = calculateEggInventory(records)

      // Reverse order for calculation, then reverse back
      // Last record (110-2-25=83): running = 83
      // Middle record (90-3-15=72): running = 83+72 = 155
      // First record (100-5-20=75): running = 155+75 = 230
      expect(result[0].inventory).toBe(230)
      expect(result[1].inventory).toBe(155)
      expect(result[2].inventory).toBe(83)
    })

    it('should handle empty records', () => {
      const result = calculateEggInventory([])
      expect(result).toEqual([])
    })

    it('should preserve original values', () => {
      const records = [
        { collected: 100, broken: 5, sold: 20 },
        { collected: 90, broken: 3, sold: 15 },
      ]
      const result = calculateEggInventory(records)

      // Results are reversed back to original order
      expect(result[0].collected).toBe(100)
      expect(result[0].broken).toBe(5)
      expect(result[0].sold).toBe(20)
      expect(result[1].collected).toBe(90)
      expect(result[1].broken).toBe(3)
      expect(result[1].sold).toBe(15)
    })

    it('should calculate inventory from end to start', () => {
      const records = [
        { collected: 50, broken: 0, sold: 0 },
        { collected: 50, broken: 0, sold: 0 },
      ]
      const result = calculateEggInventory(records)

      // Day 1: +50 = 50
      // Day 2: +50 = 50, running = 50+50 = 100
      expect(result[0].inventory).toBe(100)
      expect(result[1].inventory).toBe(50)
    })
  })
})
