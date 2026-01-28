import { sql } from 'kysely'
import { addDays, differenceInDays } from 'date-fns'
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'

interface ProjectionResult {
    projectedHarvestDate: Date
    daysRemaining: number
    projectedRevenue: number
    projectedFeedCost: number
    estimatedProfit: number
    currentStatus: 'on_track' | 'behind' | 'ahead'
}

export async function calculateBatchProjection(
    batchId: string,
): Promise<ProjectionResult | null> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const batch = await db
        .selectFrom('batches')
        .select([
            'id',
            'farmId',
            'batchName',
            'livestockType',
            'species',
            'breedId', // NEW: Include breedId for breed-specific forecasting
            'sourceSize',
            'initialQuantity',
            'currentQuantity',
            'acquisitionDate',
            'costPerUnit',
            'totalCost',
            'status',
            'supplierId',
            'structureId',
            'targetHarvestDate',
            'target_weight_g',
            'targetPricePerUnit',
            'notes',
            'createdAt',
            'updatedAt',
        ])
        .where('id', '=', batchId)
        .executeTakeFirst()

    if (!batch || !batch.target_weight_g || batch.status === 'sold') return null

    // 1. Get current status (age and weight)
    const ageDays = differenceInDays(new Date(), batch.acquisitionDate)

    // Get latest weight sample
    const latestWeight = await db
        .selectFrom('weight_samples')
        .select(['averageWeightKg', 'date'])
        .where('batchId', '=', batchId)
        .orderBy('date', 'desc')
        .executeTakeFirst()

    // 2. Get Growth Standard (breed-specific or species fallback)
    const { getGrowthStandards } = await import('./repository')
    const growthStandard = await getGrowthStandards(
        db,
        batch.species,
        batch.breedId,
    )

    if (growthStandard.length === 0) return null

    // Calculate current weight - use sample if available, otherwise estimate from age
    let currentWeightG = 0
    if (latestWeight) {
        currentWeightG = Number(latestWeight.averageWeightKg) * 1000
    } else {
        // Estimate based on age using growth standards
        const ageInDays = Math.floor(
            (Date.now() - new Date(batch.acquisitionDate).getTime()) /
                (1000 * 60 * 60 * 24),
        )
        const ageRecord =
            growthStandard.find((s) => s.day >= ageInDays) ||
            growthStandard[growthStandard.length - 1]
        currentWeightG = ageRecord.expected_weight_g
    }

    // 3. Find target day
    // Find day where weight >= target_weight_g
    const targetDayRecord = growthStandard.find(
        (g) => g.expected_weight_g >= (batch.target_weight_g || 2000),
    )
    const targetDay = targetDayRecord ? targetDayRecord.day : 56 // Default if not found

    // Calculate Harvest Date
    // If we are currently at day X with weight W, are we ahead or behind?
    // Expected weight at current age:
    const expectedAtCurrentAge =
        growthStandard.find((g) => g.day === ageDays)?.expected_weight_g || 0

    let status: 'on_track' | 'behind' | 'ahead' = 'on_track'

    if (currentWeightG > 0 && expectedAtCurrentAge > 0) {
        const ratio = currentWeightG / expectedAtCurrentAge
        if (ratio > 1.05) status = 'ahead'
        else if (ratio < 0.95) status = 'behind'

        // Adjust effective age based on weight?
        // Simple approach: Projected harvest date is fixed based on target day from start,
        // unless we re-estimate based on current growth rate.
        // Let's stick to standard curve for remaining growth from CURRENT weight.

        // Find expected day for CURRENT weight
        const currentWeightDayFull = growthStandard.find(
            (g) => g.expected_weight_g >= currentWeightG,
        )
        if (currentWeightDayFull) {
            // If our bird is 1000g (which is day 22 std) but actual age is 25, it's slow.
            // Remaining growth: target 2000g (day 35).
            // Growth needed: 1000g.
            // We can assume standard daily gain from this point?
            // Let's simple projection: targetDay - currentWeightDay
            // remainingDays = targetDay - currentWeightDayFull.day
        }
    }

    // Simplified: Target Date = Acquisition + TargetDays from standard
    // If behind/ahead, maybe shift the date?
    // Let's keep it simple: Target Date is determined by the standard curve reaching the target weight.
    // Unless we want to account for current performance.

    const projectedHarvestDate = addDays(batch.acquisitionDate, targetDay)
    const daysRemaining = differenceInDays(projectedHarvestDate, new Date())

    // 4. Financials
    // Revenue: Current Qty * Target Price (user-entered)
    const estPricePerUnit = Number(batch.targetPricePerUnit || 0)

    const projectedRevenue = batch.currentQuantity * estPricePerUnit

    // Feed Cost Remaining
    // Use breed-specific FCR if available, otherwise default to 1.6
    let fcr = 1.6 // Default FCR

    if (batch.breedId) {
        const { getBreedById } = await import('~/features/breeds/repository')
        const breed = await getBreedById(db, batch.breedId)
        if (breed && breed.typicalFcr) {
            fcr = parseFloat(breed.typicalFcr)
        }
    }

    const weightToGainKg =
        ((batch.target_weight_g || 0) - currentWeightG) / 1000
    const totalWeightToGain = weightToGainKg * batch.currentQuantity
    const feedNeededKg = totalWeightToGain * fcr
    const estFeedCostPerKg = 1000 // approx N1000/kg
    const projectedFeedCost = feedNeededKg * estFeedCostPerKg

    // Estimated Profit
    // Note: batch.totalCost in DB schema usually was "initial cost" in my simplified view,
    // but looking at `updateBatch` logic it might be static.
    // Actually we have `expenses` table for recurring costs.

    // Get total expenses so far
    const totalExpensesResult = await db
        .selectFrom('expenses')
        .select(sql<string>`sum(amount)`.as('total'))
        .where('batchId', '=', batchId)
        .executeTakeFirst()

    const totalExpensesSoFar =
        Number(totalExpensesResult?.total || 0) + Number(batch.totalCost)

    const estimatedProfit =
        projectedRevenue - (totalExpensesSoFar + projectedFeedCost)

    return {
        projectedHarvestDate,
        daysRemaining,
        projectedRevenue,
        projectedFeedCost,
        estimatedProfit,
        currentStatus: status,
    }
}

export const getBatchProjectionFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ batchId: z.string().uuid() }))
    .handler(async ({ data }) => {
        return calculateBatchProjection(data.batchId)
    })

/**
 * Enhanced projection result with ADG and Performance Index
 */
export interface EnhancedProjectionResult extends ProjectionResult {
    currentWeightG: number
    expectedWeightG: number
    performanceIndex: number
    adgGramsPerDay: number
    expectedAdgGramsPerDay: number
    adgMethod: 'two_samples' | 'single_sample' | 'growth_curve_estimate'
}

/**
 * Calculate enhanced batch projection with ADG and Performance Index
 */
export async function calculateEnhancedProjection(
    batchId: string,
): Promise<EnhancedProjectionResult | null> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get basic projection first
    const basicProjection = await calculateBatchProjection(batchId)
    if (!basicProjection) return null

    // Get batch data
    const batch = await db
        .selectFrom('batches')
        .select([
            'id',
            'species',
            'breedId',
            'acquisitionDate',
            'target_weight_g',
        ])
        .where('id', '=', batchId)
        .executeTakeFirst()

    if (!batch) return null

    // Get weight samples
    const samples = await db
        .selectFrom('weight_samples')
        .select(['averageWeightKg', 'date'])
        .where('batchId', '=', batchId)
        .orderBy('date', 'desc')
        .execute()

    // Get growth standards
    const { getGrowthStandards } = await import('./repository')
    const growthStandards = await getGrowthStandards(
        db,
        batch.species,
        batch.breedId,
    )

    if (growthStandards.length === 0) return null

    // Calculate current age
    const currentAgeDays = differenceInDays(new Date(), batch.acquisitionDate)

    // Import service functions
    const { calculateADG, calculateExpectedADG, calculatePerformanceIndex } =
        await import('./forecasting-service')

    // Calculate ADG
    const adgResult = calculateADG(
        samples.map((s) => ({
            averageWeightKg: Number(s.averageWeightKg),
            date: new Date(s.date),
        })),
        batch.acquisitionDate,
        currentAgeDays,
        growthStandards,
    )

    // Get current and expected weight
    let currentWeightG = 0
    if (samples.length > 0) {
        currentWeightG = Number(samples[0].averageWeightKg) * 1000
    } else {
        // Estimate from growth curve
        const ageRecord =
            growthStandards.find((s) => s.day >= currentAgeDays) ||
            growthStandards[growthStandards.length - 1]
        currentWeightG = ageRecord.expected_weight_g
    }

    const expectedRecord =
        growthStandards.find((s) => s.day >= currentAgeDays) ||
        growthStandards[growthStandards.length - 1]
    const expectedWeightG = expectedRecord.expected_weight_g

    // Calculate Performance Index
    const performanceIndex = calculatePerformanceIndex(
        currentWeightG,
        expectedWeightG,
    )

    // Calculate expected ADG
    const expectedAdgGramsPerDay = calculateExpectedADG(
        currentAgeDays,
        growthStandards,
    )

    return {
        ...basicProjection,
        currentWeightG,
        expectedWeightG,
        performanceIndex,
        adgGramsPerDay: adgResult.adgGramsPerDay,
        expectedAdgGramsPerDay,
        adgMethod: adgResult.method,
    }
}

/**
 * Server function for enhanced projection
 */
export const getEnhancedProjectionFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ batchId: z.string().uuid() }))
    .handler(async ({ data }) => {
        return calculateEnhancedProjection(data.batchId)
    })

/**
 * Server function for growth chart data
 */
export const getGrowthChartDataFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            batchId: z.string().uuid(),
            projectionDays: z.number().optional(),
        }),
    )
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const batch = await db
            .selectFrom('batches')
            .select(['species', 'breedId', 'acquisitionDate'])
            .where('id', '=', data.batchId)
            .executeTakeFirst()

        if (!batch) return null

        const samples = await db
            .selectFrom('weight_samples')
            .select(['averageWeightKg', 'date'])
            .where('batchId', '=', data.batchId)
            .orderBy('date', 'asc')
            .execute()

        const { getGrowthStandards } = await import('./repository')
        const growthStandards = await getGrowthStandards(
            db,
            batch.species,
            batch.breedId,
        )

        if (growthStandards.length === 0) return null

        const currentAgeDays = differenceInDays(
            new Date(),
            batch.acquisitionDate,
        )

        const { generateChartData } = await import('./forecasting-service')

        return generateChartData(
            batch.acquisitionDate,
            currentAgeDays,
            growthStandards,
            samples.map((s) => ({
                averageWeightKg: Number(s.averageWeightKg),
                date: new Date(s.date),
            })),
            data.projectionDays || 14,
        )
    })

/**
 * Server function to check for deviation alerts
 */
export const checkDeviationAlertsFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ userId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        // Get all active batches for user
        const { getUserFarms } = await import('../auth/utils')
        const farmIds = await getUserFarms(data.userId)

        const batches = await db
            .selectFrom('batches')
            .select(['id', 'farmId'])
            .where('farmId', 'in', farmIds)
            .where('status', '=', 'active')
            .execute()

        const { determineAlertSeverity, shouldCreateAlert } =
            await import('./alert-service')
        const { createNotification } = await import('../notifications/server')

        let alertsCreated = 0

        for (const batch of batches) {
            const projection = await calculateEnhancedProjection(batch.id)
            if (!projection) continue

            const alertResult = determineAlertSeverity(
                projection.performanceIndex,
            )
            if (!alertResult) continue

            const should = await shouldCreateAlert(
                db,
                batch.id,
                alertResult.type,
            )
            if (!should) continue

            await createNotification({
                userId: data.userId,
                farmId: batch.farmId,
                type: alertResult.type,
                title:
                    alertResult.severity === 'critical'
                        ? 'Critical: Batch Growth Severely Behind'
                        : alertResult.severity === 'warning'
                          ? 'Warning: Batch Growth Behind Schedule'
                          : 'Info: Early Harvest Opportunity',
                message: alertResult.recommendation,
                actionUrl: `/batches/${batch.id}`,
                metadata: {
                    batchId: batch.id,
                    performanceIndex: projection.performanceIndex,
                },
            })

            alertsCreated++
        }

        return { alertsCreated }
    })

/**
 * Server function to get batches needing attention
 */
export const getBatchesNeedingAttentionFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({ userId: z.string().uuid(), limit: z.number().optional() }),
    )
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getUserFarms } = await import('../auth/utils')
        const farmIds = await getUserFarms(data.userId)

        const batches = await db
            .selectFrom('batches')
            .leftJoin('farms', 'farms.id', 'batches.farmId')
            .select([
                'batches.id',
                'batches.batchName',
                'batches.species',
                'batches.currentQuantity',
                'farms.name as farmName',
            ])
            .where('batches.farmId', 'in', farmIds)
            .where('batches.status', '=', 'active')
            .execute()

        // Calculate performance index for each batch
        const batchesWithPerformance = await Promise.all(
            batches.map(async (batch) => {
                const projection = await calculateEnhancedProjection(batch.id)
                return {
                    ...batch,
                    performanceIndex: projection?.performanceIndex || 100,
                    deviation: projection
                        ? Math.abs(100 - projection.performanceIndex)
                        : 0,
                }
            }),
        )

        // Filter batches needing attention (< 90 or > 110)
        const needingAttention = batchesWithPerformance
            .filter((b) => b.performanceIndex < 90 || b.performanceIndex > 110)
            .sort((a, b) => b.deviation - a.deviation)
            .slice(0, data.limit || 5)

        return needingAttention
    })

/**
 * Server function to get batches with upcoming harvests
 */
export const getUpcomingHarvestsFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            farmId: z.string().uuid().optional(),
            daysAhead: z.number().optional(),
        }),
    )
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        // Get active batches with target weight set
        let query = db
            .selectFrom('batches')
            .leftJoin('farms', 'farms.id', 'batches.farmId')
            .select([
                'batches.id',
                'batches.batchName',
                'batches.species',
                'batches.currentQuantity',
                'batches.target_weight_g',
                'farms.name as farmName',
            ])
            .where('batches.status', '=', 'active')
            .where('batches.target_weight_g', 'is not', null)

        if (data.farmId) {
            query = query.where('batches.farmId', '=', data.farmId)
        }

        const batches = await query.execute()

        const daysAhead = data.daysAhead || 14

        // Calculate projections and filter by days remaining
        const batchesWithProjections = await Promise.all(
            batches.map(async (batch) => {
                const projection = await calculateEnhancedProjection(batch.id)
                return {
                    ...batch,
                    projectedHarvestDate:
                        projection?.projectedHarvestDate || null,
                    daysRemaining: projection?.daysRemaining ?? null,
                }
            }),
        )

        // Filter batches with harvest within daysAhead and sort by days remaining
        const upcomingHarvests = batchesWithProjections
            .filter(
                (b) =>
                    b.daysRemaining !== null &&
                    b.daysRemaining >= 0 &&
                    b.daysRemaining <= daysAhead,
            )
            .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0))
            .slice(0, 5)

        return upcomingHarvests
    })
