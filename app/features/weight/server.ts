import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
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
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')
  const { getBatchForWeightRecord, insertWeightSample } =
    await import('./repository')

  await verifyFarmAccess(userId, farmId)

  // Verify batch belongs to farm
  const batch = await getBatchForWeightRecord(db, input.batchId, farmId)

  if (!batch) {
    throw new AppError('BATCH_NOT_FOUND', {
      metadata: { batchId: input.batchId, farmId },
    })
  }

  const recordId = await insertWeightSample(db, {
    batchId: input.batchId,
    date: input.date,
    sampleSize: input.sampleSize,
    averageWeightKg: input.averageWeightKg.toString(),
    minWeightKg: input.minWeightKg?.toString() ?? null,
    maxWeightKg: input.maxWeightKg?.toString() ?? null,
    notes: input.notes || null,
  })

  return recordId
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
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { getWeightSamplesByBatch } = await import('./repository')

  await verifyFarmAccess(userId, farmId)

  return getWeightSamplesByBatch(db, batchId)
}

/**
 * Retrieve all weight samples across a farm or for all farms assigned to a user.
 *
 * @param userId - ID of the user
 * @param farmId - Optional ID of a specific farm to filter by
 * @returns Promise resolving to an array of weight records with batch and farm details
 */
export async function getWeightSamplesForFarm(userId: string, farmId?: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { getWeightSamplesByFarm } = await import('./repository')

  let targetFarmIds: Array<string> = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  // For single farm, use the direct query
  if (targetFarmIds.length === 1) {
    return getWeightSamplesByFarm(db, targetFarmIds[0])
  }

  // For multiple farms, aggregate results
  const allRecords = await Promise.all(
    targetFarmIds.map((id) => getWeightSamplesByFarm(db, id)),
  )

  return allRecords.flat()
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
}

/**
 * Generate alerts for batches with growth rates significantly below expectations.
 *
 * @param userId - ID of the user
 * @param farmId - Optional ID of a specific farm
 * @returns Promise resolving to an array of growth alerts
 */
export async function getGrowthAlerts(userId: string, farmId?: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { getActiveBatchesForAlerts } = await import('./repository')

  let targetFarmIds: Array<string> = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  // Get all active batches with weight samples
  const batches = await getActiveBatchesForAlerts(db, targetFarmIds)

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
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getUserFarms } = await import('~/features/auth/utils')
  const { getWeightSamplesPaginated } = await import('./repository')

  let targetFarmIds: Array<string> = []
  if (query.farmId) {
    targetFarmIds = [query.farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
  }

  if (targetFarmIds.length === 0) {
    return {
      data: [],
      total: 0,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      totalPages: 0,
    }
  }

  return getWeightSamplesPaginated(db, targetFarmIds, query)
}

/**
 * Server function to retrieve paginated weight records.
 */
export const getWeightRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
      farmId: z.string().uuid().optional(),
      batchId: z.string().uuid().optional(),
    }),
  )
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
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')
  const { AppError } = await import('~/lib/errors')
  const { getWeightSampleById, updateWeightSample: updateRepo } =
    await import('./repository')

  const existing = await getWeightSampleById(db, recordId)

  if (!existing) {
    throw new AppError('WEIGHT_SAMPLE_NOT_FOUND', {
      metadata: { resource: 'WeightSample', id: recordId },
    })
  }

  if (existing.farmId === undefined) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: '' },
    })
  }

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: existing.farmId },
    })
  }

  // Build update object with converted values
  const updateData: Parameters<typeof updateRepo>[2] = {}

  if (input.date !== undefined) updateData.date = input.date
  if (input.sampleSize !== undefined) updateData.sampleSize = input.sampleSize
  if (input.averageWeightKg !== undefined) {
    updateData.averageWeightKg = input.averageWeightKg.toString()
  }
  if (input.minWeightKg !== undefined) {
    updateData.minWeightKg = input.minWeightKg?.toString() ?? null
  }
  if (input.maxWeightKg !== undefined) {
    updateData.maxWeightKg = input.maxWeightKg?.toString() ?? null
  }
  if (input.notes !== undefined) updateData.notes = input.notes

  await updateRepo(db, recordId, updateData)
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
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { checkFarmAccess } = await import('../auth/utils')
  const { AppError } = await import('~/lib/errors')
  const { getWeightSampleById, deleteWeightSample: deleteRepo } =
    await import('./repository')

  const existing = await getWeightSampleById(db, recordId)

  if (!existing) {
    throw new AppError('WEIGHT_SAMPLE_NOT_FOUND', {
      metadata: { resource: 'WeightSample', id: recordId },
    })
  }

  if (existing.farmId === undefined) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: '' },
    })
  }

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: existing.farmId },
    })
  }

  await deleteRepo(db, recordId)
}

/**
 * Server function to delete a weight record.
 */
export const deleteWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recordId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteWeightSample(session.user.id, data.recordId)
  })

/**
 * Get comprehensive weight data for a farm including records, alerts, and batches
 */
export const getWeightDataForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const farmId = data.farmId || undefined

    const [paginatedRecords, alerts, allBatches] = await Promise.all([
      getWeightRecordsPaginatedFn({
        data: {
          farmId,
          page: data.page,
          pageSize: data.pageSize,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          search: data.search,
        },
      }),
      getGrowthAlerts(session.user.id, farmId),
      (async () => {
        const { getBatches } = await import('~/features/batches/server')
        return getBatches(session.user.id, farmId)
      })(),
    ])

    const batches = allBatches.filter((b) => b.status === 'active')

    return {
      paginatedRecords,
      alerts,
      batches,
    }
  })
