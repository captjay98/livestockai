export interface MortalityData {
  farmId: string
  species: string
  livestockType: string
  mortalityRate: number
  districtId: string
}

export interface OutbreakThresholds {
  watchThreshold: number // Minimum mortality rate to trigger watch
  alertThreshold: number // Minimum mortality rate to trigger alert
  criticalThreshold: number // Minimum mortality rate to trigger critical
  minFarmsWatch: number // Minimum farms for watch level
  minFarmsAlert: number // Minimum farms for alert level
  minFarmsCritical: number // Minimum farms for critical level
}

export interface OutbreakPattern {
  districtId: string
  species: string
  livestockType: string
  affectedFarms: Array<{
    farmId: string
    mortalityRate: number
  }>
  averageMortalityRate: number
  severity: 'watch' | 'alert' | 'critical'
}

export function detectOutbreaks(
  mortalityData: Array<MortalityData>,
  thresholds: OutbreakThresholds,
): Array<OutbreakPattern> {
  // Group by district, species, and livestock type
  const groups = new Map<string, Array<MortalityData>>()

  for (const data of mortalityData) {
    const key = `${data.districtId}:${data.species}:${data.livestockType}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(data)
  }

  const patterns: Array<OutbreakPattern> = []

  for (const [key, farmData] of groups) {
    const [districtId, species, livestockType] = key.split(':')

    // Filter farms above watch threshold
    const affectedFarms = farmData
      .filter((farm) => farm.mortalityRate >= thresholds.watchThreshold)
      .map((farm) => ({
        farmId: farm.farmId,
        mortalityRate: farm.mortalityRate,
      }))

    if (affectedFarms.length === 0) continue

    const averageMortalityRate =
      affectedFarms.reduce((sum, farm) => sum + farm.mortalityRate, 0) /
      affectedFarms.length

    const severity = classifySeverity(
      affectedFarms.length,
      averageMortalityRate,
      thresholds,
    )

    patterns.push({
      districtId,
      species,
      livestockType,
      affectedFarms,
      averageMortalityRate,
      severity,
    })
  }

  return patterns
}

export function classifySeverity(
  farmCount: number,
  averageMortalityRate: number,
  thresholds: OutbreakThresholds,
): 'watch' | 'alert' | 'critical' {
  if (
    farmCount >= thresholds.minFarmsCritical &&
    averageMortalityRate >= thresholds.criticalThreshold
  ) {
    return 'critical'
  }

  if (
    farmCount >= thresholds.minFarmsAlert &&
    averageMortalityRate >= thresholds.alertThreshold
  ) {
    return 'alert'
  }

  return 'watch'
}

export function shouldCreateAlert(
  pattern: OutbreakPattern,
  existingAlerts: Array<{
    species: string
    livestockType: string
    status: string
  }>,
): boolean {
  // Don't create if there's already an active alert for this species/type
  return !existingAlerts.some(
    (alert) =>
      alert.species === pattern.species &&
      alert.livestockType === pattern.livestockType &&
      alert.status === 'active',
  )
}
