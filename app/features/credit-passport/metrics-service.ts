/**
 * Pure business logic for credit passport financial metrics.
 * All functions are side-effect-free and easily unit testable.
 */

import { differenceInMonths } from 'date-fns'
import { toNumber } from '~/features/settings/currency'
import { calculateFCR } from '~/features/batches/service'

/**
 * Sale record structure from database
 */
export interface SaleRecord {
  totalAmount: string
  livestockType: string
  date: Date
  customerId: string
}

/**
 * Expense record structure from database
 */
export interface ExpenseRecord {
  amount: string
  category: string
  date: Date
}

/**
 * Batch record for operational metrics
 */
export interface OperationalBatchRecord {
  id: string
  initialQuantity: number
  currentQuantity: number
  target_weight_g: number | null
}

/**
 * Feed record structure from database
 */
export interface FeedRecord {
  batchId: string
  quantityKg: string
}

/**
 * Weight sample record structure from database
 */
export interface WeightRecord {
  batchId: string
  averageWeightG: number
  sampleSize: number
}

/**
 * Batch record for asset summary
 */
export interface AssetBatchRecord {
  livestockType: string
  currentQuantity: number
  targetPricePerUnit: string | null
  status: 'active' | 'depleted' | 'sold'
}

/**
 * Batch record for track record calculation
 */
export interface TrackRecordBatchRecord {
  acquisitionDate: Date
  status: 'active' | 'depleted' | 'sold'
  initialQuantity: number
  target_weight_g: number | null
}

/**
 * Structure record structure from database
 */
export interface StructureRecord {
  id: string
}

/**
 * Market price record structure from database
 */
export interface MarketPriceRecord {
  livestockType: string
  pricePerUnit: string
}

/**
 * Input parameters for financial metrics calculation
 */
export interface MetricsInput {
  sales: Array<SaleRecord>
  expenses: Array<ExpenseRecord>
  startDate: Date
  endDate: Date
}

/**
 * Financial metrics output
 */
export interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  profit: number
  profitMargin: number
  cashFlowByMonth: Record<string, number>
  revenueByType: Record<string, number>
  expensesByCategory: Record<string, number>
}

/**
 * Input parameters for operational metrics calculation
 */
export interface OperationalMetricsInput {
  batches: Array<OperationalBatchRecord>
  feedRecords: Array<FeedRecord>
  weightSamples: Array<WeightRecord>
}

/**
 * Operational metrics output
 */
export interface OperationalMetrics {
  avgFCR: number | null
  avgMortalityRate: number
  growthPerformanceIndex: number
  batchCount: number
}

/**
 * Calculate comprehensive financial metrics for credit passport
 *
 * @param input - Sales, expenses, and date range
 * @returns Financial metrics including revenue, expenses, profit, and trends
 *
 * @example
 * ```ts
 * const metrics = calculateFinancialMetrics({
 *   sales: [{ totalAmount: "1000.00", livestockType: "poultry", date: new Date() }],
 *   expenses: [{ amount: "500.00", category: "feed", date: new Date() }],
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31')
 * })
 * // Returns: { totalRevenue: 1000, totalExpenses: 500, profit: 500, profitMargin: 50, ... }
 * ```
 */
export function calculateFinancialMetrics(
  input: MetricsInput,
): FinancialMetrics {
  const { sales, expenses, startDate, endDate } = input

  // Filter records by date range
  const filteredSales = sales.filter(
    (sale) => sale.date >= startDate && sale.date <= endDate,
  )
  const filteredExpenses = expenses.filter(
    (expense) => expense.date >= startDate && expense.date <= endDate,
  )

  // Calculate total revenue
  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + toNumber(sale.totalAmount),
    0,
  )

  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + toNumber(expense.amount),
    0,
  )

  // Calculate profit
  const profit = totalRevenue - totalExpenses

  // Calculate profit margin (handle zero revenue and NaN edge cases)
  let profitMargin = totalRevenue === 0 ? 0 : (profit / totalRevenue) * 100
  if (!isFinite(profitMargin)) profitMargin = 0

  // Calculate cash flow by month
  const cashFlowByMonth = calculateCashFlowByMonth(
    filteredSales,
    filteredExpenses,
  )

  // Calculate revenue by livestock type
  const revenueByType = calculateRevenueByType(filteredSales)

  // Calculate expenses by category
  const expensesByCategory = calculateExpensesByCategory(filteredExpenses)

  return {
    totalRevenue: isFinite(totalRevenue) ? totalRevenue : 0,
    totalExpenses: isFinite(totalExpenses) ? totalExpenses : 0,
    profit: isFinite(profit) ? profit : 0,
    profitMargin: isFinite(profitMargin) ? profitMargin : 0,
    cashFlowByMonth,
    revenueByType,
    expensesByCategory,
  }
}

/**
 * Calculate monthly cash flow trends
 *
 * @param sales - Filtered sales records
 * @param expenses - Filtered expense records
 * @returns Monthly cash flow (revenue - expenses) by month key
 */
function calculateCashFlowByMonth(
  sales: Array<SaleRecord>,
  expenses: Array<ExpenseRecord>,
): Record<string, number> {
  const monthlyData: Record<string, { revenue: number; expenses: number }> = {}

  // Aggregate sales by month
  sales.forEach((sale) => {
    // Skip invalid dates
    if (isNaN(sale.date.getTime())) return

    const amount = toNumber(sale.totalAmount)
    // Skip NaN amounts
    if (!isFinite(amount)) return

    const monthKey = `${sale.date.getFullYear()}-${String(sale.date.getMonth() + 1).padStart(2, '0')}`
    if (!(monthKey in monthlyData)) {
      monthlyData[monthKey] = { revenue: 0, expenses: 0 }
    }
    monthlyData[monthKey].revenue += amount
  })

  // Aggregate expenses by month
  expenses.forEach((expense) => {
    // Skip invalid dates
    if (isNaN(expense.date.getTime())) return

    const amount = toNumber(expense.amount)
    // Skip NaN amounts
    if (!isFinite(amount)) return

    const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`
    if (!(monthKey in monthlyData)) {
      monthlyData[monthKey] = { revenue: 0, expenses: 0 }
    }
    monthlyData[monthKey].expenses += amount
  })

  // Calculate cash flow (revenue - expenses) for each month
  const cashFlow: Record<string, number> = {}
  Object.entries(monthlyData).forEach(([month, data]) => {
    const flow = data.revenue - data.expenses
    cashFlow[month] = isFinite(flow) ? flow : 0
  })

  return cashFlow
}

/**
 * Calculate revenue breakdown by livestock type
 *
 * @param sales - Filtered sales records
 * @returns Revenue totals grouped by livestock type
 */
function calculateRevenueByType(
  sales: Array<SaleRecord>,
): Record<string, number> {
  const revenueByType: Record<string, number> = {}

  sales.forEach((sale) => {
    const type = sale.livestockType
    if (!revenueByType[type]) {
      revenueByType[type] = 0
    }
    revenueByType[type] += toNumber(sale.totalAmount)
  })

  return revenueByType
}

/**
 * Calculate expenses breakdown by category
 *
 * @param expenses - Filtered expense records
 * @returns Expense totals grouped by category
 */
function calculateExpensesByCategory(
  expenses: Array<ExpenseRecord>,
): Record<string, number> {
  const expensesByCategory: Record<string, number> = {}

  expenses.forEach((expense) => {
    const category = expense.category
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = 0
    }
    expensesByCategory[category] += toNumber(expense.amount)
  })

  return expensesByCategory
}

/**
 * Calculate operational metrics for credit passport
 *
 * @param input - Batches, feed records, and weight samples
 * @returns Operational metrics including FCR, mortality rate, and growth performance
 *
 * @example
 * ```ts
 * const metrics = calculateOperationalMetrics({
 *   batches: [{ id: "1", initialQuantity: 100, currentQuantity: 95, target_weight_g: 2000 }],
 *   feedRecords: [{ batchId: "1", quantityKg: "150.00" }],
 *   weightSamples: [{ batchId: "1", averageWeightG: 1800, sampleSize: 10 }]
 * })
 * // Returns: { avgFCR: 1.58, avgMortalityRate: 5.0, growthPerformanceIndex: 90.0, batchCount: 1 }
 * ```
 */
export function calculateOperationalMetrics(
  input: OperationalMetricsInput,
): OperationalMetrics {
  const { batches, feedRecords, weightSamples } = input

  const batchCount = batches.length
  if (batchCount === 0) {
    return {
      avgFCR: null,
      avgMortalityRate: 0,
      growthPerformanceIndex: 0,
      batchCount: 0,
    }
  }

  // Calculate total feed consumption
  const totalFeedKg = feedRecords.reduce(
    (sum, record) => sum + toNumber(record.quantityKg),
    0,
  )

  // Calculate total weight gain (assuming initial weight is 0 for simplicity)
  const totalWeightGainKg = weightSamples.reduce((sum, sample) => {
    return sum + (sample.averageWeightG * sample.sampleSize) / 1000 // Convert g to kg
  }, 0)

  // Calculate FCR using existing function
  const avgFCR = calculateFCR(totalFeedKg, totalWeightGainKg)

  // Calculate average mortality rate
  const totalMortalityRate = batches.reduce((sum, batch) => {
    const mortalityRate =
      batch.initialQuantity > 0
        ? ((batch.initialQuantity - batch.currentQuantity) /
            batch.initialQuantity) *
          100
        : 0
    return sum + mortalityRate
  }, 0)
  const avgMortalityRate = totalMortalityRate / batchCount

  // Calculate growth performance index
  const totalPerformanceIndex = batches.reduce((sum, batch) => {
    if (!batch.target_weight_g) return sum

    const batchWeightSample = weightSamples.find(
      (sample) => sample.batchId === batch.id,
    )
    if (!batchWeightSample) return sum

    const performanceIndex =
      (batchWeightSample.averageWeightG / batch.target_weight_g) * 100
    return sum + performanceIndex
  }, 0)

  const batchesWithTargets = batches.filter(
    (batch) =>
      batch.target_weight_g &&
      weightSamples.some((sample) => sample.batchId === batch.id),
  ).length

  const growthPerformanceIndex =
    batchesWithTargets > 0 ? totalPerformanceIndex / batchesWithTargets : 0

  return {
    avgFCR,
    avgMortalityRate,
    growthPerformanceIndex,
    batchCount,
  }
}

/**
 * Calculate track record metrics for credit passport
 *
 * @param input - Batches, sales, and report date
 * @returns Track record metrics including operating months, completion rates, and customer count
 */
export function calculateTrackRecord(input: {
  batches: Array<TrackRecordBatchRecord>
  sales: Array<SaleRecord>
  reportDate: Date
}): {
  monthsOperating: number
  batchesCompleted: number
  productionVolume: number
  successRate: number
  uniqueCustomers: number
} {
  const { batches, sales, reportDate } = input

  // Filter out batches with invalid dates
  const validBatches = batches.filter(
    (b) => !isNaN(b.acquisitionDate.getTime()),
  )

  // Handle empty or all-invalid batches
  if (validBatches.length === 0) {
    return {
      monthsOperating: 0,
      batchesCompleted: 0,
      productionVolume: 0,
      successRate: 0,
      uniqueCustomers: new Set(sales.map((s) => s.customerId)).size,
    }
  }

  // Months operating: from earliest batch acquisition date to report date
  const earliestDate = validBatches.reduce(
    (earliest, batch) =>
      batch.acquisitionDate < earliest ? batch.acquisitionDate : earliest,
    validBatches[0].acquisitionDate,
  )
  const monthsOperating = Math.max(
    0,
    differenceInMonths(reportDate, earliestDate),
  )

  // Batches completed: count where status = 'sold' or 'depleted'
  const completedBatches = validBatches.filter(
    (b) => b.status === 'sold' || b.status === 'depleted',
  )
  const batchesCompleted = completedBatches.length

  // Production volume: sum of initialQuantity for completed batches
  const productionVolume = completedBatches.reduce(
    (sum, batch) => sum + batch.initialQuantity,
    0,
  )

  // Batch success rate: batches reaching target weight / total batches * 100
  const batchesWithTarget = validBatches.filter(
    (b) => b.target_weight_g !== null,
  )
  const successRate =
    batchesWithTarget.length === 0
      ? 0
      : (batchesWithTarget.filter((b) => b.status === 'sold').length /
          batchesWithTarget.length) *
        100

  // Unique customers: count distinct customer IDs from sales
  const uniqueCustomers = new Set(sales.map((s) => s.customerId)).size

  return {
    monthsOperating: isFinite(monthsOperating) ? monthsOperating : 0,
    batchesCompleted,
    productionVolume,
    successRate: isFinite(successRate) ? successRate : 0,
    uniqueCustomers,
  }
}

/**
 * Asset summary output
 */
export interface AssetSummary {
  batchesByType: Record<string, number>
  totalInventoryValue: number
  structureCount: number
  totalLivestock: number
}

/**
 * Track record metrics output
 */
export interface TrackRecord {
  monthsOperating: number
  batchesCompleted: number
  productionVolume: number
  successRate: number
  uniqueCustomers: number
}

/**
 * Credit score output
 */
export interface CreditScore {
  score: number
  grade: string
  breakdown: Record<string, number>
}

/**
 * Calculate asset summary for credit passport
 *
 * @param input - Batches, structures, and optional market prices
 * @returns Asset summary including batch counts, inventory value, and livestock totals
 */
export function calculateAssetSummary(input: {
  batches: Array<AssetBatchRecord>
  structures: Array<StructureRecord>
  marketPrices?: Array<MarketPriceRecord>
}): AssetSummary {
  const { batches, structures, marketPrices = [] } = input

  // Filter active batches
  const activeBatches = batches.filter((batch) => batch.status === 'active')

  // Count batches by livestock type
  const batchesByType: Record<string, number> = {}
  activeBatches.forEach((batch) => {
    batchesByType[batch.livestockType] =
      (batchesByType[batch.livestockType] || 0) + 1
  })

  // Create market price lookup
  const marketPriceMap = new Map<string, number>()
  marketPrices.forEach((price) => {
    marketPriceMap.set(price.livestockType, toNumber(price.pricePerUnit))
  })

  // Calculate total inventory value
  const totalInventoryValue = activeBatches.reduce((sum, batch) => {
    const marketPrice = marketPriceMap.get(batch.livestockType)
    const targetPrice = batch.targetPricePerUnit
      ? toNumber(batch.targetPricePerUnit)
      : 0
    const price = marketPrice ?? targetPrice

    // Guard against NaN
    if (!isFinite(price)) return sum

    return sum + batch.currentQuantity * price
  }, 0)

  // Count structures
  const structureCount = structures.length

  // Sum total livestock
  const totalLivestock = activeBatches.reduce(
    (sum, batch) => sum + batch.currentQuantity,
    0,
  )

  return {
    batchesByType,
    totalInventoryValue,
    structureCount,
    totalLivestock,
  }
}

/**
 * Calculate credit score based on financial, operational, asset, and track record metrics
 *
 * @param input - Financial, operational, assets, and track record metrics
 * @returns Credit score with grade and breakdown
 *
 * @example
 * ```ts
 * const creditScore = calculateCreditScore({
 *   financial: { profitMargin: 25, totalRevenue: 100000, ... },
 *   operational: { avgFCR: 1.8, avgMortalityRate: 3.5, ... },
 *   assets: { totalInventoryValue: 50000, structureCount: 5, ... },
 *   trackRecord: { successRate: 85, monthsOperating: 24, ... }
 * })
 * // Returns: { score: 82, grade: "B", breakdown: { profitMargin: 75, trackRecord: 85, efficiency: 80, assets: 85 } }
 * ```
 */
export function calculateCreditScore(input: {
  financial: FinancialMetrics
  operational: OperationalMetrics
  assets: AssetSummary
  trackRecord: TrackRecord
}): CreditScore {
  const { financial, operational, assets, trackRecord } = input

  // Normalize profit margin (0-50% -> 0-100 scale)
  const profitMarginScore = isFinite(financial.profitMargin)
    ? Math.min(100, Math.max(0, (financial.profitMargin / 50) * 100))
    : 0

  // Normalize track record based on success rate and operating months
  const trackRecordScore = Math.min(
    100,
    trackRecord.successRate * 0.7 +
      (Math.min(trackRecord.monthsOperating, 36) / 36) * 30,
  )

  // Normalize efficiency (FCR + mortality rate)
  const fcrScore = operational.avgFCR
    ? Math.min(100, Math.max(0, ((3 - operational.avgFCR) / 2) * 100))
    : 0
  const mortalityScore = Math.min(
    100,
    Math.max(0, ((20 - operational.avgMortalityRate) / 20) * 100),
  )
  const efficiencyScore = (fcrScore + mortalityScore) / 2

  // Normalize assets (inventory value + structure count)
  const inventoryScore = Math.min(
    100,
    (assets.totalInventoryValue / 100000) * 100,
  )
  const structureScore = Math.min(100, (assets.structureCount / 10) * 100)
  const assetsScore = (inventoryScore + structureScore) / 2

  // Apply weights: profit margin 30%, track record 25%, efficiency 25%, assets 20%
  const weightedScore =
    profitMarginScore * 0.3 +
    trackRecordScore * 0.25 +
    efficiencyScore * 0.25 +
    assetsScore * 0.2

  const score = Math.round(weightedScore)

  // Assign grade
  let grade: string
  if (score >= 90) grade = 'A'
  else if (score >= 80) grade = 'B'
  else if (score >= 70) grade = 'C'
  else if (score >= 60) grade = 'D'
  else grade = 'F'

  return {
    score,
    grade,
    breakdown: {
      profitMargin: Math.round(profitMarginScore),
      trackRecord: Math.round(trackRecordScore),
      efficiency: Math.round(efficiencyScore),
      assets: Math.round(assetsScore),
    },
  }
}
