import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Input for recording egg collection and wastage.
 */
export interface CreateEggRecordInput {
  /** ID of the layer poultry batch */
  batchId: string
  /** Collection date */
  date: Date
  /** Total quantity of good eggs collected */
  quantityCollected: number
  /** Number of eggs broken or discarded during collection */
  quantityBroken: number
  /** Number of eggs from this batch sold specifically on this date */
  quantitySold: number
}

/**
 * Filter parameters for paginated egg record queries.
 */
export interface EggQuery extends BasePaginatedQuery {
  /** Optional filter by specific poultry batch */
  batchId?: string
}

/**
 * Creates a new egg production record.
 * Validates that the batch is of type 'poultry'.
 *
 * @param userId - ID of the user performing the action
 * @param farmId - ID of the farm owning the batch
 * @param input - Production and wastage metrics
 * @returns Promise resolving to the new record ID
 * @throws {Error} If batch not found or is not a poultry batch
 */
export async function createEggRecord(
  userId: string,
  farmId: string,
  input: CreateEggRecordInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    // Verify batch belongs to farm and is a layer batch
    const batch = await db
      .selectFrom('batches')
      .select(['id', 'farmId', 'species', 'livestockType'])
      .where('id', '=', input.batchId)
      .where('farmId', '=', farmId)
      .executeTakeFirst()

    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId: input.batchId, farmId },
      })
    }

    if (batch.livestockType !== 'poultry') {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Egg records can only be created for poultry batches',
      })
    }

    const result = await db
      .insertInto('egg_records')
      .values({
        batchId: input.batchId,
        date: input.date,
        quantityCollected: input.quantityCollected,
        quantityBroken: input.quantityBroken,
        quantitySold: input.quantitySold,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    return result.id
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create egg record',
      cause: error,
    })
  }
}

// Server function for client-side calls
export const createEggRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; record: CreateEggRecordInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createEggRecord(session.user.id, data.farmId, data.record)
  })

/**
 * Delete an egg record
 */
export async function deleteEggRecord(
  userId: string,
  farmId: string,
  recordId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    // Verify record exists and belongs to a batch in this farm
    const record = await db
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .select(['egg_records.id'])
      .where('egg_records.id', '=', recordId)
      .where('batches.farmId', '=', farmId)
      .executeTakeFirst()

    if (!record) {
      throw new AppError('EGG_RECORD_NOT_FOUND', {
        metadata: { resource: 'EggRecord', id: recordId },
      })
    }

    await db.deleteFrom('egg_records').where('id', '=', recordId).execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete egg record',
      cause: error,
    })
  }
}

// Server function for client-side calls
export const deleteEggRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteEggRecord(session.user.id, data.farmId, data.recordId)
  })

/**
 * Data structure for updating an egg production record.
 */
export interface UpdateEggRecordInput {
  /** Updated date */
  date?: Date
  /** Updated collection count */
  quantityCollected?: number
  /** Updated breakage count */
  quantityBroken?: number
  /** Updated sales count */
  quantitySold?: number
}

/**
 * Updates an existing production entry.
 *
 * @param userId - ID of the user performing the update
 * @param recordId - ID of the record to update
 * @param data - Partial update parameters
 * @returns Promise resolving to true on success
 */
export async function updateEggRecord(
  userId: string,
  recordId: string,
  data: UpdateEggRecordInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  try {
    const userFarms = await getUserFarms(userId)
    const farmIds = userFarms // string[]

    const record = await db
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .select(['egg_records.id', 'batches.farmId'])
      .where('egg_records.id', '=', recordId)
      .executeTakeFirst()

    if (!record)
      throw new AppError('EGG_RECORD_NOT_FOUND', {
        metadata: { resource: 'EggRecord', id: recordId },
      })
    if (!farmIds.includes(record.farmId))
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: record.farmId },
      })

    await db
      .updateTable('egg_records')
      .set(data)
      .where('id', '=', recordId)
      .execute()

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update egg record',
      cause: error,
    })
  }
}

export const updateEggRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateEggRecordInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateEggRecord(session.user.id, data.recordId, data.data)
  })

/**
 * Get egg records for a user - optionally filtered by farm (All Farms Support)
 */
/**
 * Retrieves egg records for a user, optionally filtered by farm ID and date range.
 * Supports cross-farm data aggregation.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional farm filter
 * @param options - Start and end date filters
 * @returns Array of production records with batch and farm details
 */
export async function getEggRecords(
  userId: string,
  farmId?: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []

    if (farmId) {
      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess)
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    let query = db
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .select([
        'egg_records.id',
        'egg_records.batchId',
        'egg_records.date',
        'egg_records.quantityCollected',
        'egg_records.quantityBroken',
        'egg_records.quantitySold',
        'egg_records.createdAt',
        'batches.species as batchSpecies',
        'batches.farmId',
        'farms.name as farmName',
      ])
      .where('batches.farmId', 'in', targetFarmIds)

    if (options?.startDate) {
      query = query.where('egg_records.date', '>=', options.startDate)
    }
    if (options?.endDate) {
      query = query.where('egg_records.date', '<=', options.endDate)
    }

    return await query.orderBy('egg_records.date', 'desc').execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch egg records',
      cause: error,
    })
  }
}

export async function getEggRecordsForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    return await db
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .select([
        'egg_records.id',
        'egg_records.batchId',
        'egg_records.date',
        'egg_records.quantityCollected',
        'egg_records.quantityBroken',
        'egg_records.quantitySold',
        'egg_records.createdAt',
      ])
      .where('egg_records.batchId', '=', batchId)
      .where('batches.farmId', '=', farmId)
      .orderBy('egg_records.date', 'desc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch egg records for batch',
      cause: error,
    })
  }
}

export async function getEggRecordsForFarm(userId: string, farmId: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    return await db
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .select([
        'egg_records.id',
        'egg_records.batchId',
        'egg_records.date',
        'egg_records.quantityCollected',
        'egg_records.quantityBroken',
        'egg_records.quantitySold',
        'egg_records.createdAt',
        'batches.species',
        'batches.currentQuantity',
      ])
      .where('batches.farmId', '=', farmId)
      .where('batches.livestockType', '=', 'poultry')
      .orderBy('egg_records.date', 'desc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch egg records for farm',
      cause: error,
    })
  }
}

/**
 * Aggregates production totals, breakage, and current cumulative inventory.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional farm filter
 * @returns Summary metrics including total collected and current stock
 */
export async function getEggRecordsSummary(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []

    if (farmId) {
      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess)
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) {
        return {
          totalCollected: 0,
          totalBroken: 0,
          totalSold: 0,
          currentInventory: 0,
          recordCount: 0,
        }
      }
    }

    const records = await db
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .select([
        'egg_records.quantityCollected',
        'egg_records.quantityBroken',
        'egg_records.quantitySold',
        'batches.currentQuantity',
      ])
      .where('batches.farmId', 'in', targetFarmIds)
      .execute()

    const totalCollected = records.reduce(
      (sum, r) => sum + r.quantityCollected,
      0,
    )
    const totalBroken = records.reduce((sum, r) => sum + r.quantityBroken, 0)
    const totalSold = records.reduce((sum, r) => sum + r.quantitySold, 0)
    const currentInventory = totalCollected - totalBroken - totalSold

    return {
      totalCollected,
      totalBroken,
      totalSold,
      currentInventory,
      recordCount: records.length,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch egg records summary',
      cause: error,
    })
  }
}

/**
 * Calculates what percentage of the current flock produced eggs on a given date.
 *
 * @param userId - ID of the calling user
 * @param farmId - ID of the farm
 * @param batchId - ID of the layer batch
 * @param date - Optional specific date (defaults to most recent collection)
 * @returns Average laying percentage (0-100) or null if no flock present
 */
export async function calculateLayingPercentage(
  userId: string,
  farmId: string,
  batchId: string,
  date?: Date,
): Promise<number | null> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    // Get batch current quantity
    const batch = await db
      .selectFrom('batches')
      .select(['currentQuantity'])
      .where('id', '=', batchId)
      .where('farmId', '=', farmId)
      .executeTakeFirst()

    if (!batch || batch.currentQuantity === 0) {
      return null
    }

    // Get eggs collected for the date (or most recent)
    let query = db
      .selectFrom('egg_records')
      .select(['quantityCollected'])
      .where('batchId', '=', batchId)

    if (date) {
      query = query.where('date', '=', date)
    } else {
      query = query.orderBy('date', 'desc').limit(1)
    }

    const record = await query.executeTakeFirst()

    if (!record) {
      return null
    }

    const layingPercentage =
      (record.quantityCollected / batch.currentQuantity) * 100
    return Math.round(layingPercentage * 100) / 100
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to calculate laying percentage',
      cause: error,
    })
  }
}

export async function getEggInventory(
  userId: string,
  farmId: string,
  batchId?: string,
): Promise<number> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    let query = db
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .select([
        'egg_records.quantityCollected',
        'egg_records.quantityBroken',
        'egg_records.quantitySold',
      ])
      .where('batches.farmId', '=', farmId)

    if (batchId) {
      query = query.where('egg_records.batchId', '=', batchId)
    }

    const records = await query.execute()

    const totalCollected = records.reduce(
      (sum, r) => sum + r.quantityCollected,
      0,
    )
    const totalBroken = records.reduce((sum, r) => sum + r.quantityBroken, 0)
    const totalSold = records.reduce((sum, r) => sum + r.quantitySold, 0)

    return totalCollected - totalBroken - totalSold
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch egg inventory',
      cause: error,
    })
  }
}

/**
 * Retrieves a filtered and sorted list of production entries.
 *
 * @param userId - ID of the requesting user
 * @param query - Sorting, searches, and pagination params
 * @returns Paginated result set of egg collection entries
 */
export async function getEggRecordsPaginated(
  userId: string,
  query: EggQuery = {},
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
      .selectFrom('egg_records')
      .innerJoin('batches', 'batches.id', 'egg_records.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .where('batches.farmId', 'in', targetFarmIds)

    // Apply filters
    if (query.search) {
      const searchLower = `%${query.search.toLowerCase()}%`
      baseQuery = baseQuery.where((eb) =>
        eb.or([eb('batches.species', 'ilike', searchLower)]),
      )
    }

    if (query.batchId) {
      baseQuery = baseQuery.where('egg_records.batchId', '=', query.batchId)
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
        'egg_records.id',
        'egg_records.batchId',
        'egg_records.date',
        'egg_records.quantityCollected',
        'egg_records.quantityBroken',
        'egg_records.quantitySold',
        'egg_records.createdAt',
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

      let sortColumn = `egg_records.${query.sortBy}`
      // Map specific sort keys
      if (query.sortBy === 'species') sortColumn = 'batches.species'
      if (query.sortBy === 'date') sortColumn = 'egg_records.date'

      // @ts-ignore - Kysely dynamic column type limitation
      dataQuery = dataQuery.orderBy(sortColumn, sortOrder)
    } else {
      dataQuery = dataQuery.orderBy('egg_records.date', 'desc')
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
      message: 'Failed to fetch paginated egg records',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated egg production records.
 */
export const getEggRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: EggQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getEggRecordsPaginated(session.user.id, data)
  })
