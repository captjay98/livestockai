/**
 * Pure business logic for mortality operations.
 * All functions are side-effect-free and easily unit testable.
 */

/**
 * Mortality cause enumeration
 */
export type MortalityCause =
  | 'disease'
  | 'predator'
  | 'weather'
  | 'unknown'
  | 'other'
  | 'starvation'
  | 'injury'
  | 'poisoning'
  | 'suffocation'
  | 'culling'

/**
 * Input for creating a new mortality record
 */
export interface CreateMortalityData {
  batchId: string
  quantity: number
  date: Date
  cause: MortalityCause
  notes?: string | null
}

/**
 * Input for updating a mortality record
 */
export interface UpdateMortalityInput {
  quantity?: number
  date?: Date
  cause?: MortalityCause
  notes?: string
}

/**
 * Validate mortality data before creation
 * Returns validation error message or null if valid
 *
 * @param data - Mortality creation data to validate
 * @param batchQuantity - Current batch quantity for validation
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateMortalityData({
 *   batchId: 'batch-1',
 *   quantity: 5,
 *   date: new Date(),
 *   cause: 'disease'
 * }, 100)
 * // Returns: null (valid)
 *
 * const invalidError = validateMortalityData({
 *   ...sameData,
 *   quantity: 0
 * }, 100)
 * // Returns: "Mortality quantity must be greater than 0"
 * ```
 */
export function validateMortalityData(
  data: CreateMortalityData,
  batchQuantity: number,
): string | null {
  if (data.quantity <= 0) {
    return 'Mortality quantity must be greater than 0'
  }

  if (data.quantity > batchQuantity) {
    return 'Mortality quantity cannot exceed current batch quantity'
  }

  if (isNaN(data.date.getTime())) {
    return 'Date is required'
  }

  return null
}

/**
 * Calculate new batch quantity after a mortality event
 *
 * @param currentQuantity - Current quantity before mortality
 * @param mortalityCount - Number of deaths
 * @returns New quantity (never negative)
 *
 * @example
 * ```ts
 * const newQty = calculateNewBatchQuantity(100, 5)
 * // Returns: 95
 * ```
 */
export function calculateNewBatchQuantity(
  currentQuantity: number,
  mortalityCount: number,
): number {
  const newQuantity = currentQuantity - mortalityCount
  return Math.max(0, newQuantity)
}

/**
 * Determine batch status after a mortality event
 *
 * @param newQuantity - Quantity after mortality
 * @returns 'active' or 'depleted'
 *
 * @example
 * determineBatchStatusAfterMortality(95)  // Returns: 'active'
 * determineBatchStatusAfterMortality(0)   // Returns: 'depleted'
 */
export function determineBatchStatusAfterMortality(
  newQuantity: number,
): 'active' | 'depleted' {
  return newQuantity <= 0 ? 'depleted' : 'active'
}

/**
 * Calculate mortality rate as a percentage
 *
 * @param initialQuantity - Starting quantity of the batch
 * @param totalDeaths - Total number of deaths recorded
 * @returns Mortality rate as a percentage (0-100+)
 *
 * @example
 * ```ts
 * const rate = calculateMortalityRate(100, 5)
 * // Returns: 5.0 (5% mortality rate)
 * ```
 */
export function calculateMortalityRate(
  initialQuantity: number,
  totalDeaths: number,
): number {
  if (initialQuantity <= 0) {
    return 0
  }
  return (totalDeaths / initialQuantity) * 100
}

/**
 * Cause distribution entry
 */
export interface CauseDistributionEntry {
  cause: string
  count: number
  quantity: number
  percentage: number
}

/**
 * Calculate cause distribution from mortality records
 *
 * @param records - Array of mortality records with quantity and cause
 * @returns Array of cause distribution entries with percentages
 *
 * @example
 * ```ts
 * const distribution = calculateCauseDistribution([
 *   { cause: 'disease', quantity: 10 },
 *   { cause: 'predator', quantity: 5 }
 * ])
 * // Returns: [
 * //   { cause: 'disease', count: 1, quantity: 10, percentage: 66.67 },
 * //   { cause: 'predator', count: 1, quantity: 5, percentage: 33.33 }
 * // ]
 * ```
 */
export function calculateCauseDistribution(
  records: Array<{ cause: string; quantity: number }>,
): Array<CauseDistributionEntry> {
  const totalDeaths = records.reduce((sum, r) => sum + r.quantity, 0)

  if (totalDeaths === 0) {
    return []
  }

  // Group by cause
  const causeMap = new Map<string, { count: number; quantity: number }>()

  for (const record of records) {
    const existing = causeMap.get(record.cause)
    if (existing) {
      existing.count++
      existing.quantity += record.quantity
    } else {
      causeMap.set(record.cause, { count: 1, quantity: record.quantity })
    }
  }

  // Convert to array with percentages
  return Array.from(causeMap.entries()).map(([cause, data]) => ({
    cause,
    count: data.count,
    quantity: data.quantity,
    percentage: (data.quantity / totalDeaths) * 100,
  }))
}

/**
 * Map trend period to PostgreSQL date format string
 *
 * @param period - Time grouping period
 * @returns PostgreSQL to_char format string
 *
 * @example
 * mapTrendPeriodToFormat('daily')    // Returns: 'YYYY-MM-DD'
 * mapTrendPeriodToFormat('weekly')   // Returns: 'YYYY-"W"WW'
 * mapTrendPeriodToFormat('monthly')  // Returns: 'YYYY-MM'
 */
export function mapTrendPeriodToFormat(
  period: 'daily' | 'weekly' | 'monthly',
): string {
  switch (period) {
    case 'weekly':
      return 'YYYY-"W"WW' // Year-Week format
    case 'monthly':
      return 'YYYY-MM' // Year-Month format
    default:
      return 'YYYY-MM-DD' // Year-Month-Day format
  }
}

/**
 * Trend data point
 */
export interface MortalityTrend {
  period: string
  records: number
  quantity: number
}

/**
 * Build mortality trends from database query results
 *
 * @param results - Raw database aggregation results
 * @returns Array of trend data points
 *
 * @example
 * ```ts
 * const trends = buildMortalityTrends([
 *   { period: '2024-01-01', records: 2, quantity: 5 },
 *   { period: '2024-01-02', records: 1, quantity: 3 }
 * ])
 * ```
 */
export function buildMortalityTrends(
  results: Array<{
    period: string | null
    records: string | number | bigint
    quantity: string | number | bigint
  }>,
): Array<MortalityTrend> {
  return results.map((trend) => ({
    period: (trend.period as string) || '',
    records: Number(trend.records),
    quantity: Number(trend.quantity),
  }))
}

/**
 * Restore batch quantity when mortality record is deleted
 *
 * @param currentQuantity - Current batch quantity
 * @param recordedMortality - Quantity from the mortality record being deleted
 * @returns Restored quantity
 *
 * @example
 * restoreBatchQuantityOnDelete(95, 5)  // Returns: 100
 */
export function restoreBatchQuantityOnDelete(
  currentQuantity: number,
  recordedMortality: number,
): number {
  return currentQuantity + recordedMortality
}

/**
 * Calculate quantity adjustment for mortality record updates
 *
 * @param originalQuantity - Original mortality quantity
 * @param newQuantity - New mortality quantity
 * @returns Quantity difference (positive = restore to batch, negative = deduct from batch)
 *
 * @example
 * calculateQuantityAdjustment(5, 3)  // Returns: 2 (restore 2 to batch)
 * calculateQuantityAdjustment(3, 5)  // Returns: -2 (deduct 2 more from batch)
 */
export function calculateQuantityAdjustment(
  originalQuantity: number,
  newQuantity: number,
): number {
  return originalQuantity - newQuantity
}

/**
 * Mortality summary result
 */
export interface MortalitySummary {
  totalDeaths: number
  recordCount: number
  criticalAlerts: number
  totalAlerts: number
}

/**
 * Build mortality summary from raw data
 *
 * @param records - Mortality records with quantity
 * @param alertCount - Number of critical alerts
 * @param totalAlertCount - Total number of alerts
 * @returns Mortality summary object
 *
 * @example
 * ```ts
 * const summary = buildMortalitySummary(
 *   [{ quantity: 5 }, { quantity: 3 }],
 *   2,
 *   5
 * )
 * // Returns: { totalDeaths: 8, recordCount: 2, criticalAlerts: 2, totalAlerts: 5 }
 * ```
 */
export function buildMortalitySummary(
  records: Array<{ quantity: number }>,
  alertCount: number,
  totalAlertCount: number,
): MortalitySummary {
  const totalDeaths = records.reduce((sum, r) => sum + r.quantity, 0)

  return {
    totalDeaths,
    recordCount: records.length,
    criticalAlerts: alertCount,
    totalAlerts: totalAlertCount,
  }
}

/**
 * Validate mortality update data
 *
 * @param data - Update data to validate
 * @param batchQuantity - Current batch quantity for validation
 * @returns Validation error message, or null if valid
 */
export function validateUpdateData(
  data: UpdateMortalityInput,
  batchQuantity: number,
): string | null {
  // Validate quantity if provided
  if (data.quantity !== undefined) {
    if (data.quantity <= 0) {
      return 'Mortality quantity must be greater than 0'
    }

    if (data.quantity > batchQuantity) {
      return 'Mortality quantity cannot exceed current batch quantity'
    }
  }

  // Validate date if provided
  if (data.date !== undefined && isNaN(data.date.getTime())) {
    return 'Date is required'
  }

  return null
}
