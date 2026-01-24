// Species-specific water quality thresholds
// Different fish species have different tolerance ranges
export const WATER_QUALITY_THRESHOLDS_BY_SPECIES: {
  [key: string]:
    | {
        ph: { min: number; max: number }
        temperature: { min: number; max: number }
        dissolvedOxygen: { min: number; max: number }
        ammonia: { min: number; max: number }
      }
    | undefined
} = {
  catfish: {
    ph: { min: 6.5, max: 8.5 },
    temperature: { min: 25, max: 32 },
    dissolvedOxygen: { min: 3, max: Infinity },
    ammonia: { min: 0, max: 0.5 },
  },
  tilapia: {
    ph: { min: 6.0, max: 9.0 },
    temperature: { min: 22, max: 30 },
    dissolvedOxygen: { min: 4, max: Infinity },
    ammonia: { min: 0, max: 0.3 },
  },
  carp: {
    ph: { min: 6.5, max: 9.0 },
    temperature: { min: 20, max: 28 },
    dissolvedOxygen: { min: 4, max: Infinity },
    ammonia: { min: 0, max: 0.2 },
  },
  trout: {
    ph: { min: 6.5, max: 8.5 },
    temperature: { min: 10, max: 18 },
    dissolvedOxygen: { min: 6, max: Infinity },
    ammonia: { min: 0, max: 0.02 },
  },
}

// Default thresholds (used when species not specified or unknown)
export const WATER_QUALITY_THRESHOLDS = {
  ph: { min: 6.5, max: 9.0 },
  temperature: { min: 25, max: 30 },
  dissolvedOxygen: { min: 5, max: Infinity },
  ammonia: { min: 0, max: 0.02 },
}

/**
 * Get water quality thresholds for a specific species
 */
export function getThresholdsForSpecies(species: string) {
  const normalized = species.toLowerCase()
  const speciesThresholds = WATER_QUALITY_THRESHOLDS_BY_SPECIES[normalized]
  return speciesThresholds ?? WATER_QUALITY_THRESHOLDS
}
