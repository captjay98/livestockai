import { createServerFn } from '@tanstack/react-start'
import { WATER_QUALITY_THRESHOLDS } from './constants'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

/**
 * Represents a single water quality measurement record.
 * Primarily used for aquaculture (fish) monitoring.
 */
export interface WaterQualityRecord {
  /** Unique identifier for the measurement */
  id: string
  /** ID of the livestock batch being monitored */
  batchId: string
  /** Display name of the batch species */
  batchSpecies: string | null
  /** Date and time of the measurement */
  date: Date
  /** pH level (0-14) */
  ph: string
  /** Temperature in degrees Celsius */
  temperatureCelsius: string
  /** Dissolved Oxygen concentration in mg/L */
  dissolvedOxygenMgL: string
  /** Ammonia concentration in mg/L */
  ammoniaMgL: string
  /** Optional observer notes */
  notes: string | null
}

// Re-export constants for backward compatibility
export { WATER_QUALITY_THRESHOLDS } from './constants'

/**
 * Data structure for creating a new water quality record.
 */
export interface CreateWaterQualityInput {
  /** ID of the fish batch */
  batchId: string
  /** Measurement date */
  date: Date
  /** pH value */
  ph: number
  /** Temperature in Celsius */
  temperatureCelsius: number
  /** Dissolved Oxygen in mg/L */
  dissolvedOxygenMgL: number
  /** Ammonia in mg/L */
  ammoniaMgL: number
  /** Optional notes */
  notes?: string | null
}

/**
 * Filter parameters for paginated water quality queries.
 */
export interface WaterQualityQuery extends BasePaginatedQuery {
  /** Optional filter by specific batch */
  batchId?: string
}

/**
 * Evaluates whether a set of water parameters falls outside of acceptable thresholds.
 *
 * @param params - Object containing pH, temperature, DO, and ammonia levels
 * @returns True if any parameter is out of safe range
 */
export function isWaterQualityAlert(params: {
  ph: number
  temperatureCelsius: number
  dissolvedOxygenMgL: number
  ammoniaMgL: number
}): boolean {
  const { ph, temperatureCelsius, dissolvedOxygenMgL, ammoniaMgL } = params
  const t = WATER_QUALITY_THRESHOLDS

  return (
    ph < t.ph.min ||
    ph > t.ph.max ||
    temperatureCelsius < t.temperature.min ||
    temperatureCelsius > t.temperature.max ||
    dissolvedOxygenMgL < t.dissolvedOxygen.min ||
    ammoniaMgL > t.ammonia.max
  )
}

/**
 * Identifies specific issues in water quality measurements based on system thresholds.
 *
 * @param params - Object containing pH, temperature, DO, and ammonia levels
 * @returns Array of descriptive error messages for each threshold violation
 */
export function getWaterQualityIssues(params: {
  ph: number
  temperatureCelsius: number
  dissolvedOxygenMgL: number
  ammoniaMgL: number
}): Array<string> {
  const issues: Array<string> = []
  const t = WATER_QUALITY_THRESHOLDS

  if (params.ph < t.ph.min)
    issues.push(`pH too low (${params.ph}, min: ${t.ph.min})`)
  if (params.ph > t.ph.max)
    issues.push(`pH too high (${params.ph}, max: ${t.ph.max})`)
  if (params.temperatureCelsius < t.temperature.min)
    issues.push(
      `Temperature too low (${params.temperatureCelsius}°C, min: ${t.temperature.min}°C)`,
    )
  if (params.temperatureCelsius > t.temperature.max)
    issues.push(
      `Temperature too high (${params.temperatureCelsius}°C, max: ${t.temperature.max}°C)`,
    )
  if (params.dissolvedOxygenMgL < t.dissolvedOxygen.min)
    issues.push(
      `Dissolved oxygen too low (${params.dissolvedOxygenMgL}mg/L, min: ${t.dissolvedOxygen.min}mg/L)`,
    )
  if (params.ammoniaMgL > t.ammonia.max)
    issues.push(
      `Ammonia too high (${params.ammoniaMgL}mg/L, max: ${t.ammonia.max}mg/L)`,
    )

  return issues
}

/**
 * Saves a new water quality record to the database.
 * Verifies that the batch belongs to the farm and is of type 'fish'.
 *
 * @param userId - ID of the user performing the action
 * @param farmId - ID of the farm owning the batch
 * @param input - Water quality metrics
 * @returns Promise resolving to the new record ID
 * @throws {Error} If batch not found or is not a fish batch
 */
export async function createWaterQualityRecord(
  userId: string,
  farmId: string,
  input: CreateWaterQualityInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, farmId)

    // Verify batch belongs to farm and is a fish batch
    const batch = await db
      .selectFrom('batches')
      .select(['id', 'farmId', 'livestockType'])
      .where('id', '=', input.batchId)
      .where('farmId', '=', farmId)
      .executeTakeFirst()

    if (!batch) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId: input.batchId, farmId },
      })
    }

    if (batch.livestockType !== 'fish') {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Water quality records can only be created for fish batches',
      })
    }

    const result = await db
      .insertInto('water_quality')
      .values({
        batchId: input.batchId,
        date: input.date,
        ph: input.ph.toString(),
        temperatureCelsius: input.temperatureCelsius.toString(),
        dissolvedOxygenMgL: input.dissolvedOxygenMgL.toString(),
        ammoniaMgL: input.ammoniaMgL.toString(),
        notes: input.notes || null,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    return result.id
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create water quality record',
      cause: error,
    })
  }
}

/**
 * Server function to create a water quality record.
 */
export const createWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateWaterQualityInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createWaterQualityRecord(session.user.id, data.farmId, data.data)
  })

/**
 * Retrieves all water quality records for a specific farm or all accessible farms.
 *
 * @param userId - ID of the user requesting data
 * @param farmId - Optional farm filter
 * @returns Promise resolving to an array of water quality records with batch and farm info
 */
export async function getWaterQualityForFarm(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      await verifyFarmAccess(userId, farmId)
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    return await db
      .selectFrom('water_quality')
      .innerJoin('batches', 'batches.id', 'water_quality.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .select([
        'water_quality.id',
        'water_quality.batchId',
        'water_quality.date',
        'water_quality.ph',
        'water_quality.temperatureCelsius',
        'water_quality.dissolvedOxygenMgL',
        'water_quality.ammoniaMgL',
        'water_quality.notes',
        'water_quality.createdAt',
        'batches.species',
        'farms.name as farmName',
      ])
      .where('batches.farmId', 'in', targetFarmIds)
      .where('batches.livestockType', '=', 'fish')
      .orderBy('water_quality.date', 'desc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch water quality records',
      cause: error,
    })
  }
}

/**
 * Computes active alerts for all fish batches based on their most recent water quality readings.
 *
 * @param userId - ID of the user requesting alerts
 * @param farmId - Optional farm filter
 * @returns Promise resolving to an array of active alerts with issues and severity
 */
export async function getWaterQualityAlerts(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      await verifyFarmAccess(userId, farmId)
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    // Get the most recent water quality record for each active fish batch
    const records = await db
      .selectFrom('water_quality')
      .innerJoin('batches', 'batches.id', 'water_quality.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .select([
        'water_quality.id',
        'water_quality.batchId',
        'water_quality.date',
        'water_quality.ph',
        'water_quality.temperatureCelsius',
        'water_quality.dissolvedOxygenMgL',
        'water_quality.ammoniaMgL',
        'batches.species',
        'farms.name as farmName',
      ])
      .where('batches.farmId', 'in', targetFarmIds)
      .where('batches.livestockType', '=', 'fish')
      .where('batches.status', '=', 'active')
      .orderBy('water_quality.date', 'desc')
      .execute()

    // Group by batch and get the most recent for each
    const latestByBatch = new Map<string, (typeof records)[0]>()
    for (const record of records) {
      if (!latestByBatch.has(record.batchId)) {
        latestByBatch.set(record.batchId, record)
      }
    }

    const alerts: Array<{
      batchId: string
      species: string
      issues: Array<string>
      severity: 'warning' | 'critical'
      date: Date
      farmName?: string
    }> = []

    for (const record of latestByBatch.values()) {
      const params = {
        ph: parseFloat(record.ph),
        temperatureCelsius: parseFloat(record.temperatureCelsius),
        dissolvedOxygenMgL: parseFloat(record.dissolvedOxygenMgL),
        ammoniaMgL: parseFloat(record.ammoniaMgL),
      }

      if (isWaterQualityAlert(params)) {
        const issues = getWaterQualityIssues(params)
        alerts.push({
          batchId: record.batchId,
          species: record.species,
          issues,
          severity: issues.length > 2 ? 'critical' : 'warning',
          date: record.date,
          farmName: record.farmName || undefined,
        })
      }
    }

    return alerts
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch water quality alerts',
      cause: error,
    })
  }
}

/**
 * Retrieves a paginated list of water quality records with sorting and search.
 *
 * @param userId - ID of the user requesting data
 * @param query - Pagination, sorting, and filter parameters
 * @returns Promise resolving to a paginated set of measurements
 */
export async function getWaterQualityRecordsPaginated(
  userId: string,
  query: WaterQualityQuery = {},
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { sql } = await import('kysely')
  const { AppError } = await import('~/lib/errors')

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
      .selectFrom('water_quality')
      .innerJoin('batches', 'batches.id', 'water_quality.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .where('batches.farmId', 'in', targetFarmIds)
      .where('batches.livestockType', '=', 'fish')

    if (query.search) {
      const searchLower = `%${query.search.toLowerCase()}%`
      baseQuery = baseQuery.where((eb) =>
        eb.or([eb('batches.species', 'ilike', searchLower)]),
      )
    }

    if (query.batchId) {
      baseQuery = baseQuery.where('water_quality.batchId', '=', query.batchId)
    }

    const countResult = await baseQuery
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst()

    const total = Number(countResult?.count || 0)
    const totalPages = Math.ceil(total / pageSize)

    let dataQuery = baseQuery
      .select([
        'water_quality.id',
        'water_quality.batchId',
        'water_quality.date',
        'water_quality.ph',
        'water_quality.temperatureCelsius',
        'water_quality.dissolvedOxygenMgL',
        'water_quality.ammoniaMgL',
        'water_quality.notes',
        'water_quality.createdAt',
        'batches.species',
        'farms.name as farmName',
      ])
      .limit(pageSize)
      .offset(offset)

    if (query.sortBy) {
      const sortOrder = query.sortOrder || 'desc'
      let sortCol = `water_quality.${query.sortBy}`
      if (query.sortBy === 'species') sortCol = 'batches.species'
      // @ts-ignore - Kysely dynamic column type limitation
      dataQuery = dataQuery.orderBy(sortCol, sortOrder)
    } else {
      dataQuery = dataQuery.orderBy('water_quality.date', 'desc')
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
      message: 'Failed to fetch paginated water quality records',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated water quality records.
 */
export const getWaterQualityRecordsPaginatedFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: WaterQualityQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getWaterQualityRecordsPaginated(session.user.id, data)
  })

// Update water quality input
/**
 * Data structure for updating an existing water quality record.
 */
export interface UpdateWaterQualityInput {
  /** Updated measurement date */
  date?: Date
  /** Updated pH value */
  ph?: number
  /** Updated temperature in Celsius */
  temperatureCelsius?: number
  /** Updated Dissolved Oxygen in mg/L */
  dissolvedOxygenMgL?: number
  /** Updated Ammonia in mg/L */
  ammoniaMgL?: number
  /** Updated notes */
  notes?: string | null
}

/**
 * Update water quality record
 */
/**
 * Updates an existing water quality record.
 *
 * @param userId - ID of the user performing the update
 * @param recordId - ID of the record to update
 * @param input - Partial update parameters
 * @returns Promise resolving when update is complete
 * @throws {Error} If record not found or user unauthorized
 */
export async function updateWaterQualityRecord(
  userId: string,
  recordId: string,
  input: UpdateWaterQualityInput,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const existing = await db
      .selectFrom('water_quality')
      .innerJoin('batches', 'batches.id', 'water_quality.batchId')
      .select(['water_quality.id', 'batches.farmId'])
      .where('water_quality.id', '=', recordId)
      .executeTakeFirst()

    if (!existing) {
      throw new AppError('WATER_QUALITY_NOT_FOUND', {
        metadata: { resource: 'WaterQualityRecord', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await db
      .updateTable('water_quality')
      .set({
        ...(input.date !== undefined && { date: input.date }),
        ...(input.ph !== undefined && { ph: input.ph.toString() }),
        ...(input.temperatureCelsius !== undefined && {
          temperatureCelsius: input.temperatureCelsius.toString(),
        }),
        ...(input.dissolvedOxygenMgL !== undefined && {
          dissolvedOxygenMgL: input.dissolvedOxygenMgL.toString(),
        }),
        ...(input.ammoniaMgL !== undefined && {
          ammoniaMgL: input.ammoniaMgL.toString(),
        }),
        ...(input.notes !== undefined && { notes: input.notes }),
      })
      .where('id', '=', recordId)
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update water quality record',
      cause: error,
    })
  }
}

/**
 * Server function to update a water quality record.
 */
export const updateWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateWaterQualityInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateWaterQualityRecord(session.user.id, data.recordId, data.data)
  })

/**
 * Delete water quality record
 */
/**
 * Deletes a water quality record from the database.
 *
 * @param userId - ID of the user requesting deletion
 * @param recordId - ID of the record to delete
 * @returns Promise resolving when deletion is complete
 * @throws {Error} If record not found or user unauthorized
 */
export async function deleteWaterQualityRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const existing = await db
      .selectFrom('water_quality')
      .innerJoin('batches', 'batches.id', 'water_quality.batchId')
      .select(['water_quality.id', 'batches.farmId'])
      .where('water_quality.id', '=', recordId)
      .executeTakeFirst()

    if (!existing) {
      throw new AppError('WATER_QUALITY_NOT_FOUND', {
        metadata: { resource: 'WaterQualityRecord', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await db.deleteFrom('water_quality').where('id', '=', recordId).execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete water quality record',
      cause: error,
    })
  }
}

/**
 * Server function to delete a water quality record.
 */
export const deleteWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteWaterQualityRecord(session.user.id, data.recordId)
  })
