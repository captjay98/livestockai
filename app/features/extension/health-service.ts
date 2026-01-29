/**
 * Pure business logic for health calculations.
 * All functions are side-effect-free and easily unit testable.
 */

export type HealthStatus = 'green' | 'amber' | 'red'
export type Species =
  | 'broiler'
  | 'layer'
  | 'catfish'
  | 'tilapia'
  | 'cattle'
  | 'goats'
  | 'sheep'

export interface HealthThresholds {
  amber: number
  red: number
}

export interface CustomThresholds {
  [species: string]: HealthThresholds
}

/**
 * Default mortality thresholds by species (percentages)
 */
export const DEFAULT_THRESHOLDS: Record<Species, HealthThresholds> = {
  broiler: { amber: 5, red: 10 },
  layer: { amber: 3, red: 7 },
  catfish: { amber: 12, red: 18 },
  tilapia: { amber: 10, red: 15 },
  cattle: { amber: 2, red: 5 },
  goats: { amber: 3, red: 6 },
  sheep: { amber: 3, red: 6 },
}

/**
 * Calculate mortality rate as percentage
 *
 * @param initialQuantity - Starting quantity of the batch
 * @param currentQuantity - Current quantity of the batch
 * @returns Mortality rate as percentage (0-100)
 */
export function calculateMortalityRate(
  initialQuantity: number,
  currentQuantity: number,
): number {
  if (initialQuantity <= 0) return 0
  const mortality = initialQuantity - currentQuantity
  return (mortality / initialQuantity) * 100
}

/**
 * Calculate health status based on mortality rate and thresholds
 *
 * @param mortalityRate - Mortality rate as percentage
 * @param species - Species type for threshold lookup
 * @param customThresholds - Optional custom thresholds override
 * @returns Health status: 'green', 'amber', or 'red'
 */
export function calculateHealthStatus(
  mortalityRate: number,
  species: Species,
  customThresholds?: CustomThresholds,
): HealthStatus {
  const thresholds = customThresholds?.[species] ?? DEFAULT_THRESHOLDS[species]

  if (mortalityRate >= thresholds.red) return 'red'
  if (mortalityRate >= thresholds.amber) return 'amber'
  return 'green'
}
