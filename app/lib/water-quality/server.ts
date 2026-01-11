import { createServerFn } from '@tanstack/react-start'
import { WATER_QUALITY_THRESHOLDS } from './constants'

// Re-export constants for backward compatibility
export { WATER_QUALITY_THRESHOLDS } from './constants'

export interface CreateWaterQualityInput {
  batchId: string
  date: Date
  ph: number
  temperatureCelsius: number
  dissolvedOxygenMgL: number
  ammoniaMgL: number
  notes?: string | null
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
  data: Array<T>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

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

export async function createWaterQualityRecord(
  userId: string,
  farmId: string,
  input: CreateWaterQualityInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  // Verify batch belongs to farm and is a fish batch
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId', 'livestockType'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  if (batch.livestockType !== 'fish') {
    throw new Error(
      'Water quality records can only be created for fish batches',
    )
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
}

export const createWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; data: CreateWaterQualityInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return createWaterQualityRecord(session.user.id, data.farmId, data.data)
  })

export async function getWaterQualityForFarm(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: Array<string> = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  return db
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
}

export async function getWaterQualityAlerts(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

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
}

export async function getWaterQualityRecordsPaginated(
  userId: string,
  query: PaginatedQuery = {},
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')
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
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', targetFarmIds)
    .where('batches.livestockType', '=', 'fish')

  if (query.search) {
    const searchLower = `%${query.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) => eb.or([
      eb('batches.species', 'ilike', searchLower),
    ]))
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
    // @ts-ignore
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
    totalPages
  }
}

export const getWaterQualityRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getWaterQualityRecordsPaginated(session.user.id, data)
  })
