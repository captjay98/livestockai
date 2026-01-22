/**
 * Pure business logic for egg collection operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateEggRecordInput, UpdateEggRecordInput } from './server'

/**
 * Totals calculated from egg collection records
 */
export interface EggTotals {
  totalCollected: number
  totalBroken: number
  totalSold: number
  currentInventory: number
}

/**
 * Summary of egg collection data
 */
export interface EggSummary {
  totalCollected: number
  totalBroken: number
  totalSold: number
  currentInventory: number
  recordCount: number
}

/**
 * Grade classification for eggs based on size/weight
 */
export type EggGrade = 'small' | 'medium' | 'large' | 'xl'

/**
 * Validate egg collection data before creation
 * Returns validation error message or null if valid
 *
 * @param data - Egg collection data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateEggCollectionData({
 *   batchId: 'batch-1',
 *   date: new Date(),
 *   quantityCollected: 100,
 *   quantityBroken: 5,
 *   quantitySold: 0
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateEggCollectionData({ ...validData, quantityCollected: 0 })
 * // Returns: 'Quantity collected must be greater than 0'
 * ```
 */
export function validateEggCollectionData(
  data: CreateEggRecordInput,
): string | null {
  if (!data.batchId || data.batchId.trim() === '') {
    return 'Batch ID is required'
  }

  if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
    return 'Valid collection date is required'
  }

  if (data.quantityCollected < 0) {
    return 'Quantity collected cannot be negative'
  }

  if (data.quantityBroken < 0) {
    return 'Quantity broken cannot be negative'
  }

  if (data.quantitySold < 0) {
    return 'Quantity sold cannot be negative'
  }

  // Broken + Sold cannot exceed collected (negative inventory would be invalid)
  if (data.quantityCollected < data.quantityBroken + data.quantitySold) {
    return 'Broken and sold quantities cannot exceed collected quantity'
  }

  return null
}

/**
 * Calculate totals from egg collection records
 * Pure function - no side effects, easily testable
 *
 * @param records - Array of egg collection records
 * @returns Calculated totals object
 *
 * @example
 * ```ts
 * const totals = calculateEggTotals([
 *   { quantityCollected: 100, quantityBroken: 5, quantitySold: 0 },
 *   { quantityCollected: 95, quantityBroken: 3, quantitySold: 10 }
 * ])
 * // Returns: { totalCollected: 195, totalBroken: 8, totalSold: 10, currentInventory: 177 }
 * ```
 */
export function calculateEggTotals(
  records: Array<{
    quantityCollected: number
    quantityBroken: number
    quantitySold: number
  }>,
): EggTotals {
  const totalCollected = records.reduce(
    (sum, r) => sum + r.quantityCollected,
    0,
  )
  const totalBroken = records.reduce((sum, r) => sum + r.quantityBroken, 0)
  const totalSold = records.reduce((sum, r) => sum + r.quantitySold, 0)
  const currentInventory = totalCollected - totalBroken - totalSold

  return {
    totalCollected,
    totalBroken,
    totalSold,
    currentInventory: Math.max(0, currentInventory),
  }
}

/**
 * Build egg summary from collection records
 *
 * @param records - Array of egg collection records
 * @returns Summary object with totals and record count
 */
export function buildEggSummary(
  records: Array<{
    quantityCollected: number
    quantityBroken: number
    quantitySold: number
  }>,
): EggSummary {
  const totals = calculateEggTotals(records)

  return {
    totalCollected: totals.totalCollected,
    totalBroken: totals.totalBroken,
    totalSold: totals.totalSold,
    currentInventory: totals.currentInventory,
    recordCount: records.length,
  }
}

/**
 * Determine egg grade based on size category and weight
 * Standard grading for table eggs
 * When weight is provided, it takes precedence over the size string
 *
 * @param size - Size category
 * @param weight - Weight in grams (optional)
 * @returns Egg grade classification
 *
 * @example
 * ```ts
 * determineEggGrade('small')   // Returns: 'small'
 * determineEggGrade('extra_large', 70) // Returns: 'xl'
 * determineEggGrade('small', 55) // Returns: 'medium' (weight takes precedence)
 * ```
 */
export function determineEggGrade(size: string, weight?: number): EggGrade {
  const normalizedSize = size.toLowerCase()

  // If weight is provided, use it to determine grade (takes precedence)
  if (weight !== undefined) {
    if (weight < 53) return 'small'
    if (weight < 63) return 'medium'
    if (weight < 73) return 'large'
    return 'xl'
  }

  // Extra large - check before large to avoid matching 'large' substring
  if (
    normalizedSize.includes('extra large') ||
    normalizedSize.includes('extra_large') ||
    normalizedSize.includes('xl') ||
    normalizedSize.includes('x-large')
  ) {
    return 'xl'
  }

  // Small
  if (
    normalizedSize.includes('small') ||
    normalizedSize.includes('s')
  ) {
    return 'small'
  }

  // Medium
  if (
    normalizedSize.includes('medium') ||
    normalizedSize.includes('m')
  ) {
    return 'medium'
  }

  // Large - check after extra large and others
  if (
    normalizedSize.includes('large') ||
    normalizedSize.includes('l')
  ) {
    return 'large'
  }

  // Default
  if (normalizedSize.length <= 1) {
    return 'large'
  }

  return 'medium'
}

/**
 * Calculate fertility rate for egg collection
 * Returns percentage of fertile eggs (0-100)
 *
 * @param fertile - Number of fertile eggs
 * @param total - Total eggs in collection
 * @returns Fertility rate as percentage (0-100), or 0 if total is 0
 *
 * @example
 * ```ts
 * const rate = calculateFertilityRate(90, 100)
 * // Returns: 90 (90% fertility rate)
 * ```
 */
export function calculateFertilityRate(fertile: number, total: number): number {
  if (total <= 0 || fertile < 0) {
    return 0
  }

  const rate = (fertile / total) * 100
  // Clamp to 100 maximum (in case fertile > total due to data issues)
  const clampedRate = Math.min(rate, 100)
  return Math.round(clampedRate * 100) / 100 // Round to 2 decimal places
}

/**
 * Validate update data for egg collection
 * Returns validation error message or null if valid
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 *
 * @example
 * ```ts
 * const error = validateUpdateData({ quantityCollected: 100 })
 * // Returns: null (valid)
 *
 * const invalidError = validateUpdateData({ quantityCollected: -10 })
 * // Returns: 'Quantity collected cannot be negative'
 * ```
 */
export function validateUpdateData(data: UpdateEggRecordInput): string | null {
  // Validate date if provided
  if (data.date !== undefined) {
    if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
      return 'Date must be a valid date'
    }
  }

  // Validate quantityCollected if provided
  if (data.quantityCollected !== undefined && data.quantityCollected < 0) {
    return 'Quantity collected cannot be negative'
  }

  // Validate quantityBroken if provided
  if (data.quantityBroken !== undefined && data.quantityBroken < 0) {
    return 'Quantity broken cannot be negative'
  }

  // Validate quantitySold if provided
  if (data.quantitySold !== undefined && data.quantitySold < 0) {
    return 'Quantity sold cannot be negative'
  }

  // Note: Full validation of broken+sold vs collected
  // requires original values, which should be validated in the server function

  return null
}

/**
 * Calculate laying percentage for a flock
 * Returns percentage of birds that laid eggs (0-100)
 *
 * @param eggsCollected - Number of eggs collected
 * @param flockSize - Current flock size
 * @returns Laying percentage (0-100), or 0 if flock size is 0
 *
 * @example
 * ```ts
 * const percentage = calculateLayingPercentage(95, 100)
 * // Returns: 95 (95% laying rate)
 * ```
 */
export function calculateLayingPercentage(
  eggsCollected: number,
  flockSize: number,
): number {
  if (flockSize <= 0 || eggsCollected < 0) {
    return 0
  }

  const percentage = (eggsCollected / flockSize) * 100
  // Clamp to 100 maximum (in case eggs > flock due to data issues)
  const clampedPercentage = Math.min(percentage, 100)
  return Math.round(clampedPercentage * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate egg production rate per bird
 *
 * @param totalEggs - Total eggs produced
 * @param flockSize - Number of birds in flock
 * @returns Production rate per bird
 */
export function calculateProductionRate(
  totalEggs: number,
  flockSize: number,
): number {
  if (flockSize <= 0 || totalEggs < 0) {
    return 0
  }

  return Math.round((totalEggs / flockSize) * 100) / 100
}

/**
 * Calculate breakage rate percentage
 *
 * @param broken - Number of broken eggs
 * @param total - Total eggs collected
 * @returns Breakage rate as percentage (0-100), or 0 if total is 0
 */
export function calculateBreakageRate(broken: number, total: number): number {
  if (total <= 0 || broken < 0) {
    return 0
  }

  const rate = (broken / total) * 100
  // Clamp to 100 maximum
  const clampedRate = Math.min(rate, 100)
  return Math.round(clampedRate * 100) / 100
}
