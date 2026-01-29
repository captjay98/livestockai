import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  calculateFCR as calculateFeedConversionRatio,
  calculateMortalityRate,
} from '../service'
import {
  getBatchStats,
  getInventorySummary as getInventorySummaryFromDb,
  getWeightSamples,
} from '../repository'
import { AppError } from '~/lib/errors'
import { toNumber } from '~/features/settings/currency'

/**
 * Retrieve comprehensive statistics for a specific batch, including mortality, feed, and sales
 *
 * @param userId - ID of the user requesting stats
 * @param batchId - ID of the batch
 * @returns Promise resolving to a statistical summary object
 * @throws {Error} If the batch is not found or access is denied
 *
 * @example
 * ```typescript
 * const stats = await getBatchStatsWrapper('user_1', 'batch_123')
 * console.log(stats.mortality.rate)
 * ```
 */
export async function getBatchStatsWrapper(userId: string, batchId: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getBatchById } = await import('./crud')

  try {
    const batch = await getBatchById(userId, batchId)
    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
    }

    // Database operations (from repository layer)
    const stats = await getBatchStats(db, batchId)
    const weightSamples = await getWeightSamples(db, batchId)

    // Business logic calculations (from service layer)
    const totalMortality = Number(stats.mortality.totalMortality || 0)
    const mortalityRate = calculateMortalityRate(
      batch.initialQuantity,
      batch.currentQuantity,
      totalMortality,
    )

    // Calculate FCR (Feed Conversion Ratio) if we have weight data
    let fcr = null
    if (weightSamples.length >= 2) {
      const totalFeedKg = toNumber(String(stats.feed.totalFeedKg || '0'))
      if (totalFeedKg > 0) {
        // Calculate weight gain from first to last sample
        const firstWeight = toNumber(
          weightSamples[weightSamples.length - 1].averageWeightKg,
        ) // oldest sample
        const lastWeight = toNumber(weightSamples[0].averageWeightKg) // newest sample
        const weightGainPerBird = lastWeight - firstWeight
        const totalWeightGain = weightGainPerBird * batch.currentQuantity

        if (totalWeightGain > 0) {
          fcr = calculateFeedConversionRatio(totalFeedKg, totalWeightGain)
        }
      }
    }

    return {
      batch,
      mortality: {
        totalDeaths: stats.mortality.totalDeaths,
        totalQuantity: totalMortality,
        rate: mortalityRate,
      },
      feed: {
        totalFeedings: stats.feed.totalFeedings,
        totalKg: toNumber(String(stats.feed.totalFeedKg || '0')),
        totalCost: toNumber(String(stats.feed.totalFeedCost || '0')),
        fcr,
      },
      sales: {
        totalSales: stats.sales.totalSales,
        totalQuantity: stats.sales.totalSold,
        totalRevenue: toNumber(String(stats.sales.totalRevenue || '0')),
      },
      expenses: {
        total: toNumber(String(stats.expenses.totalExpenses || '0')),
      },
      currentWeight:
        weightSamples.length > 0
          ? toNumber(String(weightSamples[0].averageWeightKg))
          : null,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch batch stats',
      cause: error,
    })
  }
}

/**
 * Get inventory summary across all farms or for a specific farm
 *
 * @param userId - ID of the user requesting the summary
 * @param farmId - Optional farm ID to filter by
 * @returns Promise resolving to an inventory summary (overall, poultry, fish, etc.)
 *
 * @example
 * ```typescript
 * const summary = await getInventorySummary('user_1')
 * ```
 */
export async function getInventorySummary(userId: string, farmId?: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { checkFarmAccess, getUserFarms } = await import('../../auth/utils')

  try {
    let targetFarmIds: Array<string> = []

    if (farmId) {
      // Check specific farm access
      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess) {
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
      }
      targetFarmIds = [farmId]
    } else {
      // Get all accessible farms
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) {
        // Return empty stats if no farms
        return {
          overall: {
            totalQuantity: 0,
            activeBatches: 0,
            totalInvestment: 0,
            depletedBatches: 0,
          },
          poultry: { batches: 0, quantity: 0, investment: 0 },
          fish: { batches: 0, quantity: 0, investment: 0 },
          feed: {
            totalFeedings: 0,
            totalKg: 0,
            totalCost: 0,
            fcr: 0,
          },
          sales: { totalSales: 0, totalQuantity: 0, totalRevenue: 0 },
          currentWeight: null,
        }
      }
    }

    // Database operations (from repository layer)
    const summary = await getInventorySummaryFromDb(db, targetFarmIds)

    const totalQuantityOverall = toNumber(
      String(summary.overall?.total_quantity || '0'),
    )
    const totalInvestmentOverall = Number(
      summary.overall?.total_investment || 0,
    )

    // Helper to safely convert to number
    const safeToNumber = (val: string | number | null | undefined) =>
      Number(val || 0)

    // Calculate FCR
    const totalFeedKg = safeToNumber(String(summary.feedStats?.total_kg || '0'))
    const totalSold = safeToNumber(
      String(summary.salesStats?.total_quantity || '0'),
    )
    const fcr = totalSold > 0 ? Number((totalFeedKg / totalSold).toFixed(2)) : 0

    const totalFeedCost = toNumber(String(summary.feedStats?.total_cost || '0'))

    return {
      overall: {
        totalBatches: Number(summary.overall?.total_batches || 0),
        activeBatches: Number(summary.overall?.total_batches || 0),
        totalQuantity: totalQuantityOverall,
        totalInvestment: totalInvestmentOverall,
        depletedBatches: Number(summary.depletedBatches?.count || 0),
      },
      poultry: {
        batches: Number(summary.poultry?.total_batches || 0),
        quantity: toNumber(String(summary.poultry?.total_quantity || '0')),
        investment: toNumber(String(summary.poultry?.total_investment || '0')),
      },
      fish: {
        batches: Number(summary.fish?.total_batches || 0),
        quantity: toNumber(String(summary.fish?.total_quantity || '0')),
        investment: toNumber(String(summary.fish?.total_investment || '0')),
      },
      feed: {
        totalFeedings: Number(summary.feedStats?.total_feedings || 0),
        totalKg: totalFeedKg,
        totalCost: totalFeedCost,
        fcr,
      },
      sales: {
        totalSales: Number(summary.salesStats?.total_sales || 0),
        totalQuantity: totalSold,
        totalRevenue: toNumber(
          String(summary.salesStats?.total_revenue || '0'),
        ),
      },
      currentWeight:
        summary.averageWeightKg > 0 ? summary.averageWeightKg : null,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch inventory summary',
      cause: error,
    })
  }
}

// Server function for batch details
export const getBatchDetailsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ batchId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../../auth/server-middleware')
    const session = await requireAuth()
    return getBatchStatsWrapper(session.user.id, data.batchId)
  })

/**
 * Get batches needing attention based on Performance Index
 * Performance Index considers mortality rate, FCR, and growth rate
 * Batches with PI < 90 or > 110 need attention
 */
export const getBatchesNeedingAttentionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../../auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const { getUserFarms, checkFarmAccess } = await import('../../auth/utils')

    const db = await getDb()

    // Determine target farms
    let targetFarmIds: Array<string> = []
    if (data.farmId) {
      const hasAccess = await checkFarmAccess(session.user.id, data.farmId)
      if (!hasAccess) return []
      targetFarmIds = [data.farmId]
    } else {
      targetFarmIds = await getUserFarms(session.user.id)
      if (targetFarmIds.length === 0) return []
    }

    // Get active batches with stats
    const batches = await db
      .selectFrom('batches')
      .leftJoin('farms', 'farms.id', 'batches.farmId')
      .select([
        'batches.id',
        'batches.batchName',
        'batches.species',
        'batches.initialQuantity',
        'batches.currentQuantity',
        'batches.acquisitionDate',
      ])
      .where('batches.farmId', 'in', targetFarmIds)
      .where('batches.status', '=', 'active')
      .execute()

    const batchesWithPI = []

    for (const batch of batches) {
      // Calculate Performance Index
      const mortalityRate = calculateMortalityRate(
        batch.initialQuantity,
        batch.currentQuantity,
        batch.initialQuantity - batch.currentQuantity,
      )

      // Simple PI calculation: 100 - (mortality_rate * 2)
      // Normal mortality is 5-10%, so PI should be 80-90 for normal batches
      const performanceIndex = Math.max(0, 100 - mortalityRate * 2)

      // Check if needs attention (PI < 90 or > 110)
      if (performanceIndex < 90 || performanceIndex > 110) {
        const deviation = Math.abs(100 - performanceIndex)
        batchesWithPI.push({
          id: batch.id,
          batchName: batch.batchName || `${batch.species} Batch`,
          species: batch.species,
          performanceIndex: Math.round(performanceIndex),
          deviation,
        })
      }
    }

    // Sort by deviation (highest first) and limit to 5
    return batchesWithPI.sort((a, b) => b.deviation - a.deviation).slice(0, 5)
  })
