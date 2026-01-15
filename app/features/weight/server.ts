import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

export interface WeightRecord {
  id: string
  batchId: string
  batchSpecies: string | null
  date: Date
  sampleSize: number
  averageWeightKg: string
  minWeightKg: string | null
  maxWeightKg: string | null
  notes: string | null
}

export interface CreateWeightSampleInput {
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: number
  // Enhanced fields
  minWeightKg?: number | null
  maxWeightKg?: number | null
  notes?: string | null
}

export interface WeightQuery extends BasePaginatedQuery {
  batchId?: string
}

export async function createWeightSample(
  userId: string,
  farmId: string,
  input: CreateWeightSampleInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

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
}

export const createWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateWeightSampleInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createWeightSample(session.user.id, data.farmId, data.data)
  })

export async function getWeightSamplesForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  await verifyFarmAccess(userId, farmId)

  return db
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
}

export async function getWeightSamplesForFarm(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  let targetFarmIds: Array<string> = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  return db
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
}

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

export async function getGrowthAlerts(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

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
}

export async function getWeightRecordsPaginated(
  userId: string,
  query: WeightQuery = {},
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { sql } = await import('kysely')

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
}

export const getWeightRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: WeightQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getWeightRecordsPaginated(session.user.id, data)
  })

// Update weight sample input
export interface UpdateWeightSampleInput {
  date?: Date
  sampleSize?: number
  averageWeightKg?: number
  minWeightKg?: number | null
  maxWeightKg?: number | null
  notes?: string | null
}

/**
 * Update weight sample record
 */
export async function updateWeightSample(
  userId: string,
  recordId: string,
  input: UpdateWeightSampleInput,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  const existing = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.id', 'batches.farmId'])
    .where('weight_samples.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

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
}

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
 * Delete weight sample record
 */
export async function deleteWeightSample(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  const existing = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.id', 'batches.farmId'])
    .where('weight_samples.id', '=', recordId)
    .executeTakeFirst()

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.deleteFrom('weight_samples').where('id', '=', recordId).execute()
}

export const deleteWeightSampleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteWeightSample(session.user.id, data.recordId)
  })
