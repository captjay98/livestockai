/**
 * Pure business logic for weight operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateWeightSampleInput, UpdateWeightSampleInput } from './server'

/**
 * Expected ADG targets by species (kg/day)
 * Used for growth rate comparisons and alert generation
 */
export const EXPECTED_ADG_BY_SPECIES: Record<string, number> = {
  broiler: 0.05, // 50g/day
  layer: 0.02, // 20g/day
  catfish: 0.015, // 15g/day
  tilapia: 0.01, // 10g/day
  cattle: 0.8, // 800g/day
  goats: 0.15, // 150g/day
  sheep: 0.25, // 250g/day
  bees: 0.001, // 1g/day (colony weight gain)
}

/**
 * Validate weight record data before creation
 * Returns validation error message or null if valid
 *
 * @param data - Weight record data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateWeightRecord({
 *   batchId: 'batch-1',
 *   date: new Date(),
 *   sampleSize: 10,
 *   averageWeightKg: 2.5
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateWeightRecord({
 *   ...sameData,
 *   averageWeightKg: -1
 * })
 * // Returns: "Average weight must be greater than 0"
 * ```
 */
export function validateWeightRecord(
  data: CreateWeightSampleInput,
): string | null {
  if (data.batchId.trim() === '') {
    return 'Batch ID is required'
  }

  if (isNaN(data.date.getTime())) {
    return 'Valid measurement date is required'
  }

  if (data.sampleSize <= 0) {
    return 'Sample size must be greater than 0'
  }

  if (data.averageWeightKg <= 0) {
    return 'Average weight must be greater than 0'
  }

  if (data.minWeightKg != null && data.minWeightKg <= 0) {
    return 'Minimum weight must be greater than 0'
  }

  if (data.maxWeightKg != null && data.maxWeightKg <= 0) {
    return 'Maximum weight must be greater than 0'
  }

  // Validate min/max relationship
  if (
    data.minWeightKg != null &&
    data.maxWeightKg != null &&
    data.minWeightKg > data.maxWeightKg
  ) {
    return 'Minimum weight cannot be greater than maximum weight'
  }

  return null
}

/**
 * Calculate average weight from an array of weight records
 *
 * @param records - Array of weight records with averageWeightKg
 * @returns Average weight in kg, or 0 if no records
 *
 * @example
 * ```ts
 * const avg = calculateAverageWeight([
 *   { averageWeightKg: '2.0' },
 *   { averageWeightKg: '3.0' }
 * ])
 * // Returns: 2.5
 * ```
 */
export function calculateAverageWeight(
  records: Array<{ averageWeightKg: string }>,
): number {
  if (records.length === 0) {
    return 0
  }

  const total = records.reduce((sum, record) => {
    return sum + parseFloat(record.averageWeightKg)
  }, 0)

  return total / records.length
}

/**
 * Calculate growth rate (Average Daily Gain) between two weight measurements
 *
 * @param current - Current weight measurement
 * @param previous - Previous weight measurement
 * @returns Growth rate in kg/day, or null if calculation not possible
 *
 * @example
 * ```ts
 * const rate = calculateGrowthRate(
 *   { weight: 3.0, date: new Date('2024-01-15') },
 *   { weight: 2.0, date: new Date('2024-01-01') }
 * )
 * // Returns: ~0.071 (71g/day over 14 days)
 * ```
 */
export function calculateGrowthRate(
  current: { weight: number; date: Date },
  previous: { weight: number; date: Date },
): number | null {
  const currentDate = current.date.getTime()
  const previousDate = previous.date.getTime()

  if (currentDate <= previousDate) {
    return null
  }

  const daysBetween = (currentDate - previousDate) / (1000 * 60 * 60 * 24)

  if (daysBetween <= 0) {
    return null
  }

  const weightGain = current.weight - previous.weight

  if (weightGain < 0) {
    // Weight loss - still return negative rate
    return weightGain / daysBetween
  }

  return weightGain / daysBetween
}

/**
 * Calculate total weight gain between initial and current measurements
 *
 * @param current - Current weight in kg
 * @param initial - Initial weight in kg
 * @returns Total weight gain in kg
 *
 * @example
 * ```ts
 * const gain = calculateWeightGain(3.5, 2.0)
 * // Returns: 1.5
 * ```
 */
export function calculateWeightGain(current: number, initial: number): number {
  return current - initial
}

/**
 * Determine growth status based on growth rate compared to expected
 *
 * @param growthRate - Actual growth rate in kg/day
 * @returns 'normal', 'slow', or 'rapid' status
 *
 * @example
 * ```ts
 * determineGrowthStatus(0.04)  // Returns: 'normal' (close to 0.05 expected for broiler)
 * determineGrowthStatus(0.02)  // Returns: 'slow' (below expected)
 * determineGrowthStatus(0.08)  // Returns: 'rapid' (above expected)
 * ```
 */
export function determineGrowthStatus(
  growthRate: number,
): 'normal' | 'slow' | 'rapid' {
  // Normal: 80-120% of expected baseline (0.04 kg/day)
  const baseline = 0.04
  const ratio = growthRate / baseline

  if (ratio < 0.7) {
    return 'slow'
  }

  if (ratio > 1.3) {
    return 'rapid'
  }

  return 'normal'
}

/**
 * Calculate projected weight based on current weight and growth rate
 *
 * @param current - Current weight in kg
 * @param growthRate - Expected growth rate in kg/day
 * @param days - Number of days to project forward
 * @returns Projected weight in kg
 *
 * @example
 * ```ts
 * const projected = calculateProjectedWeight(2.5, 0.05, 30)
 * // Returns: 4.0 (2.5 + 0.05 * 30)
 * ```
 */
export function calculateProjectedWeight(
  current: number,
  growthRate: number,
  days: number,
): number {
  return current + growthRate * days
}

/**
 * Build comprehensive weight statistics from an array of records
 *
 * @param records - Array of weight records ordered by date
 * @returns Statistics object with averages, growth rates, and projections
 *
 * @example
 * ```ts
 * const stats = buildWeightStats([
 *   { averageWeightKg: '1.0', date: new Date('2024-01-01') },
 *   { averageWeightKg: '2.0', date: new Date('2024-01-15') }
 * ])
 * // Returns: { averageWeight: 1.5, totalGain: 1.0, dailyGain: ~0.067, ... }
 * ```
 */
export function buildWeightStats(
  records: Array<{
    averageWeightKg: string
    date: Date
    sampleSize?: number
  }>,
): {
  averageWeight: number
  totalGain: number
  dailyGain: number | null
  recordCount: number
  latestRecord: (typeof records)[0] | null
  firstRecord: (typeof records)[0] | null
  daysBetween: number | null
} {
  if (records.length === 0) {
    return {
      averageWeight: 0,
      totalGain: 0,
      dailyGain: null,
      recordCount: 0,
      latestRecord: null,
      firstRecord: null,
      daysBetween: null,
    }
  }

  const averageWeight = calculateAverageWeight(records)
  const latestRecord = records[records.length - 1]
  const firstRecord = records[0]

  const latestWeight = parseFloat(latestRecord.averageWeightKg)
  const firstWeight = parseFloat(firstRecord.averageWeightKg)

  const totalGain = calculateWeightGain(latestWeight, firstWeight)

  const daysBetween =
    (latestRecord.date.getTime() - firstRecord.date.getTime()) /
    (1000 * 60 * 60 * 24)

  const dailyGain = daysBetween > 0 ? totalGain / daysBetween : null

  return {
    averageWeight: Math.round(averageWeight * 1000) / 1000,
    totalGain: Math.round(totalGain * 1000) / 1000,
    dailyGain: dailyGain !== null ? Math.round(dailyGain * 1000) / 1000 : null,
    recordCount: records.length,
    latestRecord,
    firstRecord,
    daysBetween: Math.ceil(daysBetween),
  }
}

/**
 * Validate update data for a weight record
 * Returns validation error message or null if valid
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if data is valid
 */
export function validateUpdateData(
  data: UpdateWeightSampleInput,
): string | null {
  // Validate date if provided
  if (data.date != null && isNaN(data.date.getTime())) {
    return 'Date must be valid'
  }

  // Validate sample size if provided
  if (data.sampleSize !== undefined && data.sampleSize <= 0) {
    return 'Sample size must be greater than 0'
  }

  // Validate average weight if provided
  if (data.averageWeightKg !== undefined && data.averageWeightKg <= 0) {
    return 'Average weight must be greater than 0'
  }

  // Validate min weight if provided
  if (data.minWeightKg != null && data.minWeightKg <= 0) {
    return 'Minimum weight must be greater than 0'
  }

  // Validate max weight if provided
  if (data.maxWeightKg != null && data.maxWeightKg <= 0) {
    return 'Maximum weight must be greater than 0'
  }

  // Validate min/max relationship if both provided
  if (
    data.minWeightKg != null &&
    data.maxWeightKg != null &&
    data.minWeightKg > data.maxWeightKg
  ) {
    return 'Minimum weight cannot be greater than maximum weight'
  }

  return null
}

/**
 * Get expected ADG for a given species
 *
 * @param species - Species name
 * @returns Expected ADG in kg/day, or default value if species not found
 */
export function getExpectedAdg(species: string): number {
  const normalizedSpecies = species.toLowerCase()
  return EXPECTED_ADG_BY_SPECIES[normalizedSpecies] ?? 0.03
}

/**
 * Calculate percentage of expected ADG achieved
 *
 * @param actualAdg - Actual ADG achieved
 * @param expectedAdg - Expected ADG for species
 * @returns Percentage of expected ADG (can be > 100 or < 0)
 */
export function calculateAdgPercentage(
  actualAdg: number,
  expectedAdg: number,
): number {
  if (expectedAdg <= 0) {
    return 100 // Default to 100% if no expected value
  }
  return (actualAdg / expectedAdg) * 100
}

/**
 * Determine alert severity based on ADG percentage
 *
 * @param percentOfExpected - Percentage of expected ADG achieved
 * @returns 'warning' or 'critical' severity level
 */
export function getAlertSeverity(
  percentOfExpected: number,
): 'warning' | 'critical' {
  return percentOfExpected < 50 ? 'critical' : 'warning'
}
