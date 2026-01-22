/**
 * Pure business logic for inventory operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { Database } from '~/lib/db/types'

// ============================================================================
// Feed Types & Constants
// ============================================================================

export type FeedType = Database['feed_inventory']['feedType']

export const FEED_TYPES: Array<{ value: FeedType; label: string }> = [
  { value: 'starter', label: 'Starter' },
  { value: 'grower', label: 'Grower' },
  { value: 'finisher', label: 'Finisher' },
  { value: 'layer_mash', label: 'Layer Mash' },
  { value: 'fish_feed', label: 'Fish Feed' },
  { value: 'cattle_feed', label: 'Cattle Feed' },
  { value: 'goat_feed', label: 'Goat Feed' },
  { value: 'sheep_feed', label: 'Sheep Feed' },
  { value: 'hay', label: 'Hay' },
  { value: 'silage', label: 'Silage' },
  { value: 'bee_feed', label: 'Bee Feed' },
]

// ============================================================================
// Medication Types & Constants
// ============================================================================

export type MedicationUnit = Database['medication_inventory']['unit']

export const MEDICATION_UNITS: Array<{ value: MedicationUnit; label: string }> =
  [
    { value: 'vial', label: 'Vial' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'sachet', label: 'Sachet' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'liter', label: 'Liters (l)' },
  ]

// ============================================================================
// Input Interfaces (for service validation)
// ============================================================================

export interface CreateFeedInventoryInput {
  farmId: string
  feedType: FeedType
  quantityKg: number
  minThresholdKg: number
}

export interface UpdateFeedInventoryInput {
  feedType?: FeedType
  quantityKg?: number
  minThresholdKg?: number
}

export interface CreateMedicationInput {
  farmId: string
  medicationName: string
  quantity: number
  unit: MedicationUnit
  expiryDate?: Date | null
  minThreshold: number
}

export interface UpdateMedicationInput {
  medicationName?: string
  quantity?: number
  unit?: MedicationUnit
  expiryDate?: Date | null
  minThreshold?: number
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate feed inventory creation data
 * Returns validation error message or null if valid
 *
 * @param data - Feed inventory data to validate
 * @returns Validation error message, or null if data is valid
 */
export function validateFeedData(
  data: CreateFeedInventoryInput,
): string | null {
  if (!data.farmId || data.farmId.trim() === '') {
    return 'Farm ID is required'
  }

  if (typeof data.quantityKg !== 'number' || data.quantityKg < 0) {
    return 'Quantity must be a non-negative number'
  }

  if (typeof data.minThresholdKg !== 'number' || data.minThresholdKg < 0) {
    return 'Minimum threshold must be a non-negative number'
  }

  return null
}

/**
 * Validate feed inventory update data
 * Returns validation error message or null if valid
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 */
export function validateFeedUpdateData(
  data: UpdateFeedInventoryInput,
): string | null {
  if (data.feedType !== undefined && data.feedType.trim() === '') {
    return 'Feed type cannot be empty'
  }

  if (data.quantityKg !== undefined && data.quantityKg < 0) {
    return 'Quantity cannot be negative'
  }

  if (data.minThresholdKg !== undefined && data.minThresholdKg < 0) {
    return 'Minimum threshold cannot be negative'
  }

  return null
}

/**
 * Validate medication inventory creation data
 * Returns validation error message or null if valid
 *
 * @param data - Medication inventory data to validate
 * @returns Validation error message, or null if data is valid
 */
export function validateMedicationData(
  data: CreateMedicationInput,
): string | null {
  if (!data.farmId || data.farmId.trim() === '') {
    return 'Farm ID is required'
  }

  if (!data.medicationName || data.medicationName.trim() === '') {
    return 'Medication name is required'
  }

  if (typeof data.quantity !== 'number' || data.quantity < 0) {
    return 'Quantity must be a non-negative number'
  }

  if (typeof data.minThreshold !== 'number' || data.minThreshold < 0) {
    return 'Minimum threshold must be a non-negative number'
  }

  return null
}

/**
 * Validate medication inventory update data
 * Returns validation error message or null if valid
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 */
export function validateMedicationUpdateData(
  data: UpdateMedicationInput,
): string | null {
  if (data.medicationName !== undefined && data.medicationName.trim() === '') {
    return 'Medication name cannot be empty'
  }

  if (data.quantity !== undefined && data.quantity < 0) {
    return 'Quantity cannot be negative'
  }

  if (data.expiryDate !== undefined && data.expiryDate !== null) {
    if (
      !(data.expiryDate instanceof Date) ||
      isNaN(data.expiryDate.getTime())
    ) {
      return 'Expiry date must be a valid date'
    }
  }

  if (data.minThreshold !== undefined && data.minThreshold < 0) {
    return 'Minimum threshold cannot be negative'
  }

  return null
}

// ============================================================================
// Stock Management Functions
// ============================================================================

/**
 * Calculate new feed quantity after adding stock
 *
 * @param currentQuantity - Current quantity in kg (as string from DB)
 * @param quantityToAdd - Quantity to add in kg
 * @returns New quantity as string
 */
export function calculateNewFeedQuantity(
  currentQuantity: string,
  quantityToAdd: number,
): string {
  const current = parseFloat(currentQuantity) || 0
  const newQuantity = current + quantityToAdd
  return newQuantity.toFixed(2)
}

/**
 * Calculate new feed quantity after reducing stock
 *
 * @param currentQuantity - Current quantity in kg (as string from DB)
 * @param quantityToReduce - Quantity to reduce in kg
 * @returns New quantity as string
 */
export function calculateReducedFeedQuantity(
  currentQuantity: string,
  quantityToReduce: number,
): string {
  const current = parseFloat(currentQuantity) || 0
  const newQuantity = current - quantityToReduce
  return newQuantity.toFixed(2)
}

/**
 * Calculate new medication quantity after adding stock
 *
 * @param currentQuantity - Current quantity
 * @param quantityToAdd - Quantity to add
 * @returns New quantity
 */
export function calculateNewMedicationQuantity(
  currentQuantity: number,
  quantityToAdd: number,
): number {
  return currentQuantity + quantityToAdd
}

/**
 * Calculate new medication quantity after using stock
 *
 * @param currentQuantity - Current quantity
 * @param quantityToUse - Quantity to use
 * @returns New quantity
 */
export function calculateUsedMedicationQuantity(
  currentQuantity: number,
  quantityToUse: number,
): number {
  return currentQuantity - quantityToUse
}

// ============================================================================
// Status Determination Functions
// ============================================================================

/**
 * Determine feed inventory status based on quantity and threshold
 *
 * @param quantityKg - Current quantity in kg
 * @param minThresholdKg - Minimum threshold in kg
 * @returns Status: 'normal', 'low', or 'critical'
 */
export function getFeedStatus(
  quantityKg: string,
  minThresholdKg: string,
): 'normal' | 'low' | 'critical' {
  const quantity = parseFloat(quantityKg) || 0
  const threshold = parseFloat(minThresholdKg) || 0

  if (quantity <= threshold * 0.5) {
    return 'critical'
  }
  if (quantity <= threshold) {
    return 'low'
  }
  return 'normal'
}

/**
 * Determine medication inventory status based on quantity and threshold
 *
 * @param quantity - Current quantity
 * @param minThreshold - Minimum threshold
 * @returns Status: 'normal', 'low', or 'critical'
 */
export function getMedicationStatus(
  quantity: number,
  minThreshold: number,
): 'normal' | 'low' | 'critical' {
  if (quantity <= minThreshold * 0.5) {
    return 'critical'
  }
  if (quantity <= minThreshold) {
    return 'low'
  }
  return 'normal'
}

/**
 * Calculate days until medication expiry
 *
 * @param expiryDate - Expiry date
 * @returns Number of days until expiry, or null if no expiry date
 */
export function getDaysUntilExpiry(expiryDate: Date | null): number | null {
  if (!expiryDate) return null

  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Check if medication is expiring soon
 *
 * @param expiryDate - Expiry date
 * @param thresholdDays - Days threshold (default: 30)
 * @returns True if expiring within threshold
 */
export function isExpiringSoon(
  expiryDate: Date | null,
  thresholdDays: number = 30,
): boolean {
  const days = getDaysUntilExpiry(expiryDate)
  if (days === null) return false
  return days > 0 && days <= thresholdDays
}

// ============================================================================
// Conversion Functions (for DB string/number handling)
// ============================================================================

/**
 * Convert quantity number to database string format
 *
 * @param quantity - Quantity as number
 * @returns Quantity as string with 2 decimal places
 */
export function quantityToDbString(quantity: number): string {
  return quantity.toFixed(2)
}

/**
 * Parse database string to number
 *
 * @param value - Value as string from database
 * @returns Parsed number, or 0 if invalid
 */
export function parseDbNumber(value: string | null | undefined): number {
  if (!value) return 0
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}
