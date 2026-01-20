import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Core interface representing a single feeding record with joined batch and supplier info
 */
export interface FeedRecord {
  id: string
  batchId: string
  batchSpecies: string | null
  feedType: string
  brandName: string | null
  quantityKg: string
  cost: string
  date: Date
  supplierName: string | null
  notes: string | null
}

// Re-export constants for backward compatibility
export { FEED_TYPES, type FeedType } from './constants'

/**
 * Data required to create a new feed consumption record.
 */
export interface CreateFeedRecordInput {
  /** ID of the livestock batch being fed */
  batchId: string
  /** The specific category of feed used */
  feedType: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed'
  /** Total weight of feed consumed in kilograms */
  quantityKg: number
  /** Total cost of the feed consumed in the system currency */
  cost: number
  /** Date of the feeding event */
  date: Date
  /** Optional ID of the supplier of the feed */
  supplierId?: string | null
  /** Optional ID of the feed inventory item to deduct from */
  inventoryId?: string | null
  /** Optional name of the feed brand */
  brandName?: string | null
  /** Optional individual bag size in kilograms */
  bagSizeKg?: number | null
  /** Optional number of bags consumed */
  numberOfBags?: number | null
  /** Optional additional notes or observations */
  notes?: string | null
}

/**
 * Parameters for filtering and paginating feeding records.
 */
export interface FeedQuery extends BasePaginatedQuery {
  /** Optional filter for a specific livestock batch */
  batchId?: string
}

/**
 * Create a new feed record, optionally deduct from inventory, and log audit
 *
 * @param userId - ID of the user creating the record
 * @param farmId - ID of the farm
 * @param input - Feed record data
 * @returns Promise resolving to the created record ID
 * @throws {Error} If user lacks access to the farm or inventory is insufficient
 *
 * @example
 * ```typescript
 * const recordId = await createFeedRecord('user_1', 'farm_A', {
 *   batchId: 'batch_123',
 *   feedType: 'starter',
 *   quantityKg: 25,
 *   cost: 15000,
 *   date: new Date()
 * })
 * ```
 */
export async function createFeedRecord(
  userId: string,
  farmId: string,
  input: CreateFeedRecordInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    // Verify batch belongs to farm
    const batch = await db
      .selectFrom('batches')
      .select(['id', 'farmId'])
      .where('id', '=', input.batchId)
      .where('farmId', '=', farmId)
      .executeTakeFirst()

    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId: input.batchId, farmId },
      })
    }

    const result = await db.transaction().execute(async (tx) => {
      let inventoryId: string | null = null

      // If inventoryId provided, deduct from that specific inventory
      if (input.inventoryId) {
        const inventory = await tx
          .selectFrom('feed_inventory')
          .select(['id', 'quantityKg', 'feedType'])
          .where('id', '=', input.inventoryId)
          .where('farmId', '=', farmId)
          .executeTakeFirst()

        if (!inventory) {
          throw new AppError('FEED_RECORD_NOT_FOUND', {
            metadata: { inventoryId: input.inventoryId },
          })
        }

        if (parseFloat(inventory.quantityKg) < input.quantityKg) {
          throw new AppError('INSUFFICIENT_STOCK', {
            metadata: {
              resource: 'Feed',
              available: parseFloat(inventory.quantityKg),
              requested: input.quantityKg,
            },
            message: `Insufficient inventory. Available: ${parseFloat(inventory.quantityKg)}kg`,
          })
        }

        // Deduct from inventory
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

        inventoryId = inventory.id
      }

      // Record the feed consumption
      return await tx
        .insertInto('feed_records')
        .values({
          batchId: input.batchId,
          feedType: input.feedType,
          quantityKg: input.quantityKg.toString(),
          cost: input.cost.toString(),
          date: input.date,
          supplierId: input.supplierId || null,
          inventoryId: inventoryId,
          brandName: input.brandName || null,
          bagSizeKg: input.bagSizeKg || null,
          numberOfBags: input.numberOfBags || null,
          notes: input.notes || null,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
    })

    // Log audit
    const { logAudit } = await import('~/features/logging/audit')
    await logAudit({
      userId,
      action: 'create',
      entityType: 'feed_record',
      entityId: result.id,
      details: input,
    })

    return result.id
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create feed record',
      cause: error,
    })
  }
}

// Server function for client-side calls
export const createFeedRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; record: CreateFeedRecordInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createFeedRecord(session.user.id, data.farmId, data.record)
  })

/**
 * Delete a feeding record and restore the consumed quantity back to inventory
 *
 * @param userId - ID of the user performing the deletion
 * @param farmId - ID of the farm
 * @param recordId - ID of the feed record to delete
 * @throws {Error} If record is not found or access is denied
 */
export async function deleteFeedRecord(
  userId: string,
  farmId: string,
  recordId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    // Get the record to restore inventory
    const record = await db
      .selectFrom('feed_records')
      .innerJoin('batches', 'batches.id', 'feed_records.batchId')
      .select([
        'feed_records.id',
        'feed_records.feedType',
        'feed_records.quantityKg',
      ])
      .where('feed_records.id', '=', recordId)
      .where('batches.farmId', '=', farmId)
      .executeTakeFirst()

    if (!record) {
      throw new AppError('FEED_RECORD_NOT_FOUND', {
        metadata: { recordId },
      })
    }

    await db.transaction().execute(async (tx) => {
      // Restore inventory
      await tx
        .updateTable('feed_inventory')
        .set((eb) => ({
          quantityKg: eb(
            'quantityKg',
            '+',
            parseFloat(record.quantityKg).toString(),
          ),
          updatedAt: new Date(),
        }))
        .where('farmId', '=', farmId)
        .where('feedType', '=', record.feedType)
        .execute()

      // Delete the record
      await tx.deleteFrom('feed_records').where('id', '=', recordId).execute()
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete feed record',
      cause: error,
    })
  }
}

// Server function for client-side calls
export const deleteFeedRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteFeedRecord(session.user.id, data.farmId, data.recordId)
  })

/**
 * Update an existing feeding record and adjust inventory accordingly
 *
 * @param userId - ID of the user performing the update
 * @param farmId - ID of the farm
 * @param recordId - ID of the record to update
 * @param data - Partial feed record data
 * @throws {Error} If record not found, or insufficient inventory for new selection
 */
export async function updateFeedRecord(
  userId: string,
  farmId: string,
  recordId: string,
  data: Partial<CreateFeedRecordInput>,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    await db.transaction().execute(async (tx) => {
      // 1. Get existing record
      const existingRecord = await tx
        .selectFrom('feed_records')
        .selectAll()
        .where('id', '=', recordId)
        .executeTakeFirst()

      if (!existingRecord) {
        throw new AppError('FEED_RECORD_NOT_FOUND', {
          metadata: { recordId },
        })
      }

      // If quantity or feedType is changing, we need to adjust inventory
      if (
        (data.quantityKg &&
          data.quantityKg !== parseFloat(existingRecord.quantityKg)) ||
        (data.feedType && data.feedType !== existingRecord.feedType)
      ) {
        // 2. Restore old inventory
        await tx
          .updateTable('feed_inventory')
          .set((eb) => ({
            quantityKg: eb(
              'quantityKg',
              '+',
              parseFloat(existingRecord.quantityKg).toString(),
            ),
            updatedAt: new Date(),
          }))
          .where('farmId', '=', farmId)
          .where('feedType', '=', existingRecord.feedType)
          .execute()

        // 3. Deduct new inventory
        const newQuantity =
          data.quantityKg || parseFloat(existingRecord.quantityKg)
        const newFeedType = data.feedType || existingRecord.feedType

        const inventory = await tx
          .selectFrom('feed_inventory')
          .select(['id', 'quantityKg'])
          .where('farmId', '=', farmId)
          .where('feedType', '=', newFeedType)
          .executeTakeFirst()

        if (!inventory || parseFloat(inventory.quantityKg) < newQuantity) {
          throw new AppError('INSUFFICIENT_STOCK', {
            metadata: {
              resource: 'Feed',
              available: inventory ? parseFloat(inventory.quantityKg) : 0,
              requested: newQuantity,
            },
            message: `Insufficient inventory for ${newFeedType}. Available: ${inventory ? parseFloat(inventory.quantityKg) : 0}kg`,
          })
        }

        await tx
          .updateTable('feed_inventory')
          .set((eb) => ({
            quantityKg: eb('quantityKg', '-', newQuantity.toString()),
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update feed record',
      cause: error,
    })
  }
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
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateFeedRecord(
      session.user.id,
      data.farmId,
      data.recordId,
      data.data,
    )
  })

/**
 * Retrieve all feeding records for a specific livestock batch
 *
 * @param userId - ID of the user
 * @param batchId - ID of the batch
 * @returns Promise resolving to an array of feed records
 */
export async function getFeedRecordsForBatch(userId: string, batchId: string) {
  const { db } = await import('~/lib/db')
  const { getBatchById } = await import('../batches/server')

  try {
    const batch = await getBatchById(userId, batchId)
    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId },
      })
    }

    return await db
      .selectFrom('feed_records')
      .selectAll()
      .where('batchId', '=', batchId)
      .orderBy('date', 'desc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch batch feed records',
      cause: error,
    })
  }
}

/**
 * Fetches all feeding records for one or more farms.
 * Defaults to all farms belonging to the user if no specific farm is provided.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional specific farm to filter by
 */
export async function getFeedRecords(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
    }

    return await db
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch feed records',
      cause: error,
    })
  }
}

/**
 * Get summary of total feed consumption and costs for a batch, grouped by feed type
 *
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param batchId - ID of the batch
 * @returns Promise resolving to a feed summary object
 */
export async function getFeedSummaryForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
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

    const byType: {
      [key: string]: { quantityKg: number; cost: number } | undefined
    } = {}
    for (const r of records) {
      const existing = byType[r.feedType]
      if (existing) {
        existing.quantityKg += parseFloat(r.quantityKg)
        existing.cost += parseFloat(r.cost)
      } else {
        byType[r.feedType] = {
          quantityKg: parseFloat(r.quantityKg),
          cost: parseFloat(r.cost),
        }
      }
    }

    return {
      totalQuantityKg,
      totalCost,
      byType,
      recordCount: records.length,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch feed summary',
      cause: error,
    })
  }
}

/**
 * Calculate the Feed Conversion Ratio (FCR) for a batch based on feed consumed and weight gain
 *
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param batchId - ID of the batch
 * @returns Promise resolving to the FCR (number) or null if data is insufficient
 */
export async function calculateFCR(
  userId: string,
  farmId: string,
  batchId: string,
): Promise<number | null> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to calculate FCR',
      cause: error,
    })
  }
}

/**
 * Fetches the current inventory levels for all feed types.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional specific farm to filter by
 */
export async function getFeedInventory(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
    }

    return await db
      .selectFrom('feed_inventory')
      .selectAll()
      .where('farmId', 'in', targetFarmIds)
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch feed inventory',
      cause: error,
    })
  }
}

/**
 * Perform a paginated query for feeding records with sorting and search support
 *
 * @param userId - ID of the user
 * @param query - Pagination and filtering parameters
 * @returns Promise resolving to a paginated result set
 */
export async function getFeedRecordsPaginated(
  userId: string,
  query: FeedQuery = {},
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { sql } = await import('kysely')

  try {
    let targetFarmIds: Array<string> = []
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
          eb('feed_records.feedType', 'ilike', searchLower as any),
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
      .leftJoin('suppliers', 'suppliers.id', 'feed_records.supplierId')
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
        'batches.batchName',
        'farms.name as farmName',
        'batches.farmId',
        'suppliers.name as supplierName',
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
      // @ts-ignore - Kysely dynamic column type limitation
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch paginated feed records',
      cause: error,
    })
  }
}

// Server function for paginated feed records
export const getFeedRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: FeedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getFeedRecordsPaginated(session.user.id, data)
  })

/**
 * Generates high-level statistics for feed consumption.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional specific farm to filter by
 */
export async function getFeedStats(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []
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

    const totalQuantityKg = records.reduce(
      (sum, r) => sum + parseFloat(r.quantityKg),
      0,
    )
    const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0)

    return {
      totalQuantityKg,
      totalCost,
      recordCount: records.length,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch feed stats',
      cause: error,
    })
  }
}
