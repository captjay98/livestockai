/**
 * Weight validation for age-appropriate livestock weights
 */

import type { LivestockType } from '~/features/modules/types'

/**
 * Age-appropriate weight ranges by livestock type and age in days
 * Values in grams for consistency
 */
const WEIGHT_RANGES = {
  poultry: {
    broiler: [
      { minDays: 0, maxDays: 7, minWeight: 35, maxWeight: 50 },
      { minDays: 8, maxDays: 14, minWeight: 80, maxWeight: 120 },
      { minDays: 15, maxDays: 21, minWeight: 200, maxWeight: 300 },
      { minDays: 22, maxDays: 35, minWeight: 800, maxWeight: 1200 },
      { minDays: 36, maxDays: 49, minWeight: 1800, maxWeight: 2500 },
    ],
    layer: [
      { minDays: 0, maxDays: 7, minWeight: 35, maxWeight: 50 },
      { minDays: 8, maxDays: 56, minWeight: 80, maxWeight: 800 },
      { minDays: 57, maxDays: 140, minWeight: 800, maxWeight: 1500 },
      { minDays: 141, maxDays: 365, minWeight: 1500, maxWeight: 2000 },
    ],
  },
  fish: {
    catfish: [
      { minDays: 0, maxDays: 30, minWeight: 1, maxWeight: 10 },
      { minDays: 31, maxDays: 90, minWeight: 10, maxWeight: 100 },
      { minDays: 91, maxDays: 180, minWeight: 100, maxWeight: 500 },
      { minDays: 181, maxDays: 365, minWeight: 500, maxWeight: 1500 },
    ],
    tilapia: [
      { minDays: 0, maxDays: 30, minWeight: 0.5, maxWeight: 5 },
      { minDays: 31, maxDays: 90, minWeight: 5, maxWeight: 50 },
      { minDays: 91, maxDays: 180, minWeight: 50, maxWeight: 300 },
      { minDays: 181, maxDays: 365, minWeight: 300, maxWeight: 800 },
    ],
  },
} as const

/**
 * Validate if weight is appropriate for livestock age
 * @param livestockType - Type of livestock
 * @param species - Species name (lowercase)
 * @param ageInDays - Age in days since acquisition
 * @param weightInGrams - Weight in grams
 * @returns Validation error message or null if valid
 */
export function validateWeightForAge(
  livestockType: LivestockType,
  species: string,
  ageInDays: number,
  weightInGrams: number,
): string | null {
  if (ageInDays < 0) {
    return 'Age cannot be negative'
  }

  if (weightInGrams <= 0) {
    return 'Weight must be positive'
  }

  // Only validate for livestock types we have data for
  if (livestockType !== 'poultry' && livestockType !== 'fish') {
    return null
  }

  const speciesKey = species.toLowerCase()
  const livestockRanges = WEIGHT_RANGES[livestockType]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime check for unknown species
  if (!livestockRanges || !(speciesKey in livestockRanges)) {
    // No validation data for this species - allow any positive weight
    return null
  }

  const ranges = livestockRanges[speciesKey as keyof typeof livestockRanges]

  // Find appropriate age range
  const ageRange = (
    ranges as Array<{
      minDays: number
      maxDays: number
      minWeight?: number
      maxWeight?: number
    }>
  ).find(
    (range: {
      minDays: number
      maxDays: number
      minWeight?: number
      maxWeight?: number
    }) => ageInDays >= range.minDays && ageInDays <= range.maxDays,
  )

  if (!ageRange) {
    // Age outside known ranges - allow but warn
    return null
  }

  if (weightInGrams < (ageRange.minWeight ?? 0)) {
    return `Weight ${weightInGrams}g is below expected range (${ageRange.minWeight ?? 0}g - ${ageRange.maxWeight ?? 0}g) for ${species} at ${ageInDays} days old`
  }

  if (weightInGrams > (ageRange.maxWeight ?? 0) * 2) {
    return `Weight ${weightInGrams}g is significantly above expected range (${ageRange.minWeight ?? 0}g - ${ageRange.maxWeight ?? 0}g) for ${species} at ${ageInDays} days old`
  }

  return null
}
