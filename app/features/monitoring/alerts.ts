import { differenceInDays, subHours } from 'date-fns'
import { getUserFarms } from '../auth/utils'

export type AlertType = 'critical' | 'warning' | 'info'
export type AlertSource =
  | 'mortality'
  | 'water_quality'
  | 'feed'
  | 'vaccination'
  | 'inventory'
  | 'growth'

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
  const { db } = await import('~/lib/db')
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
  const { db } = await import('~/lib/db')
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
  const results = await Promise.all(
    batches.map((batch) => analyzeBatch(batch, userId)),
  )
  const alerts = results.flat()

  // Create notifications for critical alerts based on user preferences
  const settings = await db
    .selectFrom('user_settings')
    .select(['notifications'])
    .where('userId', '=', userId)
    .executeTakeFirst()

  if (settings && alerts.length > 0) {
    const { createNotification } = await import('../notifications/server')
    const notifPrefs = settings.notifications

    for (const alert of alerts) {
      // Only create notifications for critical alerts
      if (alert.type !== 'critical') continue

      // Check if user wants this type of notification
      if (alert.source === 'mortality' && notifPrefs.highMortality) {
        const batch = batches.find((b) => b.id === alert.batchId)
        await createNotification({
          userId,
          farmId: farmId || null,
          type: 'highMortality',
          title: 'High Mortality Alert',
          message: alert.message,
          actionUrl: `/batches/${alert.batchId}`,
          metadata: { batchId: alert.batchId, species: batch?.species },
        })
      }
    }
  }

  return alerts
}

/**
 * Core analysis logic for a batch
 */
async function analyzeBatch(
  batch: {
    id: string
    species: string
    currentQuantity: number
    initialQuantity: number
  },
  userId?: string,
): Promise<Array<BatchAlert>> {
  const { db } = await import('~/lib/db')
  const alerts: Array<BatchAlert> = []
  const twentyFourHoursAgo = subHours(new Date(), 24)

  // Get user's mortality alert thresholds
  let mortalityAlertPercent = 5 // default
  let mortalityAlertQuantity = 10 // default
  if (userId) {
    const settings = await db
      .selectFrom('user_settings')
      .select(['mortalityAlertPercent', 'mortalityAlertQuantity'])
      .where('userId', '=', userId)
      .executeTakeFirst()
    if (settings) {
      mortalityAlertPercent = settings.mortalityAlertPercent
      mortalityAlertQuantity = settings.mortalityAlertQuantity
    }
  }

  // 1. Check Sudden Death (Mortality > threshold% in 24h OR > threshold quantity)
  const recentMortality = await db
    .selectFrom('mortality_records')
    .select(({ fn }) => [fn.sum<number>('quantity').as('run_total')])
    .where('batchId', '=', batch.id)
    .where('date', '>=', twentyFourHoursAgo)
    .executeTakeFirst()

  const deadInLast24h = Number(recentMortality?.run_total || 0)
  const dailyMortalityRate =
    batch.currentQuantity > 0 ? deadInLast24h / batch.currentQuantity : 0

  if (
    dailyMortalityRate > mortalityAlertPercent / 100 ||
    deadInLast24h > mortalityAlertQuantity
  ) {
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

  // 2. Check Total Mortality (> 5% total is concerning)
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

  // 6. Check Feed Conversion Ratio (FCR)
  const batchDetails = await db
    .selectFrom('batches')
    .select(['acquisitionDate'])
    .where('id', '=', batch.id)
    .executeTakeFirst()

  if (batchDetails) {
    const totalFeedRes = await db
      .selectFrom('feed_records')
      .select(({ fn }) => [fn.sum<string>('quantityKg').as('totalKg')])
      .where('batchId', '=', batch.id)
      .executeTakeFirst()

    const latestWeight = await db
      .selectFrom('weight_samples')
      .select(['averageWeightKg'])
      .where('batchId', '=', batch.id)
      .orderBy('date', 'desc')
      .limit(1)
      .executeTakeFirst()

    const totalFeedKg = parseFloat(totalFeedRes?.totalKg || '0')
    const avgWeightKg = parseFloat(latestWeight?.averageWeightKg || '0')

    if (totalFeedKg > 0 && avgWeightKg > 0 && batch.currentQuantity > 0) {
      const totalWeightGainKg = avgWeightKg * batch.currentQuantity
      const fcr = totalFeedKg / totalWeightGainKg

      // Industry standards: Broiler FCR ~1.6-1.8, Catfish FCR ~1.2-1.5
      const targetFcr = batch.species.toLowerCase().includes('catfish')
        ? 1.5
        : 1.8

      if (fcr > targetFcr * 1.2) {
        alerts.push({
          id: `fcr-high-${batch.id}`,
          batchId: batch.id,
          species: batch.species,
          type: fcr > targetFcr * 1.4 ? 'critical' : 'warning',
          source: 'feed',
          message: `High FCR: ${fcr.toFixed(2)} (target: ${targetFcr})`,
          timestamp: new Date(),
          value: fcr,
          metadata: { targetFcr, actualFcr: fcr },
        })
      }
    }
  }

  // 7. Check Growth Performance vs Standards
  const growthStandard = await db
    .selectFrom('growth_standards')
    .select(['id', 'species', 'day', 'expected_weight_g'])
    .where('species', '=', batch.species)
    .execute()

  if (growthStandard.length > 0 && batchDetails) {
    const ageInDays = differenceInDays(new Date(), batchDetails.acquisitionDate)
    const ageInWeeks = Math.floor(ageInDays / 7)

    const expectedStandard = growthStandard.find((g) => g.day === ageInDays)
    const latestWeight = await db
      .selectFrom('weight_samples')
      .select(['averageWeightKg'])
      .where('batchId', '=', batch.id)
      .orderBy('date', 'desc')
      .limit(1)
      .executeTakeFirst()

    if (expectedStandard && latestWeight) {
      const expectedKg = expectedStandard.expected_weight_g / 1000 // Convert grams to kg
      const actualKg = parseFloat(latestWeight.averageWeightKg)
      const performanceRatio = actualKg / expectedKg

      if (performanceRatio < 0.85) {
        alerts.push({
          id: `growth-behind-${batch.id}`,
          batchId: batch.id,
          species: batch.species,
          type: performanceRatio < 0.7 ? 'critical' : 'warning',
          source: 'growth',
          message: `Underweight: ${(performanceRatio * 100).toFixed(0)}% of target (${actualKg.toFixed(2)}kg vs ${expectedKg.toFixed(2)}kg)`,
          timestamp: new Date(),
          value: performanceRatio * 100,
          metadata: { expectedKg, actualKg, ageWeeks: ageInWeeks },
        })
      }
    }
  }

  return alerts
}
