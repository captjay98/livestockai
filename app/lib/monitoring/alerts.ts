import { subHours } from 'date-fns'
import { db } from '../db'
import { getUserFarms } from '../auth/utils'

export type AlertType = 'critical' | 'warning' | 'info'
export type AlertSource =
  | 'mortality'
  | 'water_quality'
  | 'feed'
  | 'vaccination'
  | 'inventory'

export interface BatchAlert {
  id: string
  batchId: string
  species: string
  type: AlertType
  source: AlertSource
  message: string
  timestamp: Date
  value?: number
  metadata?: Record<string, any>
}

/**
 * Check a single batch for critical health anomalies
 */
export async function checkBatchHealth(
  batchId: string,
): Promise<Array<BatchAlert>> {
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'species', 'currentQuantity', 'initialQuantity'])
    .where('id', '=', batchId)
    .executeTakeFirst()

  if (!batch || batch.currentQuantity === 0) return []
  return analyzeBatch(batch)
}

/**
 * Get all health alerts for a user (optionally filtered by farm)
 * Optimized to minimize DB queries
 */
export async function getAllBatchAlerts(
  userId: string,
  farmId?: string,
): Promise<Array<BatchAlert>> {
  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  // Get active batches
  const batches = await db
    .selectFrom('batches')
    .select(['id', 'species', 'currentQuantity', 'initialQuantity'])
    .where('farmId', 'in', targetFarmIds)
    .where('status', '=', 'active')
    .execute()

  if (batches.length === 0) return []

  // Run analysis in parallel
  const results = await Promise.all(batches.map((batch) => analyzeBatch(batch)))
  return results.flat()
}

/**
 * Core analysis logic for a batch
 */
async function analyzeBatch(batch: {
  id: string
  species: string
  currentQuantity: number
  initialQuantity: number
}): Promise<Array<BatchAlert>> {
  const alerts: Array<BatchAlert> = []
  const twentyFourHoursAgo = subHours(new Date(), 24)

  // 1. Check Sudden Death (Mortality > 1.5% in 24h)
  const recentMortality = await db
    .selectFrom('mortality_records')
    .select(({ fn }) => [fn.sum<number>('quantity').as('run_total')])
    .where('batchId', '=', batch.id)
    .where('date', '>=', twentyFourHoursAgo)
    .executeTakeFirst()

  const deadInLast24h = Number(recentMortality?.run_total || 0)
  const dailyMortalityRate =
    batch.currentQuantity > 0 ? deadInLast24h / batch.currentQuantity : 0

  if (dailyMortalityRate > 0.015) {
    alerts.push({
      id: `mortality-sudden-${batch.id}-${Date.now()}`,
      batchId: batch.id,
      species: batch.species,
      type: 'critical',
      source: 'mortality',
      message: `Sudden Death: ${deadInLast24h} deaths in 24h (${(dailyMortalityRate * 100).toFixed(1)}%)`,
      timestamp: new Date(),
      value: dailyMortalityRate * 100,
    })
  }

  // 2. Check Total Mortality (Legacy Rule: > 5% total)
  const totalMortalityRes = await db
    .selectFrom('mortality_records')
    .select(({ fn }) => [fn.sum<number>('quantity').as('total')])
    .where('batchId', '=', batch.id)
    .executeTakeFirst()

  const totalDead = Number(totalMortalityRes?.total || 0)
  const totalRate =
    batch.initialQuantity > 0 ? totalDead / batch.initialQuantity : 0

  if (totalRate > 0.05) {
    alerts.push({
      id: `mortality-total-${batch.id}`,
      batchId: batch.id,
      species: batch.species,
      type: totalRate > 0.1 ? 'critical' : 'warning',
      source: 'mortality',
      message: `High Cumulative Mortality: ${(totalRate * 100).toFixed(1)}%`,
      timestamp: new Date(),
      value: totalRate * 100,
    })
  }

  // 3. Check Water Quality (Most recent record)
  const recentWater = await db
    .selectFrom('water_quality')
    .selectAll()
    .where('batchId', '=', batch.id)
    .orderBy('date', 'desc')
    .limit(1)
    .executeTakeFirst()

  if (recentWater) {
    const ph = parseFloat(recentWater.ph)
    const ammonia = parseFloat(recentWater.ammoniaMgL)

    if (ph < 6.0 || ph > 8.5) {
      alerts.push({
        id: `ph-${batch.id}-${Date.now()}`,
        batchId: batch.id,
        species: batch.species,
        type: 'warning',
        source: 'water_quality',
        message: `Abnormal pH Level: ${ph.toFixed(1)}`,
        timestamp: recentWater.date,
        value: ph,
      })
    }

    if (ammonia > 2.0) {
      alerts.push({
        id: `ammonia-${batch.id}-${Date.now()}`,
        batchId: batch.id,
        species: batch.species,
        type: 'critical',
        source: 'water_quality',
        message: `Dangerous Ammonia: ${ammonia.toFixed(2)} mg/L`,
        timestamp: recentWater.date,
        value: ammonia,
      })
    }
  }

  // 4. Check Vaccinations (Overdue & Upcoming)
  const now = new Date()
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const pendingVaccinations = await db
    .selectFrom('vaccinations')
    .select(['id', 'vaccineName', 'nextDueDate'])
    .where('batchId', '=', batch.id)
    .where('nextDueDate', 'is not', null)
    .execute()

  for (const v of pendingVaccinations) {
    if (!v.nextDueDate) continue

    if (v.nextDueDate < now) {
      alerts.push({
        id: `vax-overdue-${v.id}`,
        batchId: batch.id,
        species: batch.species,
        type: 'critical',
        source: 'vaccination',
        message: `Overdue Vaccine: ${v.vaccineName}`,
        timestamp: v.nextDueDate,
        metadata: { vaccineName: v.vaccineName, dueDate: v.nextDueDate },
      })
    } else if (v.nextDueDate <= sevenDaysFromNow) {
      alerts.push({
        id: `vax-upcoming-${v.id}`,
        batchId: batch.id,
        species: batch.species,
        type: 'info',
        source: 'vaccination',
        message: `Upcoming Vaccine: ${v.vaccineName}`,
        timestamp: v.nextDueDate,
        metadata: { vaccineName: v.vaccineName, dueDate: v.nextDueDate },
      })
    }
  }

  // 5. Check Low Stock (< 10% remaining)
  const remainingPercentage =
    batch.initialQuantity > 0
      ? (batch.currentQuantity / batch.initialQuantity) * 100
      : 0

  if (remainingPercentage < 10 && remainingPercentage > 0) {
    alerts.push({
      id: `low-stock-${batch.id}`,
      batchId: batch.id,
      species: batch.species,
      type: remainingPercentage < 5 ? 'critical' : 'warning',
      source: 'inventory',
      message: `Low Stock: ${remainingPercentage.toFixed(1)}% remaining`,
      timestamp: new Date(),
      value: remainingPercentage,
    })
  }

  return alerts
}
