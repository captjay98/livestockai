import { createServerFn } from '@tanstack/react-start'

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

export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
  batchId?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function createFeedRecord(
  userId: string,
  farmId: string,
  input: CreateFeedRecordInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

// Server function for client-side calls
export const createFeedRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; record: CreateFeedRecordInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return createFeedRecord(session.user.id, data.farmId, data.record)
  })

/**
 * Delete a feed record and restore inventory
 */
export async function deleteFeedRecord(userId: string, farmId: string, recordId: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  // Get the record to restore inventory
  const record = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select(['feed_records.id', 'feed_records.feedType', 'feed_records.quantityKg'])
    .where('feed_records.id', '=', recordId)
    .where('batches.farmId', '=', farmId)
    .executeTakeFirst()

  if (!record) {
    throw new Error('Feed record not found')
  }

  await db.transaction().execute(async (tx) => {
    // Restore inventory
    await tx
      .updateTable('feed_inventory')
      .set(eb => ({
        quantityKg: eb('quantityKg', '+', parseFloat(record.quantityKg)),
        updatedAt: new Date(),
      }))
      .where('farmId', '=', farmId)
      .where('feedType', '=', record.feedType)
      .execute()

    // Delete the record
    await tx.deleteFrom('feed_records').where('id', '=', recordId).execute()
  })
}

// Server function for client-side calls
export const deleteFeedRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return deleteFeedRecord(session.user.id, data.farmId, data.recordId)
  })

export async function updateFeedRecord(
  userId: string,
  farmId: string,
  recordId: string,
  data: Partial<CreateFeedRecordInput>,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  await db.transaction().execute(async (tx) => {
    // 1. Get existing record
    const existingRecord = await tx
      .selectFrom('feed_records')
      .selectAll()
      .where('id', '=', recordId)
      .executeTakeFirst()

    if (!existingRecord) {
      throw new Error('Feed record not found')
    }

    // If quantity or feedType is changing, we need to adjust inventory
    if (
      (data.quantityKg && data.quantityKg !== parseFloat(existingRecord.quantityKg)) ||
      (data.feedType && data.feedType !== existingRecord.feedType)
    ) {
      // 2. Restore old inventory
      await tx
        .updateTable('feed_inventory')
        .set((eb) => ({
          quantityKg: eb('quantityKg', '+', parseFloat(existingRecord.quantityKg)),
          updatedAt: new Date(),
        }))
        .where('farmId', '=', farmId)
        .where('feedType', '=', existingRecord.feedType)
        .execute()

      // 3. Deduct new inventory
      const newQuantity = data.quantityKg || parseFloat(existingRecord.quantityKg)
      const newFeedType = data.feedType || existingRecord.feedType

      const inventory = await tx
        .selectFrom('feed_inventory')
        .select(['id', 'quantityKg'])
        .where('farmId', '=', farmId)
        .where('feedType', '=', newFeedType)
        .executeTakeFirst()

      if (!inventory || parseFloat(inventory.quantityKg) < newQuantity) {
        throw new Error(
          `Insufficient inventory for ${newFeedType}. Available: ${inventory ? parseFloat(inventory.quantityKg) : 0}kg`,
        )
      }

      await tx
        .updateTable('feed_inventory')
        .set((eb) => ({
          quantityKg: eb('quantityKg', '-', newQuantity),
          updatedAt: new Date(),
        }))
        .where('id', '=', inventory.id)
        .execute()
    }

    // 4. Update the record
    await tx
      .updateTable('feed_records')
      .set({
        quantityKg: data.quantityKg?.toString(),
        feedType: data.feedType as any,
        cost: data.cost?.toString(),
        date: data.date,
        batchId: data.batchId,
      })
      .where('id', '=', recordId)
      .execute()
  })
}

export const updateFeedRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      recordId: string
      data: Partial<CreateFeedRecordInput>
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return updateFeedRecord(session.user.id, data.farmId, data.recordId, data.data)
  })

export async function getFeedRecordsForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

export async function getFeedRecords(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  return db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
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
      'farms.name as farmName',
      'batches.farmId',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('feed_records.date', 'desc')
    .execute()
}

export async function getFeedSummaryForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

export async function getFeedInventory(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  return db
    .selectFrom('feed_inventory')
    .selectAll()
    .where('farmId', 'in', targetFarmIds)
    .execute()
}

export async function getFeedRecordsPaginated(
  userId: string,
  query: PaginatedQuery = {},
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')
  const { sql } = await import('kysely')

  let targetFarmIds: string[] = []
  if (query.farmId) {
    targetFarmIds = [query.farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', targetFarmIds)

  // Apply filters
  if (query.search) {
    const searchLower = `%${query.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('feed_records.feedType', 'ilike', searchLower),
        eb('batches.species', 'ilike', searchLower),
      ]),
    )
  }

  if (query.batchId) {
    baseQuery = baseQuery.where('feed_records.batchId', '=', query.batchId)
  }

  // Get total count
  const countResult = await baseQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Get data
  let dataQuery = baseQuery
    .select([
      'feed_records.id',
      'feed_records.batchId',
      'feed_records.feedType',
      'feed_records.brandName',
      'feed_records.bagSizeKg',
      'feed_records.numberOfBags',
      'feed_records.quantityKg',
      'feed_records.cost',
      'feed_records.date',
      'feed_records.supplierId',
      'feed_records.notes',
      'feed_records.createdAt',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .limit(pageSize)
    .offset(offset)

  // Apply sorting
  if (query.sortBy) {
    const sortOrder = query.sortOrder || 'desc'
    // Map helpful aliases
    const sortMap: Record<string, string> = {
      date: 'feed_records.date',
      cost: 'feed_records.cost',
      quantityKg: 'feed_records.quantityKg',
      feedType: 'feed_records.feedType',
    }
    const sortColumn = sortMap[query.sortBy] || `feed_records.${query.sortBy}`
    // @ts-ignore
    dataQuery = dataQuery.orderBy(sortColumn, sortOrder)
  } else {
    dataQuery = dataQuery.orderBy('feed_records.date', 'desc')
  }

  const data = await dataQuery.execute()

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// Server function for paginated feed records
export const getFeedRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getFeedRecordsPaginated(session.user.id, data)
  })

export async function getFeedStats(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  const records = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select(['feed_records.quantityKg', 'feed_records.cost'])
    .where('batches.farmId', 'in', targetFarmIds)
    .execute()

  const totalQuantityKg = records.reduce((sum, r) => sum + parseFloat(r.quantityKg), 0)
  const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0)

  return {
    totalQuantityKg,
    totalCost,
    recordCount: records.length,
  }
}
