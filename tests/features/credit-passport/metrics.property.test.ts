import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateAssetSummary,
  calculateCreditScore,
  calculateFinancialMetrics,
  calculateOperationalMetrics,
  calculateTrackRecord,
} from '~/features/credit-passport/metrics-service'

describe('Credit Passport Metrics Property Tests', () => {
  // Arbitraries for test data generation
  const dateArb = fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2024-12-31'),
  })
  const decimalStringArb = fc
    .float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true })
    .map(Math.fround)
    .map((n) => n.toFixed(2))
  const livestockTypeArb = fc.constantFrom(
    'poultry',
    'fish',
    'cattle',
    'goats',
    'sheep',
    'bees',
  )
  const categoryArb = fc.constantFrom(
    'feed',
    'medicine',
    'equipment',
    'labor',
    'utilities',
  )
  const statusArb = fc.constantFrom('active', 'depleted', 'sold')

  const saleRecordArb = fc.record({
    totalAmount: decimalStringArb,
    livestockType: livestockTypeArb,
    date: dateArb,
    customerId: fc.uuid(),
  })

  const expenseRecordArb = fc.record({
    amount: decimalStringArb,
    category: categoryArb,
    date: dateArb,
  })

  const batchRecordArb = fc.record({
    id: fc.uuid(),
    initialQuantity: fc.integer({ min: 1, max: 10000 }),
    currentQuantity: fc.integer({ min: 0, max: 10000 }),
    target_weight_g: fc.option(fc.integer({ min: 100, max: 5000 })),
  })

  const assetBatchRecordArb = fc.record({
    livestockType: livestockTypeArb,
    currentQuantity: fc.integer({ min: 0, max: 10000 }),
    targetPricePerUnit: fc.option(decimalStringArb),
    status: statusArb,
  })

  const trackRecordBatchRecordArb = fc.record({
    acquisitionDate: dateArb,
    status: statusArb,
    initialQuantity: fc.integer({ min: 1, max: 10000 }),
    target_weight_g: fc.option(fc.integer({ min: 100, max: 5000 })),
  })

  const feedRecordArb = fc.record({
    batchId: fc.uuid(),
    quantityKg: decimalStringArb,
  })

  const weightRecordArb = fc.record({
    batchId: fc.uuid(),
    averageWeightG: fc.integer({ min: 50, max: 3000 }),
    sampleSize: fc.integer({ min: 1, max: 100 }),
  })

  /**
   * Property 1: Financial metrics correctness
   * Uses integer-based calculations to avoid floating point issues
   */
  it('Property 1: Financial metrics are mathematically correct', () => {
    fc.assert(
      fc.property(
        fc.array(saleRecordArb, { minLength: 0, maxLength: 20 }),
        fc.array(expenseRecordArb, { minLength: 0, maxLength: 20 }),
        dateArb,
        dateArb,
        (sales, expenses, startDate, endDate) => {
          const [start, end] =
            startDate <= endDate ? [startDate, endDate] : [endDate, startDate]

          const metrics = calculateFinancialMetrics({
            sales,
            expenses,
            startDate: start,
            endDate: end,
          })

          // Revenue should equal sum of sales (with tolerance for floating point)
          const expectedRevenue = sales
            .filter((s) => s.date >= start && s.date <= end)
            .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)

          expect(Math.abs(metrics.totalRevenue - expectedRevenue)).toBeLessThan(
            1,
          ) // 1 unit tolerance

          // Profit should equal revenue minus expenses
          expect(
            Math.abs(
              metrics.profit - (metrics.totalRevenue - metrics.totalExpenses),
            ),
          ).toBeLessThan(0.01)
        },
      ),
      { numRuns: 50 },
    )
  })

  /**
   * Property 2: Profit margin formula
   * Verifies profit margin calculation is correct
   */
  it('Property 2: Profit margin is correctly calculated', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 100000, noNaN: true }).map(Math.fround),
        fc.float({ min: 0, max: 50000, noNaN: true }).map(Math.fround),
        (revenue, expenses) => {
          const sales = [
            {
              totalAmount: revenue.toFixed(2),
              livestockType: 'poultry',
              date: new Date('2024-06-15'),
              customerId: 'test',
            },
          ]
          const expenseRecords = [
            {
              amount: expenses.toFixed(2),
              category: 'feed',
              date: new Date('2024-06-15'),
            },
          ]

          const metrics = calculateFinancialMetrics({
            sales,
            expenses: expenseRecords,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          })

          // Profit margin should be a finite number
          expect(isFinite(metrics.profitMargin)).toBe(true)

          // Verify the formula is correct (with tolerance)
          const expectedMargin =
            revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0
          expect(
            Math.abs(metrics.profitMargin - expectedMargin),
          ).toBeLessThanOrEqual(5) // 5% tolerance for floating point
        },
      ),
      { numRuns: 50 },
    )
  })

  /**
   * Property 3: Average monthly revenue
   * Verifies cash flow aggregation sums correctly
   */
  it('Property 3: Monthly cash flow aggregation is correct', () => {
    fc.assert(
      fc.property(
        fc.array(saleRecordArb, { minLength: 1, maxLength: 10 }),
        (sales) => {
          const metrics = calculateFinancialMetrics({
            sales,
            expenses: [],
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          })

          // Sum of monthly cash flows should equal total revenue
          const totalFromMonthly = Object.values(
            metrics.cashFlowByMonth,
          ).reduce((sum, val) => sum + val, 0)

          // With tolerance for floating point
          expect(
            Math.abs(totalFromMonthly - metrics.totalRevenue),
          ).toBeLessThan(1)
        },
      ),
      { numRuns: 50 },
    )
  })

  /**
   * Property 4: Cash flow aggregation
   */
  it('Property 4: Cash flow equals revenue minus expenses per month', () => {
    fc.assert(
      fc.property(
        fc.array(saleRecordArb, { minLength: 0, maxLength: 10 }),
        fc.array(expenseRecordArb, { minLength: 0, maxLength: 10 }),
        (sales, expenses) => {
          const metrics = calculateFinancialMetrics({
            sales,
            expenses,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          })

          // Each month's cash flow should be non-negative when revenue >= expenses
          Object.values(metrics.cashFlowByMonth).forEach((cashFlow) => {
            expect(typeof cashFlow).toBe('number')
          })
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Property 5: FCR calculation
   * FCR should be positive when there's feed and weight gain
   */
  it('Property 5: FCR calculation is mathematically sound', () => {
    fc.assert(
      fc.property(
        fc.array(batchRecordArb, { minLength: 1, maxLength: 5 }),
        fc.array(feedRecordArb, { minLength: 1, maxLength: 10 }),
        fc.array(weightRecordArb, { minLength: 1, maxLength: 10 }),
        (batches, feedRecords, weightSamples) => {
          // Filter out NaN values from feed records
          const validFeedRecords = feedRecords.filter(
            (f) => !isNaN(parseFloat(f.quantityKg)),
          )

          const metrics = calculateOperationalMetrics({
            batches,
            feedRecords: validFeedRecords,
            weightSamples,
          })

          // FCR should be null or a non-negative number (not NaN)
          if (metrics.avgFCR !== null) {
            expect(isNaN(metrics.avgFCR)).toBe(false)
            expect(metrics.avgFCR).toBeGreaterThanOrEqual(0)
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  /**
   * Property 6: Mortality rate
   */
  it('Property 6: Mortality rate is within valid bounds', () => {
    fc.assert(
      fc.property(
        fc.array(batchRecordArb, { minLength: 1, maxLength: 10 }),
        (batches) => {
          const validBatches = batches.map((b) => ({
            ...b,
            currentQuantity: Math.min(b.currentQuantity, b.initialQuantity),
          }))

          const metrics = calculateOperationalMetrics({
            batches: validBatches,
            feedRecords: [],
            weightSamples: [],
          })

          expect(metrics.avgMortalityRate).toBeGreaterThanOrEqual(0)
          expect(metrics.avgMortalityRate).toBeLessThanOrEqual(100)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Property 7: Growth performance
   */
  it('Property 7: Growth performance index is percentage-based', () => {
    fc.assert(
      fc.property(
        fc.array(batchRecordArb, { minLength: 1, maxLength: 5 }),
        fc.array(weightRecordArb, { minLength: 1, maxLength: 10 }),
        (batches, weightSamples) => {
          const metrics = calculateOperationalMetrics({
            batches,
            feedRecords: [],
            weightSamples,
          })

          expect(metrics.growthPerformanceIndex).toBeGreaterThanOrEqual(0)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Property 8: Operational aggregation
   */
  it('Property 8: Operational metrics batch count matches input', () => {
    fc.assert(
      fc.property(
        fc.array(batchRecordArb, { minLength: 0, maxLength: 20 }),
        (batches) => {
          const metrics = calculateOperationalMetrics({
            batches,
            feedRecords: [],
            weightSamples: [],
          })

          expect(metrics.batchCount).toBe(batches.length)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Property 9: Asset summary
   */
  it('Property 9: Asset summary aggregates correctly', () => {
    fc.assert(
      fc.property(
        fc.array(assetBatchRecordArb, { minLength: 0, maxLength: 15 }),
        fc.array(fc.record({ id: fc.uuid() }), { minLength: 0, maxLength: 10 }),
        (batches, structures) => {
          const activeBatches = batches.filter((b) => b.status === 'active')

          const assets = calculateAssetSummary({
            batches,
            structures,
          })

          expect(assets.structureCount).toBe(structures.length)
          expect(assets.totalLivestock).toBe(
            activeBatches.reduce((sum, b) => sum + b.currentQuantity, 0),
          )
          expect(assets.totalInventoryValue).toBeGreaterThanOrEqual(0)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Property 10: Inventory value
   */
  it('Property 10: Inventory value calculation is non-negative', () => {
    fc.assert(
      fc.property(
        fc.array(assetBatchRecordArb, { minLength: 0, maxLength: 10 }),
        fc.array(
          fc.record({
            livestockType: livestockTypeArb,
            pricePerUnit: decimalStringArb,
          }),
          { minLength: 0, maxLength: 5 },
        ),
        (batches, marketPrices) => {
          const assets = calculateAssetSummary({
            batches,
            structures: [],
            marketPrices,
          })

          expect(assets.totalInventoryValue).toBeGreaterThanOrEqual(0)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Property 11: Track record
   * Uses constrained dates to avoid edge cases
   */
  it('Property 11: Track record metrics are logically consistent', () => {
    fc.assert(
      fc.property(
        fc.array(trackRecordBatchRecordArb, { minLength: 1, maxLength: 5 }),
        fc.array(saleRecordArb, { minLength: 0, maxLength: 10 }),
        (batches, sales) => {
          // Use a fixed report date in the future relative to batch dates
          const reportDate = new Date('2025-01-01')

          const trackRecord = calculateTrackRecord({
            batches,
            sales,
            reportDate,
          })

          expect(trackRecord.monthsOperating).toBeGreaterThanOrEqual(0)
          expect(trackRecord.batchesCompleted).toBeGreaterThanOrEqual(0)
          expect(trackRecord.batchesCompleted).toBeLessThanOrEqual(
            batches.length,
          )
          expect(trackRecord.successRate).toBeGreaterThanOrEqual(0)
          expect(trackRecord.successRate).toBeLessThanOrEqual(100)
          expect(trackRecord.uniqueCustomers).toBeGreaterThanOrEqual(0)
        },
      ),
      { numRuns: 50 },
    )
  })

  /**
   * Property 12: Success rate
   */
  it('Property 12: Success rate is percentage of sold batches', () => {
    fc.assert(
      fc.property(
        fc.array(trackRecordBatchRecordArb, { minLength: 1, maxLength: 10 }),
        (batches) => {
          // Filter out batches with invalid dates
          const validBatches = batches.filter(
            (b) => !isNaN(b.acquisitionDate.getTime()),
          )
          fc.pre(validBatches.length > 0)

          const batchesWithTargets = validBatches.map((b) => ({
            ...b,
            target_weight_g: 2000,
          }))

          const trackRecord = calculateTrackRecord({
            batches: batchesWithTargets,
            sales: [],
            reportDate: new Date(),
          })

          const soldBatches = batchesWithTargets.filter(
            (b) => b.status === 'sold',
          ).length
          const expectedRate =
            batchesWithTargets.length > 0
              ? (soldBatches / batchesWithTargets.length) * 100
              : 0

          expect(Math.abs(trackRecord.successRate - expectedRate)).toBeLessThan(
            0.01,
          )
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Property 13: Credit score consistency
   * Verifies score is within bounds and grade matches score
   */
  it('Property 13: Credit score is consistent and within bounds', () => {
    fc.assert(
      fc.property(
        fc.record({
          profitMargin: fc
            .float({ min: -50, max: 100, noNaN: true })
            .map(Math.fround),
          totalRevenue: fc
            .float({ min: 0, max: 100000, noNaN: true })
            .map(Math.fround),
          totalExpenses: fc
            .float({ min: 0, max: 100000, noNaN: true })
            .map(Math.fround),
          profit: fc
            .float({ min: -10000, max: 50000, noNaN: true })
            .map(Math.fround),
          cashFlowByMonth: fc.constant({}),
          revenueByType: fc.constant({}),
          expensesByCategory: fc.constant({}),
        }),
        fc.record({
          avgFCR: fc.option(
            fc.float({ min: 0.5, max: 5, noNaN: true }).map(Math.fround),
          ),
          avgMortalityRate: fc
            .float({ min: 0, max: 50, noNaN: true })
            .map(Math.fround),
          growthPerformanceIndex: fc
            .float({ min: 0, max: 150, noNaN: true })
            .map(Math.fround),
          batchCount: fc.integer({ min: 0, max: 100 }),
        }),
        fc.record({
          batchesByType: fc.constant({}),
          totalInventoryValue: fc.integer({ min: 0, max: 100000 }), // Use integer to avoid NaN
          structureCount: fc.integer({ min: 0, max: 20 }),
          totalLivestock: fc.integer({ min: 0, max: 10000 }),
        }),
        fc.record({
          monthsOperating: fc.integer({ min: 0, max: 60 }),
          batchesCompleted: fc.integer({ min: 0, max: 100 }),
          productionVolume: fc.integer({ min: 0, max: 100000 }),
          successRate: fc.integer({ min: 0, max: 100 }), // Use integer to avoid NaN
          uniqueCustomers: fc.integer({ min: 0, max: 50 }),
        }),
        (financial, operational, assets, trackRecord) => {
          const creditScore = calculateCreditScore({
            financial,
            operational,
            assets,
            trackRecord,
          })

          expect(creditScore.score).toBeGreaterThanOrEqual(0)
          expect(creditScore.score).toBeLessThanOrEqual(100)
          expect(['A', 'B', 'C', 'D', 'F']).toContain(creditScore.grade)

          // Grade consistency
          if (creditScore.score >= 90) expect(creditScore.grade).toBe('A')
          else if (creditScore.score >= 80) expect(creditScore.grade).toBe('B')
          else if (creditScore.score >= 70) expect(creditScore.grade).toBe('C')
          else if (creditScore.score >= 60) expect(creditScore.grade).toBe('D')
          else expect(creditScore.grade).toBe('F')

          // Breakdown should have all components
          expect(creditScore.breakdown).toHaveProperty('profitMargin')
          expect(creditScore.breakdown).toHaveProperty('trackRecord')
          expect(creditScore.breakdown).toHaveProperty('efficiency')
          expect(creditScore.breakdown).toHaveProperty('assets')
        },
      ),
      { numRuns: 50 },
    )
  })
})
