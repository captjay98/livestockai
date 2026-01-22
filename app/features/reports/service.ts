/**
 * Pure business logic for report operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { DateRange } from './server'

/**
 * Report configuration data for creation
 */
export interface ReportConfigData {
  name: string
  farmId: string
  reportType: 'profit_loss' | 'inventory' | 'sales' | 'feed' | 'egg'
  dateRangeType: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  customStartDate?: Date | null
  customEndDate?: Date | null
  includeCharts: boolean
  includeDetails: boolean
}

/**
 * Report configuration data for updates
 */
export interface UpdateReportConfigData {
  name?: string
  reportType?: 'profit_loss' | 'inventory' | 'sales' | 'feed' | 'egg'
  dateRangeType?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  customStartDate?: Date | null
  customEndDate?: Date | null
  includeCharts?: boolean
  includeDetails?: boolean
}

/**
 * Validate report configuration data before creation
 * Returns validation error message or null if valid
 *
 * @param data - Report configuration data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateReportConfig({
 *   name: 'Monthly Sales Report',
 *   farmId: 'farm-1',
 *   reportType: 'sales',
 *   dateRangeType: 'month',
 *   includeCharts: true,
 *   includeDetails: true
 * })
 * // Returns: null (valid)
 * ```
 */
export function validateReportConfig(data: ReportConfigData): string | null {
  if (!data.name || data.name.trim() === '') {
    return 'Report name is required'
  }

  if (data.name.length > 100) {
    return 'Report name cannot exceed 100 characters'
  }

  if (!data.farmId || data.farmId.trim() === '') {
    return 'Farm ID is required'
  }

  const validReportTypes = [
    'profit_loss',
    'inventory',
    'sales',
    'feed',
    'egg',
  ] as const

  if (!(validReportTypes as ReadonlyArray<string>).includes(data.reportType)) {
    return 'Invalid report type'
  }

  const validDateRangeTypes = [
    'today',
    'week',
    'month',
    'quarter',
    'year',
    'custom',
  ] as const

  if (!validDateRangeTypes.includes(data.dateRangeType)) {
    return 'Invalid date range type'
  }

  if (
    data.dateRangeType === 'custom' &&
    (!data.customStartDate || !data.customEndDate)
  ) {
    return 'Custom date range requires both start and end dates'
  }

  if (data.dateRangeType === 'custom') {
    if (
      isNaN(data.customStartDate!.getTime()) ||
      isNaN(data.customEndDate!.getTime())
    ) {
      return 'Custom dates must be valid dates'
    }

    if (data.customStartDate! > data.customEndDate!) {
      return 'Start date must be before or equal to end date'
    }
  }

  return null
}

/**
 * Calculate date range based on period type
 * Returns start and end dates for the specified period
 *
 * @param period - The period type ('today', 'week', 'month', 'quarter', 'year', or 'custom')
 * @param customStartDate - Optional custom start date for 'custom' period
 * @param customEndDate - Optional custom end date for 'custom' period
 * @returns DateRange with startDate and endDate
 *
 * @example
 * ```ts
 * const range = calculateDateRange('month')
 * // Returns: { startDate: Date, endDate: Date } for current month
 * ```
 */
export function calculateDateRange(
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
  customStartDate?: Date | null,
  customEndDate?: Date | null,
): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return {
        startDate: today,
        endDate: today,
      }

    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return {
        startDate: weekAgo,
        endDate: today,
      }
    }

    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        startDate: monthStart,
        endDate: today,
      }
    }

    case 'quarter': {
      const quarter = Math.floor(today.getMonth() / 3)
      const quarterStart = new Date(today.getFullYear(), quarter * 3, 1)
      return {
        startDate: quarterStart,
        endDate: today,
      }
    }

    case 'year': {
      const yearStart = new Date(today.getFullYear(), 0, 1)
      return {
        startDate: yearStart,
        endDate: today,
      }
    }

    case 'custom':
      return {
        startDate: customStartDate || today,
        endDate: customEndDate || today,
      }

    default:
      return {
        startDate: today,
        endDate: today,
      }
  }
}

/**
 * Aggregate report data by category or type
 * Takes raw report records and produces summarized data
 *
 * @param records - Array of records with numeric values
 * @param groupBy - Field name to group by
 * @returns Aggregated data with totals and groupings
 *
 * @example
 * ```ts
 * const aggregated = aggregateReportData(sales, 'livestockType')
 * // Returns: { total: 1000, byType: [...] }
 * ```
 */
export function aggregateReportData<
  T extends Record<string, unknown>,
  TKey extends keyof T,
>(
  records: Array<T>,
  groupBy: TKey,
): {
  total: number
  count: number
  byGroup: Array<{ group: string; value: number; count: number }>
} {
  if (records.length === 0) {
    return {
      total: 0,
      count: 0,
      byGroup: [],
    }
  }

  const groupMap = new Map<
    string,
    { value: number; count: number }
  >()

  for (const record of records) {
    const group = String(record[groupBy])
    const existing = groupMap.get(group) || { value: 0, count: 0 }

    // Sum all numeric fields except the group key
    let recordValue = 0
    for (const [key, val] of Object.entries(record)) {
      if (key !== groupBy && typeof val === 'number') {
        recordValue += val
      }
    }

    groupMap.set(group, {
      value: existing.value + recordValue,
      count: existing.count + 1,
    })
  }

  const byGroup = Array.from(groupMap.entries()).map(([group, data]) => ({
    group,
    value: Math.round(data.value * 100) / 100,
    count: data.count,
  }))

  const total = byGroup.reduce((sum, g) => sum + g.value, 0)

  return {
    total: Math.round(total * 100) / 100,
    count: records.length,
    byGroup,
  }
}

/**
 * Format report output for different output types
 *
 * @param data - The report data to format
 * @param format - Output format ('json', 'summary', 'detailed')
 * @returns Formatted report output
 *
 * @example
 * ```ts
 * const output = formatReportOutput(report, 'summary')
 * // Returns: condensed summary view
 * ```
 */
export function formatReportOutput<T extends object>(
  data: T,
  format: 'json' | 'summary' | 'detailed',
): object {
  switch (format) {
    case 'json':
      return data

    case 'summary':
      // Extract key metrics for summary view
      if ('summary' in data && typeof data.summary === 'object') {
        return {
          ...data,
          records: undefined,
          data: undefined,
        }
      }
      return { ...data }

    case 'detailed':
      // Include all data with additional metadata
      return {
        ...data,
        generatedAt: new Date().toISOString(),
        version: '1.0',
      }

    default:
      return data
  }
}

/**
 * Calculate profit margin percentage
 *
 * @param revenue - Total revenue
 * @param expenses - Total expenses
 * @returns Profit margin as percentage (can be negative)
 *
 * @example
 * ```ts
 * const margin = calculateProfitMargin(1000, 800)
 * // Returns: 20 (20% margin)
 * ```
 */
export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue <= 0) {
    return 0
  }

  const profit = revenue - expenses
  const margin = (profit / revenue) * 100

  return Math.round(margin * 10) / 10
}

/**
 * Calculate mortality rate for inventory
 *
 * @param initialQuantity - Starting quantity
 * @param currentQuantity - Current quantity
 * @returns Mortality rate as percentage, rounded to 1 decimal
 *
 * @example
 * ```ts
 * const rate = calculateMortalityRate(100, 95)
 * // Returns: 5.0 (5% mortality rate)
 * ```
 */
export function calculateMortalityRate(
  initialQuantity: number,
  currentQuantity: number,
): number {
  if (initialQuantity <= 0) {
    return 0
  }

  const mortality = initialQuantity - currentQuantity
  const rate = (mortality / initialQuantity) * 100

  return Math.round(rate * 10) / 10
}

/**
 * Validate update data for report configuration
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 */
export function validateUpdateData(
  data: UpdateReportConfigData,
): string | null {
  if (data.name !== undefined && data.name.trim() === '') {
    return 'Report name cannot be empty'
  }

  if (data.name !== undefined && data.name.length > 100) {
    return 'Report name cannot exceed 100 characters'
  }

  if (data.reportType !== undefined) {
    const validReportTypes = [
      'profit_loss',
      'inventory',
      'sales',
      'feed',
      'egg',
    ] as const

    if (!validReportTypes.includes(data.reportType)) {
      return 'Invalid report type'
    }
  }

  if (data.dateRangeType !== undefined) {
    const validDateRangeTypes = [
      'today',
      'week',
      'month',
      'quarter',
      'year',
      'custom',
    ] as const

    if (!validDateRangeTypes.includes(data.dateRangeType)) {
      return 'Invalid date range type'
    }

    if (
      data.dateRangeType === 'custom' &&
      (!data.customStartDate || !data.customEndDate)
    ) {
      return 'Custom date range requires both start and end dates'
    }
  }

  return null
}

/**
 * Calculate laying percentage for egg production
 *
 * @param totalEggs - Total eggs collected
 * @param layerBirds - Number of laying birds
 * @param days - Number of days in period
 * @returns Average laying percentage, rounded to 1 decimal
 *
 * @example
 * ```ts
 * const percentage = calculateLayingPercentage(1000, 100, 10)
 * // Returns: 100 (100% average laying rate)
 * ```
 */
export function calculateLayingPercentage(
  totalEggs: number,
  layerBirds: number,
  days: number,
): number {
  if (layerBirds <= 0 || days <= 0) {
    return 0
  }

  const average = (totalEggs / (layerBirds * days)) * 100
  return Math.round(average * 10) / 10
}

/**
 * Calculate running inventory from egg records
 *
 * @param records - Array of egg records with collected, broken, sold quantities
 * @returns Records with running inventory calculated
 *
 * @example
 * ```ts
 * const withInventory = calculateEggInventory(records)
 * ```
 */
export function calculateEggInventory(
  records: Array<{
    collected: number
    broken: number
    sold: number
  }>,
): Array<{
  collected: number
  broken: number
  sold: number
  inventory: number
}> {
  let runningInventory = 0

  return records
    .slice()
    .reverse()
    .map((r) => {
      runningInventory += r.collected - r.broken - r.sold
      return {
        collected: r.collected,
        broken: r.broken,
        sold: r.sold,
        inventory: runningInventory,
      }
    })
    .reverse()
}
