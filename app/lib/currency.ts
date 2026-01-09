/**
 * Currency utilities for Nigerian Naira
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
export type MoneyInput = string | number | Decimal

/**
 * Create a Decimal from various input types
 * @param value Input value (string, number, or Decimal)
 * @returns Decimal instance
 */
export function toDecimal(value: MoneyInput): Decimal {
  if (value instanceof Decimal) {
    return value
  }
  return new Decimal(value)
}

/**
 * Convert Decimal to number for display/calculations
 * @param value Decimal value
 * @returns Number representation
 */
export function toNumber(value: MoneyInput): number {
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

/**
 * Format amount as Nigerian Naira currency string
 * @param amount Amount in Naira (string, number, or Decimal)
 * @returns Formatted currency string (e.g., "₦1,500.00")
 */
export function formatNaira(amount: MoneyInput): string {
  const value = toNumber(amount)
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Parse a Naira string to Decimal
 * @param nairaString String like "1,500.50" or "₦1,500.50"
 * @returns Decimal amount, or null if invalid
 */
export function parseNaira(nairaString: string): Decimal | null {
  // Remove currency symbol, spaces, and commas
  const cleaned = nairaString.replace(/[₦\s,]/g, '')

  try {
    const decimal = new Decimal(cleaned)

    // Return null if negative
    if (decimal.isNegative()) {
      return null
    }

    return decimal
  } catch {
    return null
  }
}

/**
 * Format amount as compact number (e.g., "1.5K", "2.3M", "8,500")
 * @param num Number to format
 * @returns Compact formatted number string
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  } else {
    return num.toLocaleString()
  }
}

/**
 * Format amount as compact currency (e.g., "₦1.5K", "₦2.3M")
 * @param amount Amount in Naira
 * @returns Compact formatted currency string
 */
export function formatNairaCompact(amount: MoneyInput): string {
  const value = toNumber(amount)

  if (value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(1)}M`
  } else if (value >= 1_000) {
    return `₦${(value / 1_000).toFixed(1)}K`
  } else {
    return formatNaira(amount)
  }
}

/**
 * Calculate percentage of one amount relative to another
 * @param part Amount (numerator)
 * @param total Amount (denominator)
 * @returns Percentage (0-100), or 0 if total is 0
 */
export function calculatePercentage(
  part: MoneyInput,
  total: MoneyInput,
): number {
  const partDecimal = toDecimal(part)
  const totalDecimal = toDecimal(total)

  if (totalDecimal.isZero()) return 0

  return partDecimal
    .dividedBy(totalDecimal)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber()
}

/**
 * Add multiple amounts safely using Decimal arithmetic
 * @param amounts Array of amounts
 * @returns Sum as Decimal
 */
export function sumAmounts(...amounts: Array<MoneyInput>): Decimal {
  return amounts.reduce<Decimal>(
    (sum, amount) => sum.plus(toDecimal(amount)),
    new Decimal(0),
  )
}

/**
 * Multiply two amounts (e.g., quantity * unit_price)
 * @param a First amount
 * @param b Second amount
 * @returns Product as Decimal
 */
export function multiply(a: MoneyInput, b: MoneyInput): Decimal {
  return toDecimal(a).times(toDecimal(b))
}

/**
 * Divide two amounts
 * @param a Dividend
 * @param b Divisor
 * @returns Quotient as Decimal, or null if dividing by zero
 */
export function divide(a: MoneyInput, b: MoneyInput): Decimal | null {
  const divisor = toDecimal(b)
  if (divisor.isZero()) return null
  return toDecimal(a).dividedBy(divisor)
}

/**
 * Subtract amounts
 * @param a Amount to subtract from
 * @param b Amount to subtract
 * @returns Difference as Decimal
 */
export function subtract(a: MoneyInput, b: MoneyInput): Decimal {
  return toDecimal(a).minus(toDecimal(b))
}

/**
 * Validate that an amount is non-negative
 * @param amount Amount to validate
 * @returns True if valid (>= 0), false otherwise
 */
export function isValidAmount(amount: MoneyInput): boolean {
  try {
    const decimal = toDecimal(amount)
    return !decimal.isNegative()
  } catch {
    return false
  }
}

/**
 * Round amount to 2 decimal places (for currency)
 * @param amount Amount to round
 * @returns Rounded Decimal
 */
export function roundCurrency(amount: MoneyInput): Decimal {
  return toDecimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

/**
 * Compare two amounts
 * @param a First amount
 * @param b Second amount
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compare(a: MoneyInput, b: MoneyInput): -1 | 0 | 1 {
  const result = toDecimal(a).comparedTo(toDecimal(b))
  return result as -1 | 0 | 1
}

/**
 * Check if two amounts are equal
 * @param a First amount
 * @param b Second amount
 * @returns True if equal
 */
export function equals(a: MoneyInput, b: MoneyInput): boolean {
  return toDecimal(a).equals(toDecimal(b))
}

// Legacy compatibility - these map old kobo functions to new Naira-based ones
// Can be removed once all code is migrated

/**
 * @deprecated Use toDecimal() instead. This is for backward compatibility.
 * Convert Naira to kobo (now just returns the value as-is since we use Naira)
 */
export function nairaToKobo(naira: number): number {
  return naira
}

/**
 * @deprecated Use toNumber() instead. This is for backward compatibility.
 * Convert kobo to Naira (now just returns the value as-is since we use Naira)
 */
export function koboToNaira(kobo: number): number {
  return kobo
}

// Re-export Decimal for use in other modules
export { Decimal }
