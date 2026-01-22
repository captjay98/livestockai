/**
 * Pure business logic for batch operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { LivestockType } from '~/features/modules/types'
import type { CreateBatchData, UpdateBatchData } from './server'
import { multiply, toDbString } from '~/features/settings/currency'

/**
 * Calculate total cost for a batch
 * Pure function - no side effects, easily testable
 *
 * @param initialQuantity - Initial number of units
 * @param costPerUnit - Cost per unit in system currency
 * @returns Total cost as decimal string for database storage
 *
 * @example
 * ```ts
 * const totalCost = calculateBatchTotalCost(100, 5.50)
 * // Returns: "550.00"
 * ```
 */
export function calculateBatchTotalCost(
  initialQuantity: number,
  costPerUnit: number,
): string {
  if (initialQuantity <= 0 || costPerUnit < 0) {
    return toDbString(0)
  }
  return toDbString(multiply(initialQuantity, costPerUnit))
}

/**
 * Validate batch data before creation
 * Returns validation error message or null if valid
 *
 * @param data - Batch creation data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateBatchData({
 *   farmId: 'farm-1',
 *   livestockType: 'poultry',
 *   species: 'Broiler',
 *   initialQuantity: 100,
 *   acquisitionDate: new Date(),
 *   costPerUnit: 5.50
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateBatchData({
 *   ...sameData,
 *   initialQuantity: 0
 * })
 * // Returns: "Initial quantity must be greater than 0"
 * ```
 */
export function validateBatchData(data: CreateBatchData): string | null {
  if (data.farmId === '' || data.farmId.trim() === '') {
    return 'Farm ID is required'
  }

  if (data.species.trim() === '') {
    return 'Species is required'
  }

  if (data.initialQuantity <= 0) {
    return 'Initial quantity must be greater than 0'
  }

  if (data.costPerUnit < 0) {
    return 'Cost per unit cannot be negative'
  }

  if (isNaN(data.acquisitionDate.getTime())) {
    return 'Acquisition date is required'
  }

  // Validate target harvest date is after acquisition date
  if (
    data.targetHarvestDate !== undefined &&
    data.targetHarvestDate !== null &&
    data.acquisitionDate >= data.targetHarvestDate
  ) {
    return 'Target harvest date must be after acquisition date'
  }

  // Validate target weight is positive
  if (
    data.target_weight_g !== undefined &&
    data.target_weight_g !== null &&
    data.target_weight_g <= 0
  ) {
    return 'Target weight must be greater than 0'
  }

  return null
}

/**
 * Determine batch status based on current quantity
 *
 * @param currentQuantity - Current quantity of livestock
 * @param soldQuantity - Optional quantity that has been sold
 * @returns 'active', 'depleted', or 'sold'
 *
 * @example
 * ```ts
 * determineBatchStatus(100)     // Returns: 'active'
 * determineBatchStatus(0)       // Returns: 'depleted'
 * determineBatchStatus(0, 100)  // Returns: 'sold'
 * ```
 */
export function determineBatchStatus(
  currentQuantity: number,
  soldQuantity?: number,
): 'active' | 'depleted' | 'sold' {
  // If all units were sold, mark as sold
  if (soldQuantity !== undefined && soldQuantity > 0 && currentQuantity === 0) {
    return 'sold'
  }
  // If no units remain (and not marked as sold), mark as depleted
  return currentQuantity <= 0 ? 'depleted' : 'active'
}

/**
 * Calculate mortality rate for a batch
 * Returns percentage of initial stock that died
 *
 * @param initialQuantity - Starting quantity of the batch
 * @param _currentQuantity - Current quantity (before mortality event)
 * @param totalMortality - Total number of deaths recorded
 * @returns Mortality rate as a percentage (0-100+)
 *
 * @example
 * ```ts
 * const rate = calculateMortalityRate(100, 95, 5)
 * // Returns: 5.0 (5% mortality rate)
 * ```
 */
export function calculateMortalityRate(
  initialQuantity: number,
  _currentQuantity: number,
  totalMortality: number,
): number {
  if (initialQuantity <= 0) {
    return 0
  }
  return (totalMortality / initialQuantity) * 100
}

/**
 * Calculate Feed Conversion Ratio (FCR)
 * FCR = Total Feed Consumed / Total Weight Gain
 * Lower FCR is better (more efficient feed conversion)
 *
 * @param totalFeedKg - Total feed consumed in kilograms
 * @param currentQuantityKg - Total current weight in kilograms
 * @returns FCR as a number, or null if calculation is not possible
 *
 * @example
 * ```ts
 * const fcr = calculateFCR(150, 100)
 * // Returns: 1.5 (1.5 kg feed per 1 kg weight gain)
 * ```
 */
export function calculateFCR(
  totalFeedKg: number,
  currentQuantityKg: number,
): number | null {
  if (totalFeedKg <= 0 || currentQuantityKg <= 0) {
    return null
  }
  return totalFeedKg / currentQuantityKg
}

/**
 * Calculate new batch quantity after a mortality event
 *
 * @param currentQuantity - Quantity before mortality
 * @param mortalityCount - Number of deaths
 * @returns New quantity (never negative)
 *
 * @example
 * ```ts
 * const newQty = calculateNewQuantity(100, 5)
 * // Returns: 95
 * ```
 */
export function calculateNewQuantity(
  currentQuantity: number,
  mortalityCount: number,
): number {
  const newQuantity = currentQuantity - mortalityCount
  return Math.max(0, newQuantity)
}

/**
 * Validate update batch data
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 */
export function validateUpdateData(data: UpdateBatchData): string | null {
  // Validate species if provided
  if (data.species !== undefined && data.species.trim() === '') {
    return 'Species cannot be empty'
  }

  // Validate target harvest date
  if (
    data.targetHarvestDate !== undefined &&
    data.targetHarvestDate !== null &&
    isNaN(data.targetHarvestDate.getTime())
  ) {
    return 'Target harvest date is invalid'
  }

  // Validate target weight
  if (
    data.target_weight_g !== undefined &&
    data.target_weight_g !== null &&
    data.target_weight_g < 0
  ) {
    return 'Target weight cannot be negative'
  }

  return null
}

/**
 * Check if a batch can be deleted
 * A batch can only be deleted if it has no related records
 *
 * @param hasRelatedRecords - Object indicating presence of related records
 * @returns True if batch can be deleted, false otherwise
 *
 * @example
 * ```ts
 * const canDelete = canDeleteBatch({
 *   hasFeedRecords: false,
 *   hasEggRecords: false,
 *   hasSales: false,
 *   hasMortality: true  // Has mortality records
 * })
 * // Returns: false (cannot delete with related records)
 * ```
 */
export function canDeleteBatch(hasRelatedRecords: {
  hasFeedRecords: boolean
  hasEggRecords: boolean
  hasSales: boolean
  hasMortality: boolean
}): boolean {
  return !(
    hasRelatedRecords.hasFeedRecords ||
    hasRelatedRecords.hasEggRecords ||
    hasRelatedRecords.hasSales ||
    hasRelatedRecords.hasMortality
  )
}

/**
 * Calculate batch depletion percentage
 * Shows what percentage of the batch has been depleted (sold or died)
 *
 * @param initialQuantity - Starting quantity
 * @param currentQuantity - Current quantity
 * @returns Percentage depleted (0-100)
 *
 * @example
 * ```ts
 * const depleted = calculateDepletionPercentage(100, 60)
 * // Returns: 40 (40% depleted)
 * ```
 */
export function calculateDepletionPercentage(
  initialQuantity: number,
  currentQuantity: number,
): number {
  if (initialQuantity <= 0) {
    return 0
  }
  const depleted = initialQuantity - currentQuantity
  return Math.min(100, (depleted / initialQuantity) * 100)
}

/**
 * Get source size options for a livestock type based on module metadata
 * This is a pure function extracted from server.ts
 *
 * @param livestockType - The type of livestock
 * @param moduleMetadata - Module metadata object
 * @returns Array of value/label pairs for source size options
 */
export function getSourceSizeOptions(
  livestockType: LivestockType,
  moduleMetadata: Record<
    string,
    {
      livestockTypes: Array<LivestockType>
      sourceSizeOptions: Array<{ value: string; label: string }>
    }
  >,
): Array<{ value: string; label: string }> {
  const moduleEntry = Object.entries(moduleMetadata).find(([_, metadata]) =>
    metadata.livestockTypes.includes(livestockType),
  )

  if (!moduleEntry) {
    return []
  }

  return moduleEntry[1].sourceSizeOptions
}

/**
 * Validate update data for batch quantity changes
 *
 * @param currentQuantity - Current quantity in the batch
 * @param newQuantity - Proposed new quantity
 * @returns Validation error or null
 */
export function validateQuantityUpdate(
  currentQuantity: number,
  newQuantity: number,
): string | null {
  if (newQuantity < 0) {
    return 'Quantity cannot be negative'
  }

  if (newQuantity > currentQuantity) {
    return 'New quantity cannot exceed current quantity without adding stock'
  }

  return null
}
