/**
 * Pure business logic for forecasting calculations.
 * All functions are side-effect-free and easily unit testable.
 */

import { addDays, differenceInDays } from 'date-fns'

/**
 * Weight sample data structure
 */
export interface WeightSample {
  averageWeightKg: number
  date: Date
}

/**
 * Growth standard data point
 */
export interface GrowthStandard {
  day: number
  expected_weight_g: number
}

/**
 * ADG calculation result
 */
export interface ADGResult {
  adgGramsPerDay: number
  method: 'two_samples' | 'single_sample' | 'growth_curve_estimate'
}

/**
 * Calculate Average Daily Gain (ADG) from weight samples
 * 
 * Handles three cases:
 * 1. Two or more samples: Calculate from most recent two
 * 2. Single sample: Calculate from acquisition to sample
 * 3. No samples: Estimate from growth curve
 * 
 * @param samples - Weight samples ordered by date (most recent first)
 * @param acquisitionDate - Date when batch was acquired
 * @param currentAgeDays - Current age of batch in days
 * @param growthStandards - Growth curve data points
 * @returns ADG in grams per day
 */
export function calculateADG(
  samples: Array<WeightSample>,
  acquisitionDate: Date,
  currentAgeDays: number,
  growthStandards: Array<GrowthStandard>,
): ADGResult {
  // Case 1: Two or more samples - use most recent two
  if (samples.length >= 2) {
    const recent = samples[0]
    const previous = samples[1]
    
    const weightDiffG = (recent.averageWeightKg - previous.averageWeightKg) * 1000
    const daysDiff = differenceInDays(recent.date, previous.date)
    
    if (daysDiff <= 0) {
      // Invalid date order, fall through to next case
      return calculateADG([samples[0]], acquisitionDate, currentAgeDays, growthStandards)
    }
    
    return {
      adgGramsPerDay: weightDiffG / daysDiff,
      method: 'two_samples',
    }
  }
  
  // Case 2: Single sample - calculate from acquisition
  if (samples.length === 1) {
    const sample = samples[0]
    const daysSinceAcquisition = differenceInDays(sample.date, acquisitionDate)
    
    if (daysSinceAcquisition <= 0) {
      // Sample date before acquisition, use growth curve estimate
      return calculateADG([], acquisitionDate, currentAgeDays, growthStandards)
    }
    
    // Assume initial weight is 0 or very small (day-old chick ~40g, fingerling ~1g)
    // For simplicity, calculate from 0
    const weightG = sample.averageWeightKg * 1000
    
    return {
      adgGramsPerDay: weightG / daysSinceAcquisition,
      method: 'single_sample',
    }
  }
  
  // Case 3: No samples - estimate from growth curve slope
  return {
    adgGramsPerDay: calculateExpectedADG(currentAgeDays, growthStandards),
    method: 'growth_curve_estimate',
  }
}

/**
 * Calculate expected ADG from growth curve at a specific age
 * 
 * Uses the slope of the growth curve around the current age
 * 
 * @param ageDays - Current age in days
 * @param growthStandards - Growth curve data points
 * @returns Expected ADG in grams per day
 */
export function calculateExpectedADG(
  ageDays: number,
  growthStandards: Array<GrowthStandard>,
): number {
  if (growthStandards.length === 0) return 0
  
  // Find the two points surrounding current age
  const before = growthStandards
    .filter(s => s.day <= ageDays)
    .sort((a, b) => b.day - a.day)[0]
  
  const after = growthStandards
    .filter(s => s.day > ageDays)
    .sort((a, b) => a.day - b.day)[0]
  
  // If we have both points, calculate slope
  if (before && after) {
    const weightDiff = after.expected_weight_g - before.expected_weight_g
    const daysDiff = after.day - before.day
    return weightDiff / daysDiff
  }
  
  // If only before point, use slope from previous point
  if (before) {
    const beforeBefore = growthStandards
      .filter(s => s.day < before.day)
      .sort((a, b) => b.day - a.day)[0]
    
    if (beforeBefore) {
      const weightDiff = before.expected_weight_g - beforeBefore.expected_weight_g
      const daysDiff = before.day - beforeBefore.day
      return weightDiff / daysDiff
    }
  }
  
  // If only after point, use slope to next point
  if (after) {
    const afterAfter = growthStandards
      .filter(s => s.day > after.day)
      .sort((a, b) => a.day - b.day)[0]
    
    if (afterAfter) {
      const weightDiff = afterAfter.expected_weight_g - after.expected_weight_g
      const daysDiff = afterAfter.day - after.day
      return weightDiff / daysDiff
    }
  }
  
  // Fallback: use average slope across entire curve
  if (growthStandards.length >= 2) {
    const first = growthStandards[0]
    const last = growthStandards[growthStandards.length - 1]
    const weightDiff = last.expected_weight_g - first.expected_weight_g
    const daysDiff = last.day - first.day
    return weightDiff / daysDiff
  }
  
  return 0
}

/**
 * Calculate Performance Index as percentage
 * 
 * Performance Index = (actual_weight / expected_weight) * 100
 * 
 * @param actualWeightG - Actual weight in grams
 * @param expectedWeightG - Expected weight in grams
 * @returns Performance Index as percentage (e.g., 105 means 5% ahead)
 */
export function calculatePerformanceIndex(
  actualWeightG: number,
  expectedWeightG: number,
): number {
  if (expectedWeightG <= 0) return 0
  return (actualWeightG / expectedWeightG) * 100
}

/**
 * Classify batch status based on Performance Index
 * 
 * @param performanceIndex - Performance Index percentage
 * @returns Status classification
 */
export function classifyStatus(
  performanceIndex: number,
): 'on_track' | 'behind' | 'ahead' {
  if (performanceIndex < 95) return 'behind'
  if (performanceIndex > 105) return 'ahead'
  return 'on_track'
}

/**
 * Calculate deviation percentage from expected
 * 
 * @param actualWeightG - Actual weight in grams
 * @param expectedWeightG - Expected weight in grams
 * @returns Deviation percentage (positive = ahead, negative = behind)
 */
export function calculateDeviationPercent(
  actualWeightG: number,
  expectedWeightG: number,
): number {
  if (expectedWeightG <= 0) return 0
  return ((actualWeightG - expectedWeightG) / expectedWeightG) * 100
}

/**
 * Project harvest date based on current weight and ADG
 * 
 * @param currentWeightG - Current weight in grams
 * @param targetWeightG - Target harvest weight in grams
 * @param adgGramsPerDay - Average daily gain in grams per day
 * @param currentDate - Current date
 * @returns Projected harvest date and days remaining
 */
export function projectHarvestDate(
  currentWeightG: number,
  targetWeightG: number,
  adgGramsPerDay: number,
  currentDate: Date = new Date(),
): { harvestDate: Date; daysRemaining: number } | null {
  // Edge case: Already at or above target weight
  if (currentWeightG >= targetWeightG) {
    return {
      harvestDate: currentDate,
      daysRemaining: 0,
    }
  }
  
  // Edge case: Zero or negative ADG (not growing)
  if (adgGramsPerDay <= 0) {
    return null
  }
  
  const weightToGain = targetWeightG - currentWeightG
  const daysRemaining = Math.ceil(weightToGain / adgGramsPerDay)
  const harvestDate = addDays(currentDate, daysRemaining)
  
  return {
    harvestDate,
    daysRemaining,
  }
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  day: number
  expectedWeightG: number
  actualWeightG: number | null
  deviationPercent: number | null
}

/**
 * Generate chart data for growth visualization
 * 
 * Creates data points for each day from acquisition to current + projection
 * 
 * @param acquisitionDate - Date when batch was acquired
 * @param currentAgeDays - Current age in days
 * @param growthStandards - Growth curve data points
 * @param weightSamples - Actual weight samples
 * @param projectionDays - Number of days to project into future
 * @returns Array of chart data points
 */
export function generateChartData(
  acquisitionDate: Date,
  currentAgeDays: number,
  growthStandards: Array<GrowthStandard>,
  weightSamples: Array<WeightSample>,
  projectionDays: number = 14,
): Array<ChartDataPoint> {
  const dataPoints: Array<ChartDataPoint> = []
  
  // Generate points for each day in growth standards up to current age + projection
  const maxDay = currentAgeDays + projectionDays
  
  for (const standard of growthStandards) {
    if (standard.day > maxDay) break
    
    // Find actual weight sample for this day (if exists)
    const sampleDate = addDays(acquisitionDate, standard.day)
    const sample = weightSamples.find(s => 
      differenceInDays(s.date, sampleDate) === 0
    )
    
    const actualWeightG = sample ? sample.averageWeightKg * 1000 : null
    const deviationPercent = actualWeightG 
      ? calculateDeviationPercent(actualWeightG, standard.expected_weight_g)
      : null
    
    dataPoints.push({
      day: standard.day,
      expectedWeightG: standard.expected_weight_g,
      actualWeightG,
      deviationPercent,
    })
  }
  
  return dataPoints
}
