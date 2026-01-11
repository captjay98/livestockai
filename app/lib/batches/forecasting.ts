import { sql } from 'kysely'
import { addDays, differenceInDays } from 'date-fns'

import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'

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
    const batch = await db
        .selectFrom('batches')
        .selectAll()
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

    // Convert kg to g
    const currentWeightG = latestWeight
        ? Number(latestWeight.averageWeightKg) * 1000
        : 0 // Or estimate based on age if no sample (TODO)

    // 2. Get Growth Standard
    const growthStandard = await db
        .selectFrom('growth_standards')
        .selectAll()
        .where('species', '=', batch.species)
        .orderBy('day', 'asc')
        .execute()

    if (growthStandard.length === 0) return null

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
    const effectiveAge = ageDays

    if (currentWeightG > 0 && expectedAtCurrentAge > 0) {
        const ratio = currentWeightG / expectedAtCurrentAge
        if (ratio > 1.05) status = 'ahead'
        else if (ratio < 0.95) status = 'behind'

        // Adjust effective age based on weight?
        // Simple approach: Projected harvest date is fixed based on target day from start, 
        // unless we re-estimate based on current growth rate. 
        // Let's stick to standard curve for remaining growth from CURRENT weight.

        // Find expected day for CURRENT weight
        const currentWeightDayFull = growthStandard.find(g => g.expected_weight_g >= currentWeightG)
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
    // Revenue: Current Qty * Market Price
    // Find generic market price for species
    const marketPrice = await db
        .selectFrom('market_prices')
        .selectAll()
        .where('species', '=', batch.species)
        // .where('size_category', 'like', '%...') // Need logic to match size
        .execute()

    // Simple average or max price for now, or match weight
    // If target weight is 2000g -> "2.0kg" category
    // This matching is tricky without standardized strings. 
    // Let's assume a default safe price for now or take the first match.
    const estPricePerUnit = Number(marketPrice[0]?.price_per_unit || 0)

    const projectedRevenue = batch.currentQuantity * estPricePerUnit

    // Feed Cost Remaining
    // Need standard feed consumption per day? We don't have that in growth_standards yet.
    // Approximation: FCR of 1.5. Gain needed * 1.5 * FeedCost
    const weightToGainKg = ((batch.target_weight_g || 0) - currentWeightG) / 1000
    const totalWeightToGain = weightToGainKg * batch.currentQuantity
    const feedNeededKg = totalWeightToGain * 1.6 // FCR 1.6 conserv
    const estFeedCostPerKg = 1000 // approx N1000/kg
    const projectedFeedCost = feedNeededKg * estFeedCostPerKg

    // Estimated Profit
    const currentCost = Number(batch.totalCost) // Includes birds + feed so far
    // Note: batch.totalCost in DB schema usually was "initial cost" in my simplified view, 
    // but looking at `updateBatch` logic it might be static.
    // Actually we have `expenses` table for recurring costs.

    // Get total expenses so far
    const totalExpensesResult = await db
        .selectFrom('expenses')
        .select(sql<string>`sum(amount)`.as('total'))
        .where('batchId', '=', batchId)
        .executeTakeFirst()

    const totalExpensesSoFar = Number(totalExpensesResult?.total || 0) + Number(batch.totalCost)

    const estimatedProfit = projectedRevenue - (totalExpensesSoFar + projectedFeedCost)

    return {
        projectedHarvestDate,
        daysRemaining,
        projectedRevenue,
        projectedFeedCost,
        estimatedProfit,
        currentStatus: status
    }
}

export const getBatchProjectionFn = createServerFn({ method: 'GET' })
    .validator((data: { batchId: string }) => data)
    .handler(async ({ data }) => {
        return calculateBatchProjection(data.batchId)
    })
