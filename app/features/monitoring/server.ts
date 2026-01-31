/**
 * Server functions for monitoring alerts.
 * Handles orchestration of data fetching and alert generation.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getUserFarms } from '../auth/utils'
import {
  getBatchForMonitoring,
  getBatchesForMonitoring,
  getFeedRecords,
  getGrowthStandards,
  getPendingVaccinations,
  getRecentMortality,
  getRecentMortalityBatch,
  getRecentWaterQuality,
  getTotalMortality,
  getTotalMortalityBatch,
  getUserEmail,
  getUserSettings,
  getUserSettingsFull,
  getWeightSamples,
} from './repository'
import { analyzeBatchHealth, getTwentyFourHoursAgo } from './service'
import type { BatchAlert } from './service'

/**
 * Re-export BatchAlert type for external use
 */
export { type BatchAlert }

/**
 * Alert severity levels for batch monitoring
 */
export type AlertType = 'critical' | 'warning' | 'info'

/**
 * Alert source categories indicating which system generated the alert
 */
export type AlertSource =
  | 'mortality'
  | 'water_quality'
  | 'feed'
  | 'vaccination'
  | 'inventory'
  | 'growth'

/**
 * Logic for fetching all batch alerts, reused by server function and dashboard.
 *
 * Analyzes all batches for a user/farm and generates alerts based on:
 * - Mortality rates (sudden spikes and cumulative)
 * - Water quality issues (pH, ammonia, temperature, dissolved oxygen)
 * - Feed conversion ratio (FCR) performance
 * - Vaccination schedules (overdue and upcoming)
 * - Growth performance (underweight batches)
 *
 * Uses optimized batch queries to prevent N+1 query patterns.
 *
 * @param userId - User ID to fetch alerts for
 * @param farmId - Optional farm ID to filter alerts (if not provided, checks all user farms)
 * @returns Array of batch alerts sorted by severity (critical, warning, info)
 *
 * @example
 * ```typescript
 * // Get alerts for all user farms
 * const alerts = await getAllBatchAlerts('user-123')
 *
 * // Get alerts for specific farm
 * const farmAlerts = await getAllBatchAlerts('user-123', 'farm-456')
 * ```
 */
export async function getAllBatchAlerts(
  userId: string,
  farmId?: string,
): Promise<Array<BatchAlert>> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  let targetFarmIds: Array<string> = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const batches = await getBatchesForMonitoring(db, targetFarmIds)

  if (batches.length === 0) return []

  const thresholds = await getUserSettings(db, userId)
  const twentyFourHoursAgo = getTwentyFourHoursAgo()

  // OPTIMIZED: Use batch queries for mortality data (prevents N+1)
  const batchIds = batches.map((b) => b.id)
  const [recentMortalityMap, totalMortalityMap] = await Promise.all([
    getRecentMortalityBatch(db, batchIds, twentyFourHoursAgo),
    getTotalMortalityBatch(db, batchIds),
  ])

  const alerts = await Promise.all(
    batches.map(async (batch) => {
      // Get mortality data from batch queries (no individual DB calls)
      const recentMortality = recentMortalityMap.get(batch.id) || {
        runTotal: null,
        total: 0,
      }
      const totalMortality = totalMortalityMap.get(batch.id) || 0

      // Still need individual queries for other data (can be optimized later)
      const [waterQuality, vaccinations, feed, latestWeight, growthStandards] =
        await Promise.all([
          getRecentWaterQuality(db, batch.id),
          getPendingVaccinations(db, batch.id),
          getFeedRecords(db, batch.id),
          getWeightSamples(db, batch.id),
          getGrowthStandards(db, batch.species),
        ])

      return analyzeBatchHealth({
        batch,
        recentMortality,
        totalMortality,
        waterQuality,
        vaccinations,
        feed,
        latestWeight,
        growthStandards,
        thresholds,
      })
    }),
  )

  const flatAlerts = alerts.flat()

  const settings = await getUserSettingsFull(db, userId)

  if (settings && flatAlerts.length > 0) {
    const { createNotification } = await import('../notifications/server')
    const notifPrefs = settings.notifications

    for (const alert of flatAlerts) {
      if (alert.type !== 'critical') continue

      if (alert.source === 'mortality' && notifPrefs.highMortality) {
        const batch = batches.find((b) => b.id === alert.batchId)
        await createNotification({
          userId,
          farmId: farmId || null,
          type: 'highMortality',
          title: 'High Mortality Alert',
          message: alert.message,
          actionUrl: `/batches/${alert.batchId}`,
          metadata: {
            batchId: alert.batchId,
            species: batch?.species,
          },
        })

        try {
          const { INTEGRATIONS } = await import('../integrations/config')
          if (INTEGRATIONS.email) {
            const userEmail = await getUserEmail(db, userId)
            if (userEmail) {
              const { sendEmail } = await import('../integrations/email')
              const { emailTemplates } = await import('../integrations/email')
              const template = emailTemplates.highMortality(
                alert.message,
                batch?.species || 'Unknown',
              )
              sendEmail({ to: userEmail, ...template })
            }
          }
        } catch (error) {
          // External notification failure is non-critical, continue
        }
      }
    }
  }

  return flatAlerts
}

/**
 * Server function to fetch all batch alerts for the authenticated user.
 *
 * Protected endpoint that requires authentication. Returns comprehensive
 * health monitoring alerts for all batches the user has access to.
 *
 * @returns Array of batch alerts with severity levels and actionable metadata
 *
 * @example
 * ```typescript
 * // Client-side usage
 * const { data: alerts } = useQuery({
 *   queryKey: ['batch-alerts', farmId],
 *   queryFn: () => getAllBatchAlertsFn({ data: { farmId } })
 * })
 * ```
 */
export const getAllBatchAlertsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getAllBatchAlerts(session.user.id, data.farmId)
  })

/**
 * Server function to check alerts for a specific batch.
 *
 * Protected endpoint that analyzes a single batch and returns all
 * applicable health and performance alerts.
 *
 * @returns Array of alerts specific to the requested batch
 *
 * @example
 * ```typescript
 * // Check alerts for a specific batch
 * const alerts = await checkBatchAlertsFn({
 *   data: { batchId: 'batch-123' }
 * })
 * ```
 */
export const checkBatchAlertsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ batchId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id
    const batch = await getBatchForMonitoring(db, data.batchId)

    if (!batch || batch.currentQuantity === 0) return []

    const thresholds = await getUserSettings(db, userId)
    const twentyFourHoursAgo = getTwentyFourHoursAgo()

    const [
      recentMortality,
      totalMortality,
      waterQuality,
      vaccinations,
      feed,
      latestWeight,
      growthStandards,
    ] = await Promise.all([
      getRecentMortality(db, batch.id, twentyFourHoursAgo),
      getTotalMortality(db, batch.id),
      getRecentWaterQuality(db, batch.id),
      getPendingVaccinations(db, batch.id),
      getFeedRecords(db, batch.id),
      getWeightSamples(db, batch.id),
      getGrowthStandards(db, batch.species),
    ])

    return analyzeBatchHealth({
      batch,
      recentMortality,
      totalMortality,
      waterQuality,
      vaccinations,
      feed,
      latestWeight,
      growthStandards,
      thresholds,
    })
  })

/**
 * Server function to fetch alerts for a specific farm.
 *
 * Protected endpoint that analyzes all batches in a farm and returns
 * health monitoring alerts. Similar to getAllBatchAlertsFn but scoped
 * to a single farm.
 *
 * @returns Array of batch alerts for the specified farm
 *
 * @example
 * ```typescript
 * // Get alerts for a specific farm
 * const farmAlerts = await getFarmAlertsFn({
 *   data: { farmId: 'farm-456' }
 * })
 * ```
 */
export const getFarmAlertsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id
    const thresholds = await getUserSettings(db, userId)
    const twentyFourHoursAgo = getTwentyFourHoursAgo()

    const batches = await getBatchesForMonitoring(db, [data.farmId])

    if (batches.length === 0) return []

    const alerts = await Promise.all(
      batches.map(async (batch) => {
        const [
          recentMortality,
          totalMortality,
          waterQuality,
          vaccinations,
          feed,
          latestWeight,
          growthStandards,
        ] = await Promise.all([
          getRecentMortality(db, batch.id, twentyFourHoursAgo),
          getTotalMortality(db, batch.id),
          getRecentWaterQuality(db, batch.id),
          getPendingVaccinations(db, batch.id),
          getFeedRecords(db, batch.id),
          getWeightSamples(db, batch.id),
          getGrowthStandards(db, batch.species),
        ])

        return analyzeBatchHealth({
          batch,
          recentMortality,
          totalMortality,
          waterQuality,
          vaccinations,
          feed,
          latestWeight,
          growthStandards,
          thresholds,
        })
      }),
    )

    return alerts.flat()
  })
