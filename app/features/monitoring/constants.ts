/**
 * Constants for monitoring service thresholds and limits
 */

// Species-specific mortality thresholds (as percentages)
export const MORTALITY_THRESHOLD_BY_SPECIES = {
  broiler: { alert: 0.03, critical: 0.08 }, // 3% alert, 8% critical
  layer: { alert: 0.05, critical: 0.1 }, // 5% alert, 10% critical (adjusted for 18-month cycle)
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

// Dissolved Oxygen thresholds (mg/L) - critical for fish survival
export const DO_CRITICAL_MIN = 3.0 // Below this = mass mortality risk
export const DO_WARNING_MIN = 4.0 // Below this = stress and slow growth

// Water temperature thresholds (Celsius)
export const WATER_TEMP_CATFISH_MIN = 25
export const WATER_TEMP_CATFISH_MAX = 32
export const WATER_TEMP_CATFISH_CRITICAL_MIN = 20
export const WATER_TEMP_CATFISH_CRITICAL_MAX = 35

export const WATER_TEMP_TILAPIA_MIN = 28
export const WATER_TEMP_TILAPIA_MAX = 34
export const WATER_TEMP_TILAPIA_CRITICAL_MIN = 22
export const WATER_TEMP_TILAPIA_CRITICAL_MAX = 36

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
  'guinea fowl': 2.5,
  'local chicken': 3.0, // Indigenous breeds less efficient

  // Fish
  catfish: 1.5,
  tilapia: 1.6,
  'african catfish': 1.4, // Clarias gariepinus (most common in Nigeria)
  'hybrid catfish': 1.3, // Heteroclarias

  // Cattle
  dairy: 6.0,
  beef: 8.0,

  // Goats
  boer: 4.0,
  saanen: 4.5,
  'west african dwarf': 5.0, // WAD goat (most common in Nigeria)
  'red sokoto': 4.5,

  // Sheep
  merino: 5.0,
  dorper: 4.5,
  'west african dwarf sheep': 5.5,
  yankasa: 5.0,
  uda: 4.8,

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
