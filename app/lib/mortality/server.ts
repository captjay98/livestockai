import { createServerFn } from '@tanstack/react-start'

export interface CreateMortalityData {
  batchId: string
  quantity: number
  date: Date
  cause: 'disease' | 'predator' | 'weather' | 'unknown' | 'other'
  notes?: string
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

/**
 * Record mortality and update batch quantity
 */
export async function recordMortality(
  userId: string,
  data: CreateMortalityData,
): Promise<string> {
  const { db } = await import('../db')
  const { getBatchById } = await import('../batches/server')

  // Verify batch access
  const batch = await getBatchById(userId, data.batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
  }

  // Check if mortality quantity is valid
  if (data.quantity <= 0) {
    throw new Error('Mortality quantity must be greater than 0')
  }

  if (data.quantity > batch.currentQuantity) {
    throw new Error('Mortality quantity cannot exceed current batch quantity')
  }

  // Start transaction
  return await db.transaction().execute(async (trx) => {
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

    // Update batch quantity
    const newQuantity = batch.currentQuantity - data.quantity
    await trx
      .updateTable('batches')
      .set({
        currentQuantity: newQuantity,
        status: newQuantity <= 0 ? 'depleted' : 'active',
      })
      .where('id', '=', data.batchId)
      .execute()

    return result.id
  })
}

// Server function for client-side calls
export const recordMortalityFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; data: CreateMortalityData }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return recordMortality(session.user.id, data.data)
  })


/**
 * Get mortality records for a batch
 */
export async function getMortalityRecords(userId: string, batchId: string) {
  const { db } = await import('../db')
  const { getBatchById } = await import('../batches/server')

  // Verify batch access
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
  }

  return await db
    .selectFrom('mortality_records')
    .selectAll()
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .execute()
}

/**
 * Get mortality statistics for a batch
 */
export async function getMortalityStats(userId: string, batchId: string) {
  const { db } = await import('../db')
  const { getBatchById } = await import('../batches/server')

  // Verify batch access
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
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
        totalMortality > 0 ? (Number(stat.quantity) / totalMortality) * 100 : 0,
    })),
    batch: {
      initialQuantity: batch.initialQuantity,
      currentQuantity: batch.currentQuantity,
      remaining: batch.currentQuantity,
      lost: totalMortality,
    },
  }
}

/**
 * Get mortality trends for a batch (daily/weekly/monthly)
 */
export async function getMortalityTrends(
  userId: string,
  batchId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30,
) {
  const { db } = await import('../db')
  const { getBatchById } = await import('../batches/server')

  // Verify batch access
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found or access denied')
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
}

/**
 * Get mortality alerts for a farm or all farms
 */
export async function getMortalityAlerts(userId: string, farmId?: string) {
  const { db } = await import('../db')
  const { getUserFarms } = await import('../auth/utils')

  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) {
      return []
    }
  }

  // Get all active batches for the target farms
  const batches = await db
    .selectFrom('batches')
    .selectAll()
    .where('farmId', 'in', targetFarmIds)
    .where('status', '=', 'active')
    .execute()

  const alerts = []

  for (const batch of batches) {
    // Check total mortality (all-time) - matches Dashboard logic
    const totalMortality = await db
      .selectFrom('mortality_records')
      .select([db.fn.sum('quantity').as('quantity')])
      .where('batchId', '=', batch.id)
      .executeTakeFirst()

    const totalQuantity = Number(totalMortality?.quantity || 0)
    const mortalityRate =
      batch.initialQuantity > 0
        ? (totalQuantity / batch.initialQuantity) * 100
        : 0

    // Alert if total mortality rate > 5%
    if (mortalityRate > 5) {
      alerts.push({
        type: 'high_mortality' as const,
        batchId: batch.id,
        batchSpecies: batch.species,
        severity:
          mortalityRate > 10 ? ('critical' as const) : ('warning' as const),
        message: `High mortality rate (${mortalityRate.toFixed(1)}%)`,
        quantity: totalQuantity,
        rate: mortalityRate,
      })
    }

    // Alert if batch is nearly depleted (< 10% remaining)
    const remainingPercentage =
      batch.initialQuantity > 0
        ? (batch.currentQuantity / batch.initialQuantity) * 100
        : 0

    if (remainingPercentage < 10 && remainingPercentage > 0) {
      alerts.push({
        type: 'low_stock' as const,
        batchId: batch.id,
        batchSpecies: batch.species,
        severity:
          remainingPercentage < 5
            ? ('critical' as const)
            : ('warning' as const),
        message: `Low stock: ${remainingPercentage.toFixed(1)}% remaining`,
        quantity: batch.currentQuantity,
        rate: remainingPercentage,
      })
    }
  }

  return alerts.sort((a, b) => {
    // Sort by severity (critical first) then by rate (highest first)
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1
    }
    return b.rate - a.rate
  })
}

export async function getMortalityRecordsPaginated(
  userId: string,
  query: PaginatedQuery = {},
) {
  const { db } = await import('../db')
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
    .selectFrom('mortality_records')
    .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', targetFarmIds)

  // Apply filters
  if (query.search) {
    const searchLower = `%${query.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('mortality_records.cause', 'ilike', searchLower),
        eb('mortality_records.notes', 'ilike', searchLower),
        eb('batches.species', 'ilike', searchLower),
      ]),
    )
  }

  if (query.batchId) {
    baseQuery = baseQuery.where('mortality_records.batchId', '=', query.batchId)
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

  // Apply sorting
  if (query.sortBy) {
    const sortOrder = query.sortOrder || 'desc'
    let sortColumn = `mortality_records.${query.sortBy}`
    if (query.sortBy === 'species') sortColumn = 'batches.species'
    if (query.sortBy === 'date') sortColumn = 'mortality_records.date'
    if (query.sortBy === 'cause') sortColumn = 'mortality_records.cause'

    // @ts-ignore - Kysely dynamic column type limitation
    dataQuery = dataQuery.orderBy(sortColumn, sortOrder)
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
}

// Server function for paginated mortality records
export const getMortalityRecordsPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getMortalityRecordsPaginated(session.user.id, data)
  })

export async function getMortalitySummary(userId: string, farmId?: string) {
  const { db } = await import('../db')
  const { getUserFarms } = await import('~/lib/auth/utils')

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
  // We already have getMortalityAlerts which is efficient enough
  const alerts = await getMortalityAlerts(userId, farmId)
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const totalAlerts = alerts.length

  return {
    totalDeaths,
    recordCount: records.length,
    criticalAlerts,
    totalAlerts
  }
}
