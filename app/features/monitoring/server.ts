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
  getRecentWaterQuality,
  getTotalMortality,
  getUserEmail,
  getUserSettings,
  getUserSettingsFull,
  getWeightSamples,
} from './repository'
import { analyzeBatchHealth, getTwentyFourHoursAgo } from './service'
import type { BatchAlert } from './service'

export { type BatchAlert }

export type AlertType = 'critical' | 'warning' | 'info'
export type AlertSource =
  | 'mortality'
  | 'water_quality'
  | 'feed'
  | 'vaccination'
  | 'inventory'
  | 'growth'

/**
 * Logic for fetching all batch alerts, reused by server function and dashboard.
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

export const getAllBatchAlertsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getAllBatchAlerts(session.user.id, data.farmId)
  })

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
