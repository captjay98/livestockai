import { db } from '~/lib/db'
import { verifyFarmAccess } from '~/lib/auth/middleware'
import { WATER_QUALITY_THRESHOLDS } from './constants'

// Re-export constants for backward compatibility
export { WATER_QUALITY_THRESHOLDS } from './constants'

export interface CreateWaterQualityInput {
  batchId: string
  date: Date
  ph: number
  temperatureCelsius: number
  dissolvedOxygenMgL: number
  ammoniaMgL: number
  notes?: string | null
}

export function isWaterQualityAlert(params: {
  ph: number
  temperatureCelsius: number
  dissolvedOxygenMgL: number
  ammoniaMgL: number
}): boolean {
  const { ph, temperatureCelsius, dissolvedOxygenMgL, ammoniaMgL } = params
  const t = WATER_QUALITY_THRESHOLDS

  return (
    ph < t.ph.min ||
    ph > t.ph.max ||
    temperatureCelsius < t.temperature.min ||
    temperatureCelsius > t.temperature.max ||
    dissolvedOxygenMgL < t.dissolvedOxygen.min ||
    ammoniaMgL > t.ammonia.max
  )
}

export function getWaterQualityIssues(params: {
  ph: number
  temperatureCelsius: number
  dissolvedOxygenMgL: number
  ammoniaMgL: number
}): string[] {
  const issues: string[] = []
  const t = WATER_QUALITY_THRESHOLDS

  if (params.ph < t.ph.min) issues.push(`pH too low (${params.ph}, min: ${t.ph.min})`)
  if (params.ph > t.ph.max) issues.push(`pH too high (${params.ph}, max: ${t.ph.max})`)
  if (params.temperatureCelsius < t.temperature.min) issues.push(`Temperature too low (${params.temperatureCelsius}°C, min: ${t.temperature.min}°C)`)
  if (params.temperatureCelsius > t.temperature.max) issues.push(`Temperature too high (${params.temperatureCelsius}°C, max: ${t.temperature.max}°C)`)
  if (params.dissolvedOxygenMgL < t.dissolvedOxygen.min) issues.push(`Dissolved oxygen too low (${params.dissolvedOxygenMgL}mg/L, min: ${t.dissolvedOxygen.min}mg/L)`)
  if (params.ammoniaMgL > t.ammonia.max) issues.push(`Ammonia too high (${params.ammoniaMgL}mg/L, max: ${t.ammonia.max}mg/L)`)

  return issues
}

export async function createWaterQualityRecord(
  userId: string,
  farmId: string,
  input: CreateWaterQualityInput
): Promise<string> {
  await verifyFarmAccess(userId, farmId)

  // Verify batch belongs to farm and is a fish batch
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId', 'livestockType'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  if (batch.livestockType !== 'fish') {
    throw new Error('Water quality records can only be created for fish batches')
  }

  const result = await db
    .insertInto('water_quality')
    .values({
      batchId: input.batchId,
      date: input.date,
      ph: input.ph.toString(),
      temperatureCelsius: input.temperatureCelsius.toString(),
      dissolvedOxygenMgL: input.dissolvedOxygenMgL.toString(),
      ammoniaMgL: input.ammoniaMgL.toString(),
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getWaterQualityForFarm(userId: string, farmId: string) {
  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'water_quality.notes',
      'water_quality.createdAt',
      'batches.species',
    ])
    .where('batches.farmId', '=', farmId)
    .where('batches.livestockType', '=', 'fish')
    .orderBy('water_quality.date', 'desc')
    .execute()
}

export async function getWaterQualityAlerts(userId: string, farmId: string) {
  await verifyFarmAccess(userId, farmId)

  // Get the most recent water quality record for each active fish batch
  const records = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'batches.species',
    ])
    .where('batches.farmId', '=', farmId)
    .where('batches.livestockType', '=', 'fish')
    .where('batches.status', '=', 'active')
    .orderBy('water_quality.date', 'desc')
    .execute()

  // Group by batch and get the most recent for each
  const latestByBatch = new Map<string, typeof records[0]>()
  for (const record of records) {
    if (!latestByBatch.has(record.batchId)) {
      latestByBatch.set(record.batchId, record)
    }
  }

  const alerts: Array<{
    batchId: string
    species: string
    issues: string[]
    severity: 'warning' | 'critical'
    date: Date
  }> = []

  for (const record of latestByBatch.values()) {
    const params = {
      ph: parseFloat(record.ph),
      temperatureCelsius: parseFloat(record.temperatureCelsius),
      dissolvedOxygenMgL: parseFloat(record.dissolvedOxygenMgL),
      ammoniaMgL: parseFloat(record.ammoniaMgL),
    }

    if (isWaterQualityAlert(params)) {
      const issues = getWaterQualityIssues(params)
      alerts.push({
        batchId: record.batchId,
        species: record.species,
        issues,
        severity: issues.length > 2 ? 'critical' : 'warning',
        date: record.date,
      })
    }
  }

  return alerts
}
