/**
 * Consolidated calculation utilities for livestock management.
 * All functions are pure and easily testable.
 */

/**
 * Calculate Feed Conversion Ratio (FCR)
 * FCR = Total Feed Consumed / Total Weight Gain
 * Lower FCR is better (more efficient feed conversion)
 *
 * @param totalFeedKg - Total feed consumed in kilograms
 * @param weightGainKg - Total weight gain in kilograms
 * @returns FCR as a number rounded to 2 decimals, or null if calculation is not possible
 */
export function calculateFCR(
  totalFeedKg: number,
  weightGainKg: number,
): number | null {
  if (totalFeedKg <= 0 || weightGainKg <= 0) {
    return null
  }
  const fcr = totalFeedKg / weightGainKg
  return Math.round(fcr * 100) / 100
}

/**
 * Calculate mortality rate for a batch
 * Returns percentage of initial stock that died
 *
 * @param initialQuantity - Starting quantity of the batch
 * @param totalMortality - Total number of deaths recorded
 * @returns Mortality rate as a percentage (0-100+)
 */
export function calculateMortalityRate(
  initialQuantity: number,
  totalMortality: number,
): number {
  if (initialQuantity <= 0) {
    return 0
  }
  return (totalMortality / initialQuantity) * 100
}
