/**
 * Constants for monitoring service thresholds and limits
 */

// Species-specific mortality thresholds (as percentages)
export const MORTALITY_THRESHOLD_BY_SPECIES = {
  broiler: { alert: 0.03, critical: 0.08 }, // 3% alert, 8% critical
  layer: { alert: 0.02, critical: 0.05 }, // 2% alert, 5% critical
  catfish: { alert: 0.05, critical: 0.12 }, // 5% alert, 12% critical
  tilapia: { alert: 0.04, critical: 0.1 }, // 4% alert, 10% critical
  cattle: { alert: 0.01, critical: 0.03 }, // 1% alert, 3% critical
  goats: { alert: 0.02, critical: 0.05 }, // 2% alert, 5% critical
  sheep: { alert: 0.02, critical: 0.05 }, // 2% alert, 5% critical
  bees: { alert: 0.1, critical: 0.25 }, // 10% alert, 25% critical
} as const

// Default fallback thresholds
export const DEFAULT_MORTALITY_THRESHOLD = { alert: 0.05, critical: 0.1 }

// Water quality thresholds
export const PH_MIN_ACCEPTABLE = 6.0
export const PH_MAX_ACCEPTABLE = 8.5
export const AMMONIA_DANGER_THRESHOLD = 2.0 // mg/L

// Inventory thresholds
export const LOW_STOCK_WARNING_PERCENT = 10
export const LOW_STOCK_CRITICAL_PERCENT = 5

// Feed conversion ratio (FCR) targets by species
export const FCR_TARGETS_BY_SPECIES = {
  // Poultry
  broiler: 1.8,
  layer: 2.2,
  turkey: 2.5,
  duck: 2.8,

  // Fish
  catfish: 1.5,
  tilapia: 1.6,

  // Cattle
  dairy: 6.0,
  beef: 8.0,

  // Goats
  boer: 4.0,
  saanen: 4.5,

  // Sheep
  merino: 5.0,
  dorper: 4.5,

  // Bees (honey production efficiency - kg feed per kg honey)
  'apis mellifera': 2.0,
} as const

export const FCR_WARNING_MULTIPLIER = 1.2 // 20% above target
export const FCR_CRITICAL_MULTIPLIER = 1.4 // 40% above target

// Growth performance thresholds
export const GROWTH_WARNING_THRESHOLD = 0.85 // 85% of expected weight
export const GROWTH_CRITICAL_THRESHOLD = 0.7 // 70% of expected weight

// Time constants
export const VACCINATION_LOOKAHEAD_DAYS = 7
export const MORTALITY_WINDOW_HOURS = 24
