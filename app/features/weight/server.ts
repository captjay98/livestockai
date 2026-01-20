import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

/**
 * Represents a historical weight measurement record for a livestock batch.
 */
export interface WeightRecord {
  /** Unique identifier for the weight record */
  id: string
  /** ID of the associated livestock batch */
  batchId: string
  /** Optional species name for the batch */
  batchSpecies: string | null
  /** Date the weight sample was taken */
  date: Date
  /** Number of animals measured in this sample */
  sampleSize: number
  /** Calculated average weight in kilograms */
  averageWeightKg: string
  /** Minimum weight measured in the sample (optional) */
  minWeightKg: string | null
  /** Maximum weight measured in the sample (optional) */
  maxWeightKg: string | null
  /** Optional notes or observations about the sample */
  notes: string | null
}

/**
 * Input data required to create a new weight measurement record.
 */
export interface CreateWeightSampleInput {
  /** ID of the batch being measured */
  batchId: string
  /** Date of the measurement */
  date: Date
  /** Number of animals included in the sample */
  sampleSize: number
  /** Average weight of the animals in kilograms */
  averageWeightKg: number
  /** Smallest individual weight recorded in the sample */
  minWeightKg?: number | null
  /** Largest individual weight recorded in the sample */
  maxWeightKg?: number | null
  /** Optional descriptive notes */
  notes?: string | null
}

/**
 * Filter and pagination parameters for querying weight records.
 */
export interface WeightQuery extends BasePaginatedQuery {
  /** Filter records by a specific batch ID */
  batchId?: string
}

/**
 * Create a new weight measurement record for a batch.
 *
 * @param userId - ID of the user performing the action
 * @param farmId - ID of the farm the batch belongs to
 * @param input - Weight measurement details
 * @returns Promise resolving to the new record's ID
 * @throws {Error} If farm access is denied or batch not found
 */
export async function createWeightSample(
  userId: string,
  farmId: string,
  input: CreateWeightSampleInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

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

    const result = await db
      .insertInto('weight_samples')
      .values({
        batchId: input.batchId,
        date: input.date,
        sampleSize: input.sampleSize,
        averageWeightKg: input.averageWeightKg.toString(),
        minWeightKg: input.minWeightKg?.toString() || null,
        maxWeightKg: input.maxWeightKg?.toString() || null,
        notes: input.notes || null,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    return result.id
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create weight sample',
      cause: error,
    })
  }
}

/**
 * Server function to create a weight sample.
 * Validates input and user authentication.
 */
export const createWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateWeightSampleInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createWeightSample(session.user.id, data.farmId, data.data)
  })

/**
 * Retrieve all weight samples for a specific livestock batch.
 *
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param batchId - ID of the batch
 * @returns Promise resolving to an array of weight records
 */
export async function getWeightSamplesForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, farmId)

    return await db
      .selectFrom('weight_samples')
      .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
      .select([
        'weight_samples.id',
        'weight_samples.batchId',
        'weight_samples.date',
        'weight_samples.sampleSize',
        'weight_samples.averageWeightKg',
        'weight_samples.minWeightKg',
        'weight_samples.maxWeightKg',
        'weight_samples.notes',
        'weight_samples.createdAt',
      ])
      .where('weight_samples.batchId', '=', batchId)
      .where('batches.farmId', '=', farmId)
      .orderBy('weight_samples.date', 'asc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch weight samples',
      cause: error,
    })
  }
}

/**
 * Retrieve all weight samples across a farm or for all farms assigned to a user.
 *
 * @param userId - ID of the user
 * @param farmId - Optional ID of a specific farm to filter by
 * @returns Promise resolving to an array of weight records with batch and farm details
 */
export async function getWeightSamplesForFarm(userId: string, farmId?: string) {
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
      .selectFrom('weight_samples')
      .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .select([
        'weight_samples.id',
        'weight_samples.batchId',
        'weight_samples.date',
        'weight_samples.sampleSize',
        'weight_samples.averageWeightKg',
        'weight_samples.minWeightKg',
        'weight_samples.maxWeightKg',
        'weight_samples.notes',
        'weight_samples.createdAt',
        'batches.species',
        'batches.livestockType',
        'farms.name as farmName',
      ])
      .where('batches.farmId', 'in', targetFarmIds)
      .orderBy('weight_samples.date', 'desc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch weight samples for farm',
      cause: error,
    })
  }
}

/**
 * Calculate the Average Daily Gain (ADG) for a specific livestock batch.
 * Calculates growth rate based on the first and last recorded weight samples.
 *
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param batchId - ID of the batch
 * @returns Promise resolving to an ADG summary or null if insufficient data
 */
export async function calculateADG(
  userId: string,
  farmId: string,
  batchId: string,
): Promise<{ adg: number; daysBetween: number; weightGain: number } | null> {
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, farmId)

    const samples = await getWeightSamplesForBatch(userId, farmId, batchId)

    if (samples.length < 2) {
      return null
    }

    const firstSample = samples[0]
    const lastSample = samples[samples.length - 1]

    const firstWeight = parseFloat(firstSample.averageWeightKg)
    const lastWeight = parseFloat(lastSample.averageWeightKg)
    const weightGain = lastWeight - firstWeight

    const firstDate = new Date(firstSample.date)
    const lastDate = new Date(lastSample.date)
    const daysBetween = Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysBetween <= 0) {
      return null
    }

    const adg = weightGain / daysBetween

    return {
      adg: Math.round(adg * 1000) / 1000, // Round to 3 decimal places (grams)
      daysBetween,
      weightGain: Math.round(weightGain * 1000) / 1000,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to calculate ADG',
      cause: error,
    })
  }
}

/**
 * Generate alerts for batches with growth rates significantly below expectations.
 *
 * @param userId - ID of the user
 * @param farmId - Optional ID of a specific farm
 * @returns Promise resolving to an array of growth alerts
 */
export async function getGrowthAlerts(userId: string, farmId?: string) {
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

    // Get all active batches with weight samples
    const batches = await db
      .selectFrom('batches')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .select([
        'batches.id',
        'batches.species',
        'batches.livestockType',
        'batches.acquisitionDate',
        'batches.farmId',
        'farms.name as farmName',
      ])
      .where('batches.farmId', 'in', targetFarmIds)
      .where('status', '=', 'active')
      .execute()

    const alerts: Array<{
      batchId: string
      species: string
      message: string
      severity: 'warning' | 'critical'
      adg: number
      expectedAdg: number
      farmName?: string
    }> = []

    // Expected ADG targets (kg/day)
    const expectedADG: Record<string, number> = {
      broiler: 0.05, // 50g/day
      layer: 0.02, // 20g/day
      catfish: 0.015, // 15g/day
      tilapia: 0.01, // 10g/day
    }

    for (const batch of batches) {
      const adgResult = await calculateADG(userId, batch.farmId, batch.id)
      if (!adgResult) continue

      const expected = expectedADG[batch.species.toLowerCase()] || 0.03
      const percentOfExpected = (adgResult.adg / expected) * 100

      if (percentOfExpected < 70) {
        alerts.push({
          batchId: batch.id,
          species: batch.species,
          message: `Growth rate is ${percentOfExpected.toFixed(0)}% of expected (${(adgResult.adg * 1000).toFixed(0)}g/day vs ${(expected * 1000).toFixed(0)}g/day expected)`,
          severity: percentOfExpected < 50 ? 'critical' : 'warning',
          adg: adgResult.adg,
          expectedAdg: expected,
          farmName: batch.farmName || undefined,
        })
      }
    }

    return alerts
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to generate growth alerts',
      cause: error,
    })
  }
}

/**
 * Retrieve a paginated list of weight records for a user's farms.
 *
 * @param userId - ID of the user
 * @param query - Query parameters (search, pagination, sorting)
 * @returns Promise resolving to a paginated set of weight records
 */
export async function getWeightRecordsPaginated(
  userId: string,
  query: WeightQuery = {},
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
      .selectFrom('weight_samples')
      .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
      .innerJoin('farms', 'farms.id', 'batches.farmId')
      .where('batches.farmId', 'in', targetFarmIds)

    if (query.search) {
      const searchLower = `%${query.search.toLowerCase()}%`
      baseQuery = baseQuery.where((eb) =>
        eb.or([eb('batches.species', 'ilike', searchLower)]),
      )
    }

    if (query.batchId) {
      baseQuery = baseQuery.where('weight_samples.batchId', '=', query.batchId)
    }

    // Get total
    const countResult = await baseQuery
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst()

    const total = Number(countResult?.count || 0)
    const totalPages = Math.ceil(total / pageSize)

    // Get Data
    let dataQuery = baseQuery
      .select([
        'weight_samples.id',
        'weight_samples.batchId',
        'weight_samples.date',
        'weight_samples.sampleSize',
        'weight_samples.averageWeightKg',
        'weight_samples.minWeightKg',
        'weight_samples.maxWeightKg',
        'weight_samples.notes',
        'weight_samples.createdAt',
        'batches.species',
        'batches.livestockType',
        'farms.name as farmName',
        'batches.farmId',
      ])
      .limit(pageSize)
      .offset(offset)

    if (query.sortBy) {
      const sortOrder = query.sortOrder || 'desc'
      let sortCol = `weight_samples.${query.sortBy}`
      if (query.sortBy === 'species') sortCol = 'batches.species'
      // @ts-ignore - Kysely dynamic column type limitation
      dataQuery = dataQuery.orderBy(sortCol, sortOrder)
    } else {
      dataQuery = dataQuery.orderBy('weight_samples.date', 'desc')
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
      message: 'Failed to fetch paginated weight records',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated weight records.
 */
export const getWeightRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: WeightQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getWeightRecordsPaginated(session.user.id, data)
  })

// Update weight sample input
/**
 * Data available for updating a weight record.
 */
export interface UpdateWeightSampleInput {
  /** Updated date */
  date?: Date
  /** Updated sample size */
  sampleSize?: number
  /** Updated average weight in kilograms */
  averageWeightKg?: number
  /** Updated minimum weight */
  minWeightKg?: number | null
  /** Updated maximum weight */
  maxWeightKg?: number | null
  /** Updated optional notes */
  notes?: string | null
}

/**
 * Update an existing weight measurement record.
 *
 * @param userId - ID of the user
 * @param recordId - ID of the record to update
 * @param input - Updated measurement details
 * @throws {Error} If record not found or access denied
 */
export async function updateWeightSample(
  userId: string,
  recordId: string,
  input: UpdateWeightSampleInput,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const existing = await db
      .selectFrom('weight_samples')
      .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
      .select(['weight_samples.id', 'batches.farmId'])
      .where('weight_samples.id', '=', recordId)
      .executeTakeFirst()

    if (!existing) {
      throw new AppError('WEIGHT_SAMPLE_NOT_FOUND', {
        metadata: { resource: 'WeightSample', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await db
      .updateTable('weight_samples')
      .set({
        ...(input.date !== undefined && { date: input.date }),
        ...(input.sampleSize !== undefined && { sampleSize: input.sampleSize }),
        ...(input.averageWeightKg !== undefined && {
          averageWeightKg: input.averageWeightKg.toString(),
        }),
        ...(input.minWeightKg !== undefined && {
          minWeightKg: input.minWeightKg?.toString() ?? null,
        }),
        ...(input.maxWeightKg !== undefined && {
          maxWeightKg: input.maxWeightKg?.toString() ?? null,
        }),
        ...(input.notes !== undefined && { notes: input.notes }),
      })
      .where('id', '=', recordId)
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update weight sample',
      cause: error,
    })
  }
}

/**
 * Server function to update a weight record.
 */
export const updateWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateWeightSampleInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateWeightSample(session.user.id, data.recordId, data.data)
  })

/**
 * Permanently delete a weight measurement record.
 *
 * @param userId - ID of the user
 * @param recordId - ID of the record to delete
 * @throws {Error} If record not found or access denied
 */
export async function deleteWeightSample(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const existing = await db
      .selectFrom('weight_samples')
      .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
      .select(['weight_samples.id', 'batches.farmId'])
      .where('weight_samples.id', '=', recordId)
      .executeTakeFirst()

    if (!existing) {
      throw new AppError('WEIGHT_SAMPLE_NOT_FOUND', {
        metadata: { resource: 'WeightSample', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, existing.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: existing.farmId },
      })
    }

    await db.deleteFrom('weight_samples').where('id', '=', recordId).execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete weight sample',
      cause: error,
    })
  }
}

/**
 * Server function to delete a weight record.
 */
export const deleteWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteWeightSample(session.user.id, data.recordId)
  })
