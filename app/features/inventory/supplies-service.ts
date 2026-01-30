/**
 * Service layer for supplies inventory - Pure business logic
 * No database access, easy to test
 */

export const SUPPLY_CATEGORIES = [
  'disinfectant',
  'bedding',
  'chemical',
  'pest_control',
  'fuel',
  'packaging',
] as const

export const SUPPLY_UNITS = ['kg', 'liters', 'pieces', 'bags'] as const

export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number]
export type SupplyUnit = (typeof SUPPLY_UNITS)[number]

export interface CreateSupplyInput {
  farmId: string
  itemName: string
  category: SupplyCategory
  quantityKg: number
  unit: SupplyUnit
  minThresholdKg: number
  costPerUnit?: number
  supplierId?: string
  lastRestocked?: Date
  expiryDate?: Date
  notes?: string
}

export interface UpdateSupplyInput {
  itemName?: string
  category?: SupplyCategory
  quantityKg?: number
  unit?: SupplyUnit
  minThresholdKg?: number
  costPerUnit?: number
  supplierId?: string
  lastRestocked?: Date
  expiryDate?: Date
  notes?: string
}

/**
 * Validate supply creation data
 */
export function validateSupplyData(data: CreateSupplyInput): string | null {
  if (data.itemName.trim().length === 0) {
    return 'Item name cannot be empty'
  }

  if (data.quantityKg < 0) {
    return 'Quantity cannot be negative'
  }

  if (data.minThresholdKg < 0) {
    return 'Minimum threshold cannot be negative'
  }

  if (data.costPerUnit !== undefined && data.costPerUnit < 0) {
    return 'Cost per unit cannot be negative'
  }

  if (data.expiryDate && data.expiryDate <= new Date()) {
    return 'Expiry date must be in the future'
  }

  return null
}

/**
 * Validate supply update data
 */
export function validateSupplyUpdateData(
  data: UpdateSupplyInput,
): string | null {
  if (data.itemName !== undefined && data.itemName.trim().length === 0) {
    return 'Item name cannot be empty'
  }

  if (data.quantityKg !== undefined && data.quantityKg < 0) {
    return 'Quantity cannot be negative'
  }

  if (data.minThresholdKg !== undefined && data.minThresholdKg < 0) {
    return 'Minimum threshold cannot be negative'
  }

  if (data.costPerUnit !== undefined && data.costPerUnit < 0) {
    return 'Cost per unit cannot be negative'
  }

  if (data.expiryDate && data.expiryDate <= new Date()) {
    return 'Expiry date must be in the future'
  }

  return null
}

/**
 * Check if supply is low stock
 */
export function isLowStock(quantity: number, minThreshold: number): boolean {
  return quantity <= minThreshold
}

/**
 * Check if supply is expiring soon (within days)
 */
export function isExpiringSoon(
  expiryDate: Date | null,
  daysAhead: number = 30,
): boolean {
  if (!expiryDate) return false

  const now = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  return daysUntilExpiry > 0 && daysUntilExpiry <= daysAhead
}

/**
 * Check if supply is expired
 */
export function isExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return false
  return expiryDate < new Date()
}

/**
 * Calculate days until expiry
 */
export function calculateDaysUntilExpiry(
  expiryDate: Date | null,
): number | null {
  if (!expiryDate) return null

  const now = new Date()
  const days = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  return days
}

/**
 * Calculate total value of supply
 */
export function calculateTotalValue(
  quantity: number,
  costPerUnit: number | null,
): number | null {
  if (costPerUnit === null) return null
  return quantity * costPerUnit
}

/**
 * Convert quantity to database string format
 */
export function quantityToDbString(quantity: number): string {
  return quantity.toFixed(2)
}
