import { db } from '~/lib/db'
import { verifyFarmAccess } from '~/lib/auth/middleware'

// Re-export constants for backward compatibility
export { FEED_TYPES, type FeedType } from './constants'

export interface CreateFeedRecordInput {
  batchId: string
  feedType: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed'
  quantityKg: number
  cost: number
  date: Date
  supplierId?: string | null
}

export async function createFeedRecord(
  userId: string,
  farmId: string,
  input: CreateFeedRecordInput,
): Promise<string> {
  await verifyFarmAccess(userId, farmId)

  // Verify batch belongs to farm
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  const result = await db.transaction().execute(async (tx) => {
    // 1. Check current inventory
    const inventory = await tx
      .selectFrom('feed_inventory')
      .select(['id', 'quantityKg'])
      .where('farmId', '=', farmId)
      .where('feedType', '=', input.feedType)
      .executeTakeFirst()

    if (!inventory || parseFloat(inventory.quantityKg) < input.quantityKg) {
      throw new Error(
        `Insufficient inventory for ${input.feedType}. Available: ${inventory ? parseFloat(inventory.quantityKg) : 0}kg`,
      )
    }

    // 2. Subtract from inventory
    const newQuantity = (
      parseFloat(inventory.quantityKg) - input.quantityKg
    ).toString()
    await tx
      .updateTable('feed_inventory')
      .set({
        quantityKg: newQuantity,
        updatedAt: new Date(),
      })
      .where('id', '=', inventory.id)
      .execute()

    // 3. Record the feed consumption
    return await tx
      .insertInto('feed_records')
      .values({
        batchId: input.batchId,
        feedType: input.feedType,
        quantityKg: input.quantityKg.toString(),
        cost: input.cost.toString(),
        date: input.date,
        supplierId: input.supplierId || null,
      })
      .returning('id')
      .executeTakeFirstOrThrow()
  })

  return result.id
}

export async function getFeedRecordsForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      'feed_records.id',
      'feed_records.batchId',
      'feed_records.feedType',
      'feed_records.quantityKg',
      'feed_records.cost',
      'feed_records.date',
      'feed_records.supplierId',
      'feed_records.createdAt',
    ])
    .where('feed_records.batchId', '=', batchId)
    .where('batches.farmId', '=', farmId)
    .orderBy('feed_records.date', 'desc')
    .execute()
}

export async function getFeedRecordsForFarm(userId: string, farmId: string) {
  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      'feed_records.id',
      'feed_records.batchId',
      'feed_records.feedType',
      'feed_records.quantityKg',
      'feed_records.cost',
      'feed_records.date',
      'feed_records.supplierId',
      'feed_records.createdAt',
      'batches.species',
      'batches.livestockType',
    ])
    .where('batches.farmId', '=', farmId)
    .orderBy('feed_records.date', 'desc')
    .execute()
}

export async function getFeedSummaryForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  await verifyFarmAccess(userId, farmId)

  const records = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      'feed_records.feedType',
      'feed_records.quantityKg',
      'feed_records.cost',
    ])
    .where('feed_records.batchId', '=', batchId)
    .where('batches.farmId', '=', farmId)
    .execute()

  const totalQuantityKg = records.reduce(
    (sum, r) => sum + parseFloat(r.quantityKg),
    0,
  )
  const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0)

  const byType: { [key: string]: { quantityKg: number; cost: number } | undefined } = {}
  for (const r of records) {
    const existing = byType[r.feedType]
    if (existing) {
      existing.quantityKg += parseFloat(r.quantityKg)
      existing.cost += parseFloat(r.cost)
    } else {
      byType[r.feedType] = { quantityKg: parseFloat(r.quantityKg), cost: parseFloat(r.cost) }
    }
  }

  return {
    totalQuantityKg,
    totalCost,
    byType,
    recordCount: records.length,
  }
}

export async function calculateFCR(
  userId: string,
  farmId: string,
  batchId: string,
): Promise<number | null> {
  await verifyFarmAccess(userId, farmId)

  // Get total feed consumed
  const feedSummary = await getFeedSummaryForBatch(userId, farmId, batchId)

  // Get weight samples to calculate weight gain
  const weightSamples = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.averageWeightKg', 'weight_samples.date'])
    .where('weight_samples.batchId', '=', batchId)
    .where('batches.farmId', '=', farmId)
    .orderBy('weight_samples.date', 'asc')
    .execute()

  if (weightSamples.length < 2) {
    return null // Need at least 2 weight samples to calculate gain
  }

  const firstWeight = parseFloat(weightSamples[0].averageWeightKg)
  const lastWeight = parseFloat(
    weightSamples[weightSamples.length - 1].averageWeightKg,
  )
  const weightGain = lastWeight - firstWeight

  if (weightGain <= 0) {
    return null // No weight gain
  }

  // Get batch quantity for total weight gain
  const batch = await db
    .selectFrom('batches')
    .select(['currentQuantity'])
    .where('id', '=', batchId)
    .executeTakeFirst()

  if (!batch) {
    return null
  }

  const totalWeightGain = weightGain * batch.currentQuantity
  const fcr = feedSummary.totalQuantityKg / totalWeightGain

  return Math.round(fcr * 100) / 100 // Round to 2 decimal places
}

export async function getFeedInventory(userId: string, farmId: string) {
  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('feed_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .execute()
}
