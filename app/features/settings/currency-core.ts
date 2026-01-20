/**
 * Currency utilities with decimal precision
 * Uses decimal.js for precise decimal arithmetic
 * All monetary values are stored as DECIMAL(19,2) in the database
 */

import Decimal from 'decimal.js'

// Configure Decimal.js for currency operations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

/**
 * Type alias for monetary values
 * Can be string (from DB), number, or Decimal
 */
export type MoneyInput = string | number | Decimal | undefined | null

/**
 * Create a Decimal from various input types
 * @param value Input value (string, number, or Decimal)
 * @returns Decimal instance
 */
export function toDecimal(value: MoneyInput): Decimal {
  if (value instanceof Decimal) {
    return value
  }
  if (value === undefined || value === null || value === '') {
    return new Decimal(0)
  }
  return new Decimal(value)
}

/**
 * Convert Decimal to number for display/calculations
 * @param value Decimal value
 * @returns Number representation
 */
export function toNumber(value: MoneyInput | undefined | null): number {
  if (value === undefined || value === null || value === '') {
    return 0
  }
  return toDecimal(value).toNumber()
}

/**
 * Convert to string for database storage
 * @param value Decimal value
 * @returns String with 2 decimal places
 */
export function toDbString(value: MoneyInput): string {
  return toDecimal(value).toFixed(2)
}

// Re-export Decimal for use in other modules
export { Decimal }
