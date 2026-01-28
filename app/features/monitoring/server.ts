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

export const getAllBatchAlerts = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { requireAuth } = await import('../auth/server-middleware')

        const session = await requireAuth()
        const userId = session.user.id

        let targetFarmIds: Array<string> = []
        if (data.farmId) {
            targetFarmIds = [data.farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
            if (targetFarmIds.length === 0) return []
        }

        const batches = await selectBatchesForMonitoring(db, targetFarmIds)

        if (batches.length === 0) return []

        const thresholds = await selectUserSettings(db, userId)
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

        const flatAlerts = alerts.flat()

        const settings = await selectUserSettingsFull(db, userId)

        if (settings && flatAlerts.length > 0) {
            const { createNotification } =
                await import('../notifications/server')
            const notifPrefs = settings.notifications

            for (const alert of flatAlerts) {
                if (alert.type !== 'critical') continue

                if (alert.source === 'mortality' && notifPrefs.highMortality) {
                    const batch = batches.find((b) => b.id === alert.batchId)
                    await createNotification({
                        userId,
                        farmId: data.farmId || null,
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
                        const { INTEGRATIONS } =
                            await import('../integrations/config')
                        if (INTEGRATIONS.email) {
                            const userEmail = await selectUserEmail(db, userId)
                            if (userEmail) {
                                const { sendEmail } =
                                    await import('../integrations/email')
                                const { emailTemplates } =
                                    await import('../integrations/email')
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
    })

export const checkBatchAlerts = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ batchId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { requireAuth } = await import('../auth/server-middleware')

        const session = await requireAuth()
        const userId = session.user.id
        const batch = await selectBatchForMonitoring(db, data.batchId)

        if (!batch || batch.currentQuantity === 0) return []

        const thresholds = await selectUserSettings(db, userId)
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

export const getFarmAlerts = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { requireAuth } = await import('../auth/server-middleware')

        const session = await requireAuth()
        const userId = session.user.id
        const thresholds = await selectUserSettings(db, userId)
        const twentyFourHoursAgo = getTwentyFourHoursAgo()

        const batches = await selectBatchesForMonitoring(db, [data.farmId])

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
