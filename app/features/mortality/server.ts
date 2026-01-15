import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

export interface MortalityRecord {
  id: string
  batchId: string
  batchSpecies: string | null
  quantity: number
  date: Date
  cause: string
  notes: string | null
}

export interface CreateMortalityData {
  batchId: string
  quantity: number
  date: Date
  cause: 'disease' | 'predator' | 'weather' | 'unknown' | 'other'
  notes?: string
}

export interface MortalityQuery extends BasePaginatedQuery {
  batchId?: string
}

/**
 * Record mortality and update batch quantity
 */
export async function recordMortality(
  userId: string,
  data: CreateMortalityData,
): Promise<string> {
  const { db } = await import('~/lib/db')
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

  // Log audit (outside transaction)
  const { logAudit } = await import('~/features/logging/audit')
  await logAudit({
    userId,
    action: 'create',
    entityType: 'mortality',
    entityId: recordId,
    details: data,
  })

  return recordId
}

// Server function for client-side calls
export const recordMortalityFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; data: CreateMortalityData }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return recordMortality(session.user.id, data.data)
  })

/**
 * Get mortality records for a batch
 */
export async function getMortalityRecords(userId: string, batchId: string) {
  const { db } = await import('~/lib/db')
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
  const { db } = await import('~/lib/db')
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
  const { db } = await import('~/lib/db')
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

export async function getMortalityRecordsPaginated(
  userId: string,
  query: MortalityQuery = {},
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
  .inputValidator((data: MortalityQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getMortalityRecordsPaginated(session.user.id, data)
  })

export async function getMortalitySummary(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

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
  const { getAllBatchAlerts } = await import('~/features/monitoring/alerts')
  const alerts = await getAllBatchAlerts(userId, farmId)
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
}

// Update mortality input
export interface UpdateMortalityInput {
  quantity?: number
  date?: Date
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
  notes?: string | null
}

/**
 * Update mortality record - adjusts batch quantity if quantity changed
 */
export async function updateMortalityRecord(
  userId: string,
  recordId: string,
  input: UpdateMortalityInput,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

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

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.transaction().execute(async (trx) => {
    // Adjust batch quantity if mortality quantity changed
    if (input.quantity !== undefined && input.quantity !== existing.quantity) {
      const diff = existing.quantity - input.quantity
      const newBatchQty = existing.currentQuantity + diff

      if (newBatchQty < 0)
        throw new Error('Cannot increase mortality beyond batch quantity')

      await trx
        .updateTable('batches')
        .set({
          currentQuantity: newBatchQty,
          status: newBatchQty <= 0 ? 'depleted' : 'active',
        })
        .where('id', '=', existing.batchId)
        .execute()
    }

    await trx
      .updateTable('mortality_records')
      .set({
        ...(input.quantity !== undefined && { quantity: input.quantity }),
        ...(input.date !== undefined && { date: input.date }),
        ...(input.cause !== undefined && { cause: input.cause }),
        ...(input.notes !== undefined && { notes: input.notes }),
      })
      .where('id', '=', recordId)
      .execute()
  })
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
 * Delete mortality record - restores batch quantity
 */
export async function deleteMortalityRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

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

  if (!existing) throw new Error('Record not found')

  const hasAccess = await checkFarmAccess(userId, existing.farmId)
  if (!hasAccess) throw new Error('Access denied')

  await db.transaction().execute(async (trx) => {
    // Restore batch quantity
    await trx
      .updateTable('batches')
      .set({
        currentQuantity: existing.currentQuantity + existing.quantity,
        status: 'active',
      })
      .where('id', '=', existing.batchId)
      .execute()

    await trx
      .deleteFrom('mortality_records')
      .where('id', '=', recordId)
      .execute()
  })
}

export const deleteMortalityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteMortalityRecord(session.user.id, data.recordId)
  })
