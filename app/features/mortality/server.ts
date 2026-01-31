import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Core interface representing a single mortality record
 */
export interface MortalityRecord {
  /** Unique record ID */
  id: string
  /** ID of the batch affected */
  batchId: string
  /** Species of the batch (joined) */
  species: string
  /** Livestock type (joined from batch) */
  livestockType: string
  /** Farm name (joined) */
  farmName: string
  /** Farm ID (joined from batch) */
  farmId: string
  /** Number of animals deceased */
  quantity: number
  /** Date of the mortality event */
  date: Date
  /** Cause of death */
  cause: string
  /** Optional notes */
  notes: string | null
  /** Record creation timestamp */
  createdAt: Date
}

/**
 * Data required to record a new mortality event
 */
export interface CreateMortalityData {
  /** ID of the affected livestock batch */
  batchId: string
  /** Number of heads lost */
  quantity: number
  /** Date of occurrence */
  date: Date
  /** Categorized cause of death */
  cause:
    | 'disease'
    | 'predator'
    | 'weather'
    | 'unknown'
    | 'other'
    | 'starvation'
    | 'injury'
    | 'poisoning'
    | 'suffocation'
    | 'culling'
  /** Optional descriptive notes */
  notes?: string | null
}

/**
 * Parameters for filtering and paginating mortality records.
 */
export interface MortalityQuery extends BasePaginatedQuery {
  /** Optional filter for a specific livestock batch */
  batchId?: string
  /** Optional filter by cause of death */
  cause?: string
}

/**
 * Record a mortality event and automatically update batch quantity
 *
 * This function creates a mortality record and decrements the batch's current quantity
 * in a single transaction. If the mortality reduces quantity to zero, the batch status
 * is automatically set to 'depleted'.
 *
 * @param userId - ID of the user recording the mortality
 * @param data - Mortality event details including batch, quantity, date, and cause
 * @returns Promise resolving to the created mortality record ID
 * @throws {Error} If batch not found, access denied, or invalid quantity
 *
 * @example
 * ```typescript
 * const recordId = await recordMortality('user-123', {
 *   batchId: 'batch-456',
 *   quantity: 5,
 *   date: new Date(),
 *   cause: 'disease',
 *   notes: 'Newcastle disease outbreak'
 * })
 * ```
 */
export async function recordMortality(
  userId: string,
  data: CreateMortalityData,
): Promise<string> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getBatchById } = await import('../batches/server')

  try {
    // Verify batch access
    const batch = await getBatchById(userId, data.batchId)
    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId: data.batchId },
      })
    }

    // Check if mortality quantity is valid
    if (data.quantity <= 0) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Mortality quantity must be greater than 0',
      })
    }

    if (data.quantity > batch.currentQuantity) {
      throw new AppError('INSUFFICIENT_STOCK', {
        message: 'Mortality quantity cannot exceed current batch quantity',
        metadata: {
          current: batch.currentQuantity,
          requested: data.quantity,
        },
      })
    }

    // Start transaction
    const recordId = await db.transaction().execute(async (trx) => {
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

      // Update batch quantity atomically
      const { sql } = await import('kysely')
      await trx
        .updateTable('batches')
        .set((eb) => ({
          currentQuantity: eb('currentQuantity', '-', data.quantity),
          status: sql`CASE WHEN "currentQuantity" - ${data.quantity} <= 0 THEN 'depleted' ELSE 'active' END`,
          updatedAt: new Date(),
        }))
        .where('id', '=', data.batchId)
        .execute()

      return result.id
    })

    // Log audit (outside transaction)
    const { logAudit } = await import('~/lib/logging/audit')
    await logAudit({
      userId,
      action: 'create',
      entityType: 'mortality',
      entityId: recordId,
      details: data,
    })

    return recordId
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to record mortality',
      cause: error,
    })
  }
}

// Server function for client-side calls
const createMortalitySchema = z.object({
  farmId: z.string().uuid(),
  data: z.object({
    batchId: z.string().uuid(),
    quantity: z.number().int().positive(),
    date: z.coerce.date(),
    cause: z.enum([
      'disease',
      'predator',
      'weather',
      'unknown',
      'other',
      'starvation',
      'injury',
      'poisoning',
      'suffocation',
      'culling',
    ]),
    notes: z.string().max(500).nullish(),
  }),
})

export const recordMortalityFn = createServerFn({ method: 'POST' })
  .inputValidator(createMortalitySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return recordMortality(session.user.id, data.data)
  })

/**
 * Retrieve all mortality records for a specific batch
 *
 * @param userId - ID of the user requesting records
 * @param batchId - ID of the batch to query
 * @returns Promise resolving to array of mortality records, ordered by date (newest first)
 * @throws {Error} If batch not found or access denied
 *
 * @example
 * ```typescript
 * const records = await getMortalityRecords('user-123', 'batch-456')
 * // Returns: [{ id, batchId, quantity, date, cause, notes }, ...]
 * ```
 */
export async function getMortalityRecords(userId: string, batchId: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getBatchById } = await import('../batches/server')

  try {
    // Verify batch access
    const batch = await getBatchById(userId, batchId)
    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
    }

    return await db
      .selectFrom('mortality_records')
      .select([
        'id',
        'batchId',
        'quantity',
        'date',
        'cause',
        'notes',
        'createdAt',
      ])
      .where('batchId', '=', batchId)
      .orderBy('date', 'desc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch mortality records',
      cause: error,
    })
  }
}

/**
 * Server function to get mortality records for a specific batch
 */
export const getMortalityRecordsForBatchFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ batchId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getMortalityRecords(session.user.id, data.batchId)
  })

/**
 * Calculate comprehensive mortality statistics for a batch
 *
 * Aggregates total deaths, mortality rate, breakdown by cause, and recent trends.
 *
 * @param userId - ID of the user requesting statistics
 * @param batchId - ID of the batch to analyze
 * @returns Promise resolving to mortality statistics object with totals, rates, and cause breakdown
 * @throws {Error} If batch not found or access denied
 *
 * @example
 * ```typescript
 * const stats = await getMortalityStats('user-123', 'batch-456')
 * // Returns: { totalDeaths: 15, mortalityRate: 15%, byCause: {...}, recent: [...] }
 * ```
 */
export async function getMortalityStats(userId: string, batchId: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getBatchById } = await import('../batches/server')

  try {
    // Verify batch access
    const batch = await getBatchById(userId, batchId)
    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
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
    const mortalityRate =
      batch.initialQuantity > 0
        ? (totalMortality / batch.initialQuantity) * 100
        : 0

    // Calculate recent mortality rate
    const recentMortalityRate =
      batch.initialQuantity > 0
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
      byCause: causeStats.map((stat) => ({
        cause: stat.cause,
        count: Number(stat.count),
        quantity: Number(stat.quantity),
        percentage:
          totalMortality > 0
            ? (Number(stat.quantity) / totalMortality) * 100
            : 0,
      })),
      batch: {
        initialQuantity: batch.initialQuantity,
        currentQuantity: batch.currentQuantity,
        remaining: batch.currentQuantity,
        lost: totalMortality,
      },
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch mortality stats',
      cause: error,
    })
  }
}

/**
 * Get mortality trends for a batch (daily/weekly/monthly)
 *
 * @param userId - ID of the user
 * @param batchId - ID of the batch
 * @param period - Time grouping (daily, weekly, monthly)
 * @param days - Number of days to look back
 * @returns Promise resolving to an array of trend data points
 */
export async function getMortalityTrends(
  userId: string,
  batchId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30,
) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getBatchById } = await import('../batches/server')

  try {
    // Verify batch access
    const batch = await getBatchById(userId, batchId)
    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
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
        (eb) =>
          eb.fn('to_char', [eb.ref('date'), eb.val(dateFormat)]).as('period'),
        db.fn.count('id').as('records'),
        db.fn.sum('quantity').as('quantity'),
      ])
      .where('batchId', '=', batchId)
      .where('date', '>=', startDate)
      .groupBy((eb) => eb.fn('to_char', [eb.ref('date'), eb.val(dateFormat)]))
      .orderBy(
        (eb) => eb.fn('to_char', [eb.ref('date'), eb.val(dateFormat)]),
        'asc',
      )
      .execute()

    return trends.map((trend) => ({
      period: trend.period,
      records: Number(trend.records),
      quantity: Number(trend.quantity),
    }))
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch mortality trends',
      cause: error,
    })
  }
}

/**
 * Perform a paginated query for mortality records with sorting and search support
 *
 * @param userId - ID of the user
 * @param query - Pagination and filtering parameters
 * @returns Promise resolving to a paginated result set
 */
export async function getMortalityRecordsPaginated(
  userId: string,
  query: MortalityQuery = {},
) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
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
      .selectFrom('mortality_records')
      .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .where('batches.farmId', 'in', targetFarmIds)

    // Apply filters
    if (query.search) {
      const searchLower = `%${query.search.toLowerCase()}%`
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb(sql.raw('mortality_records.cause'), 'ilike', searchLower),
          eb('mortality_records.notes', 'ilike', searchLower),
          eb('batches.species', 'ilike', searchLower),
        ]),
      )
    }

    if (query.batchId) {
      baseQuery = baseQuery.where(
        'mortality_records.batchId',
        '=',
        query.batchId,
      )
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
        'mortality_records.id',
        'mortality_records.batchId',
        'mortality_records.quantity',
        'mortality_records.date',
        'mortality_records.cause',
        'mortality_records.notes',
        'mortality_records.createdAt',
        'batches.species',
        'batches.livestockType',
        'farms.name as farmName',
        'batches.farmId',
      ])
      .limit(pageSize)
      .offset(offset)

    // Apply sorting - validate columns to prevent SQL injection
    if (query.sortBy) {
      const sortOrder = query.sortOrder || 'desc'
      const allowedCols: Record<string, string> = {
        date: 'mortality_records.date',
        quantity: 'mortality_records.quantity',
        cause: 'mortality_records.cause',
        createdAt: 'mortality_records.createdAt',
        species: 'batches.species',
      }
      const sortColumn = allowedCols[query.sortBy] || 'mortality_records.date'
      dataQuery = dataQuery.orderBy(sql.raw(sortColumn), sortOrder)
    } else {
      dataQuery = dataQuery.orderBy('mortality_records.date', 'desc')
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
      message: 'Failed to fetch paginated mortality records',
      cause: error,
    })
  }
}

// Server function for paginated mortality records
const mortalityQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  farmId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
})

export const getMortalityRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator(mortalityQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getMortalityRecordsPaginated(session.user.id, data)
  })

/**
 * Get a summary of mortality losses across all farms or for a specific farm
 *
 * @param userId - ID of the user
 * @param farmId - Optional farm ID to filter by
 * @returns Promise resolving to a mortality summary object
 */
export async function getMortalitySummary(userId: string, farmId?: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getUserFarms } = await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
    }

    const records = await db
      .selectFrom('mortality_records')
      .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
      .select(['mortality_records.quantity'])
      .where('batches.farmId', 'in', targetFarmIds)
      .execute()

    const totalDeaths = records.reduce((sum, r) => sum + r.quantity, 0)

    // Count alerts (this might be expensive if called frequently, but manageable)
    const { getAllBatchAlertsFn } = await import('~/features/monitoring/server')
    const alerts = (await getAllBatchAlertsFn({
      data: { farmId },
    })) as Array<any>
    // Filter for ONLY mortality logic alerts to keep summary consistent?
    // Actually the UI just says "Critical Alerts", so using all is probably fine/better.
    const criticalAlerts = alerts.filter((a) => a.type === 'critical').length
    const totalAlerts = alerts.length

    return {
      totalDeaths,
      recordCount: records.length,
      criticalAlerts,
      totalAlerts,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch mortality summary',
      cause: error,
    })
  }
}

/**
 * Data available for updating an existing mortality record.
 */
export interface UpdateMortalityInput {
  /** Updated number of animals lost */
  quantity?: number
  /** Updated date of occurrence */
  date?: Date
  /** Updated cause of death */
  cause?:
    | 'disease'
    | 'predator'
    | 'weather'
    | 'unknown'
    | 'other'
    | 'starvation'
    | 'injury'
    | 'poisoning'
    | 'suffocation'
    | 'culling'
  /** Updated optional notes */
  notes?: string | null
}

/**
 * Update a mortality record and adjust batch quantity if the mortality count changed
 *
 * @param userId - ID of the user
 * @param recordId - ID of the mortality record to update
 * @param input - Updated data
 * @throws {Error} If record not found, or access denied
 */
export async function updateMortalityRecord(
  userId: string,
  recordId: string,
  input: UpdateMortalityInput,
): Promise<void> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const existing = await db
      .selectFrom('mortality_records')
      .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
      .select([
        'mortality_records.id',
        'mortality_records.batchId',
        'mortality_records.quantity',
        'batches.farmId',
        'batches.currentQuantity',
      ])
      .where('mortality_records.id', '=', recordId)
      .executeTakeFirst()

    if (!existing) {
      throw new AppError('MORTALITY_RECORD_NOT_FOUND', {
        metadata: { resource: 'MortalityRecord', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await db.transaction().execute(async (trx) => {
      // Adjust batch quantity if mortality quantity changed
      if (
        input.quantity !== undefined &&
        input.quantity !== existing.quantity
      ) {
        const diff = existing.quantity - input.quantity
        const { sql } = await import('kysely')
        await trx
          .updateTable('batches')
          .set((eb) => ({
            currentQuantity: eb('currentQuantity', '+', diff),
            status: sql`CASE WHEN "currentQuantity" + ${diff} <= 0 THEN 'depleted' ELSE 'active' END`,
            updatedAt: new Date(),
          }))
          .where('id', '=', existing.batchId)
          .execute()
      }

      await trx
        .updateTable('mortality_records')
        .set({
          ...(input.quantity !== undefined && {
            quantity: input.quantity,
          }),
          ...(input.date !== undefined && { date: input.date }),
          ...(input.cause !== undefined && { cause: input.cause }),
          ...(input.notes !== undefined && { notes: input.notes }),
        })
        .where('id', '=', recordId)
        .execute()
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update mortality record',
      cause: error,
    })
  }
}

export const updateMortalityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateMortalityInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateMortalityRecord(session.user.id, data.recordId, data.data)
  })

/**
 * Delete a mortality record and restore the deceased quantity back to the batch
 *
 * @param userId - ID of the user
 * @param recordId - ID of the mortality record to delete
 * @throws {Error} If record not found, or access denied
 */
export async function deleteMortalityRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const existing = await db
      .selectFrom('mortality_records')
      .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
      .select([
        'mortality_records.id',
        'mortality_records.batchId',
        'mortality_records.quantity',
        'batches.farmId',
        'batches.currentQuantity',
      ])
      .where('mortality_records.id', '=', recordId)
      .executeTakeFirst()

    if (!existing) {
      throw new AppError('MORTALITY_RECORD_NOT_FOUND', {
        metadata: { resource: 'MortalityRecord', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await db.transaction().execute(async (trx) => {
      // Restore batch quantity atomically
      await trx
        .updateTable('batches')
        .set((eb) => ({
          currentQuantity: eb('currentQuantity', '+', existing.quantity),
          status: 'active',
          updatedAt: new Date(),
        }))
        .where('id', '=', existing.batchId)
        .execute()

      await trx
        .deleteFrom('mortality_records')
        .where('id', '=', recordId)
        .execute()
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete mortality record',
      cause: error,
    })
  }
}

export const deleteMortalityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recordId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteMortalityRecord(session.user.id, data.recordId)
  })

/**
 * Get comprehensive mortality data for a farm including records, alerts, summary, and batches
 */
export const getMortalityDataForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      cause?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const farmId = data.farmId || undefined

    const [paginatedRecords, alerts, summary, allBatches] = await Promise.all([
      getMortalityRecordsPaginated(session.user.id, {
        farmId,
        page: data.page,
        pageSize: data.pageSize,
        sortBy: data.sortBy,
        sortOrder: data.sortOrder,
        search: data.search,
        cause: data.cause,
      }),
      (async () => {
        const { getAllBatchAlertsFn } =
          await import('~/features/monitoring/server')
        return getAllBatchAlertsFn({ data: { farmId } }) as any
      })(),
      getMortalitySummary(session.user.id, farmId),
      (async () => {
        const { getBatchesFn } = await import('~/features/batches/server')
        return getBatchesFn({ data: { farmId } })
      })(),
    ])

    const batches = allBatches.filter((b) => b.status === 'active')

    return {
      paginatedRecords,
      alerts,
      summary,
      batches,
    }
  })

/**
 * Record a new mortality event
 */
export const recordMortalityActionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      quantity: number
      date: string
      cause: string
      notes?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()

    const id = await recordMortality(session.user.id, {
      batchId: data.batchId,
      quantity: data.quantity,
      date: new Date(data.date),
      cause: data.cause as CreateMortalityData['cause'],
      notes: data.notes,
    })
    return { success: true, id }
  })
