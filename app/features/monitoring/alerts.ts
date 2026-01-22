/**
 * Server functions for monitoring alerts.
 * Handles orchestration of data fetching and alert generation.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getUserFarms } from '../auth/utils'
import {
  selectBatchForMonitoring,
  selectBatchesForMonitoring,
  selectFeedRecords,
  selectGrowthStandards,
  selectPendingVaccinations,
  selectRecentMortality,
  selectRecentWaterQuality,
  selectTotalMortality,
  selectUserEmail,
  selectUserSettings,
  selectUserSettingsFull,
  selectWeightSamples,
} from './repository'
import {
  analyzeBatchHealth,
  getTwentyFourHoursAgo,
} from './service'
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
 * Get all health alerts for a user (optionally filtered by farm)
 * Server function with dynamic imports for Cloudflare Workers compatibility
 */
export const getAllBatchAlerts = createServerFn({ method: 'GET' })
  .validator(z.object({ farmId: z.string().uuid().optional() }))
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { getUserId } = await import('../auth/utils')

    const userId = await getUserId()

    // Determine target farms
    let targetFarmIds: Array<string> = []
    if (data.farmId) {
      targetFarmIds = [data.farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    // Get active batches
    const batches = await selectBatchesForMonitoring(db, targetFarmIds)

    if (batches.length === 0) return []

    // Get user thresholds once
    const thresholds = await selectUserSettings(db, userId)
    const twentyFourHoursAgo = getTwentyFourHoursAgo()

    // Run analysis for each batch
    const alerts = await Promise.all(
      batches.map(async (batch) => {
        // Fetch all data needed for this batch
        const [recentMortality, totalMortality, waterQuality, vaccinations, feed, latestWeight, growthStandards] = await Promise.all([
          selectRecentMortality(db, batch.id, twentyFourHoursAgo),
          selectTotalMortality(db, batch.id),
          selectRecentWaterQuality(db, batch.id),
          selectPendingVaccinations(db, batch.id),
          selectFeedRecords(db, batch.id),
          selectWeightSamples(db, batch.id),
          selectGrowthStandards(db, batch.species),
        ])

        // Run business logic analysis
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

    // Create notifications for critical alerts based on user preferences
    const settings = await selectUserSettingsFull(db, userId)

    if (settings && flatAlerts.length > 0) {
      const { createNotification } = await import('../notifications/server')
      const notifPrefs = settings.notifications

      for (const alert of flatAlerts) {
        // Only create notifications for critical alerts
        if (alert.type !== 'critical') continue

        // Check if user wants this type of notification
        if (alert.source === 'mortality' && notifPrefs.highMortality) {
          const batch = batches.find((b) => b.id === alert.batchId)
          await createNotification({
            userId,
            farmId: data.farmId || null,
            type: 'highMortality',
            title: 'High Mortality Alert',
            message: alert.message,
            actionUrl: `/batches/${alert.batchId}`,
            metadata: { batchId: alert.batchId, species: batch?.species },
          })

          // Send external notification if configured (fire-and-forget)
          try {
            const { INTEGRATIONS } = await import('../integrations/config')
            if (INTEGRATIONS.email) {
              const userEmail = await selectUserEmail(db, userId)
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
            console.error('External notification failed:', error)
          }
        }
      }
    }

    return flatAlerts
  })

/**
 * Check a single batch for critical health anomalies
 */
export const checkBatchAlerts = createServerFn({ method: 'GET' })
  .validator(z.object({ batchId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { getUserId } = await import('../auth/utils')

    const userId = await getUserId()
    const batch = await selectBatchForMonitoring(db, data.batchId)

    if (!batch || batch.currentQuantity === 0) return []

    const thresholds = await selectUserSettings(db, userId)
    const twentyFourHoursAgo = getTwentyFourHoursAgo()

    // Fetch all data needed for this batch
    const [recentMortality, totalMortality, waterQuality, vaccinations, feed, latestWeight, growthStandards] = await Promise.all([
      selectRecentMortality(db, batch.id, twentyFourHoursAgo),
      selectTotalMortality(db, batch.id),
      selectRecentWaterQuality(db, batch.id),
      selectPendingVaccinations(db, batch.id),
      selectFeedRecords(db, batch.id),
      selectWeightSamples(db, batch.id),
      selectGrowthStandards(db, batch.species),
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
 * Get alerts for a specific farm
 */
export const getFarmAlerts = createServerFn({ method: 'GET' })
  .validator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { getUserId } = await import('../auth/utils')

    const userId = await getUserId()
    const thresholds = await selectUserSettings(db, userId)
    const twentyFourHoursAgo = getTwentyFourHoursAgo()

    // Get active batches for this farm
    const batches = await selectBatchesForMonitoring(db, [data.farmId])

    if (batches.length === 0) return []

    // Run analysis for each batch
    const alerts = await Promise.all(
      batches.map(async (batch) => {
        const [recentMortality, totalMortality, waterQuality, vaccinations, feed, latestWeight, growthStandards] = await Promise.all([
          selectRecentMortality(db, batch.id, twentyFourHoursAgo),
          selectTotalMortality(db, batch.id),
          selectRecentWaterQuality(db, batch.id),
          selectPendingVaccinations(db, batch.id),
          selectFeedRecords(db, batch.id),
          selectWeightSamples(db, batch.id),
          selectGrowthStandards(db, batch.species),
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
