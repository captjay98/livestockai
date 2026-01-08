import { db } from '../db'
import { getBatchById } from '../batches/server'

export interface CreateMortalityData {
  batchId: string
  quantity: number
  date: Date
  cause: 'disease' | 'predator' | 'weather' | 'unknown' | 'other'
  notes?: string
}

/**
 * Record mortality and update batch quantity
 */
export async function recordMortality(userId: string, data: CreateMortalityData): Promise<string> {
  // Verify batch access
  const batch = await getBatchById(userId, data.batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
  }

  // Check if mortality quantity is valid
  if (data.quantity <= 0) {
    throw new Error('Mortality quantity must be greater than 0')
  }

  if (data.quantity > batch.currentQuantity) {
    throw new Error('Mortality quantity cannot exceed current batch quantity')
  }

  // Start transaction
  return await db.transaction().execute(async (trx) => {
    // Insert mortality record
    const result = await trx
      .insertInto('mortality_records')
      .values({
        batchId: data.batchId,
        quantity: data.quantity,
        date: data.date,
        cause: data.cause,
        notes: data.notes || null,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    // Update batch quantity
    const newQuantity = batch.currentQuantity - data.quantity
    await trx
      .updateTable('batches')
      .set({
        currentQuantity: newQuantity,
        status: newQuantity <= 0 ? 'depleted' : 'active',
      })
      .where('id', '=', data.batchId)
      .execute()

    return result.id
  })
}

/**
 * Get mortality records for a batch
 */
export async function getMortalityRecords(userId: string, batchId: string) {
  // Verify batch access
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
  }

  return await db
    .selectFrom('mortality_records')
    .selectAll()
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .execute()
}

/**
 * Get mortality statistics for a batch
 */
export async function getMortalityStats(userId: string, batchId: string) {
  // Verify batch access
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
  }

  const [totalStats, causeStats, recentStats] = await Promise.all([
    // Total mortality statistics
    db
      .selectFrom('mortality_records')
      .select([
        db.fn.count('id').as('total_records'),
        db.fn.sum('quantity').as('total_mortality'),
      ])
      .where('batchId', '=', batchId)
      .executeTakeFirst(),

    // Mortality by cause
    db
      .selectFrom('mortality_records')
      .select([
        'cause',
        db.fn.count('id').as('count'),
        db.fn.sum('quantity').as('quantity'),
      ])
      .where('batchId', '=', batchId)
      .groupBy('cause')
      .execute(),

    // Recent mortality (last 30 days)
    db
      .selectFrom('mortality_records')
      .select([
        db.fn.count('id').as('recent_records'),
        db.fn.sum('quantity').as('recent_mortality'),
      ])
      .where('batchId', '=', batchId)
      .where('date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .executeTakeFirst(),
  ])

  const totalMortality = Number(totalStats?.total_mortality || 0)
  const recentMortality = Number(recentStats?.recent_mortality || 0)

  // Calculate mortality rate
  const mortalityRate = batch.initialQuantity > 0 
    ? (totalMortality / batch.initialQuantity) * 100 
    : 0

  // Calculate recent mortality rate
  const recentMortalityRate = batch.initialQuantity > 0 
    ? (recentMortality / batch.initialQuantity) * 100 
    : 0

  return {
    total: {
      records: Number(totalStats?.total_records || 0),
      quantity: totalMortality,
      rate: mortalityRate,
    },
    recent: {
      records: Number(recentStats?.recent_records || 0),
      quantity: recentMortality,
      rate: recentMortalityRate,
    },
    byCause: causeStats.map(stat => ({
      cause: stat.cause,
      count: Number(stat.count),
      quantity: Number(stat.quantity),
      percentage: totalMortality > 0 ? (Number(stat.quantity) / totalMortality) * 100 : 0,
    })),
    batch: {
      initialQuantity: batch.initialQuantity,
      currentQuantity: batch.currentQuantity,
      remaining: batch.currentQuantity,
      lost: totalMortality,
    },
  }
}

/**
 * Get mortality trends for a batch (daily/weekly/monthly)
 */
export async function getMortalityTrends(
  userId: string, 
  batchId: string, 
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
) {
  // Verify batch access
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  let dateFormat: string
  switch (period) {
    case 'weekly':
      dateFormat = 'YYYY-"W"WW' // Year-Week format
      break
    case 'monthly':
      dateFormat = 'YYYY-MM' // Year-Month format
      break
    default:
      dateFormat = 'YYYY-MM-DD' // Year-Month-Day format
  }

  const trends = await db
    .selectFrom('mortality_records')
    .select([
      (eb) => eb.fn('to_char', [eb.ref('date'), eb.val(dateFormat)]).as('period'),
      db.fn.count('id').as('records'),
      db.fn.sum('quantity').as('quantity'),
    ])
    .where('batchId', '=', batchId)
    .where('date', '>=', startDate)
    .groupBy((eb) => eb.fn('to_char', [eb.ref('date'), eb.val(dateFormat)]))
    .orderBy((eb) => eb.fn('to_char', [eb.ref('date'), eb.val(dateFormat)]), 'asc')
    .execute()

  return trends.map(trend => ({
    period: trend.period,
    records: Number(trend.records),
    quantity: Number(trend.quantity),
  }))
}

/**
 * Get mortality alerts for a farm
 */
export async function getMortalityAlerts(_userId: string, farmId: string) {
  // Get all active batches for the farm
  const batches = await db
    .selectFrom('batches')
    .selectAll()
    .where('farmId', '=', farmId)
    .where('status', '=', 'active')
    .execute()

  const alerts = []

  for (const batch of batches) {
    // Check recent mortality (last 7 days)
    const recentMortality = await db
      .selectFrom('mortality_records')
      .select([
        db.fn.sum('quantity').as('quantity'),
      ])
      .where('batchId', '=', batch.id)
      .where('date', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .executeTakeFirst()

    const recentQuantity = Number(recentMortality?.quantity || 0)
    const recentRate = batch.initialQuantity > 0 
      ? (recentQuantity / batch.initialQuantity) * 100 
      : 0

    // Alert if mortality rate > 5% in last 7 days
    if (recentRate > 5) {
      alerts.push({
        type: 'high_mortality' as const,
        batchId: batch.id,
        batchSpecies: batch.species,
        severity: recentRate > 10 ? 'critical' as const : 'warning' as const,
        message: `High mortality rate (${recentRate.toFixed(1)}%) in last 7 days`,
        quantity: recentQuantity,
        rate: recentRate,
      })
    }

    // Alert if batch is nearly depleted (< 10% remaining)
    const remainingPercentage = batch.initialQuantity > 0 
      ? (batch.currentQuantity / batch.initialQuantity) * 100 
      : 0

    if (remainingPercentage < 10 && remainingPercentage > 0) {
      alerts.push({
        type: 'low_stock' as const,
        batchId: batch.id,
        batchSpecies: batch.species,
        severity: remainingPercentage < 5 ? 'critical' as const : 'warning' as const,
        message: `Low stock: ${remainingPercentage.toFixed(1)}% remaining`,
        quantity: batch.currentQuantity,
        rate: remainingPercentage,
      })
    }
  }

  return alerts.sort((a, b) => {
    // Sort by severity (critical first) then by rate (highest first)
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1
    }
    return b.rate - a.rate
  })
}
