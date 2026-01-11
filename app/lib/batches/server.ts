import { createServerFn } from '@tanstack/react-start'
import { multiply, toDbString, toNumber } from '../currency'
import { MODULE_METADATA } from '../modules/constants'
import type { LivestockType } from '../modules/types'

/**
 * Get source size options for a livestock type
 */
export function getSourceSizeOptions(
  livestockType: LivestockType,
): Array<{ value: string; label: string }> {
  // Find the module that handles this livestock type
  const moduleEntry = Object.entries(MODULE_METADATA).find(([_, metadata]) =>
    metadata.livestockTypes.includes(livestockType)
  )

  if (!moduleEntry) {
    return []
  }

  return moduleEntry[1].sourceSizeOptions
}

// Legacy SOURCE_SIZE_OPTIONS for backward compatibility
export const SOURCE_SIZE_OPTIONS = {
  poultry: getSourceSizeOptions('poultry'),
  fish: getSourceSizeOptions('fish'),
  cattle: getSourceSizeOptions('cattle'),
  goats: getSourceSizeOptions('goats'),
  sheep: getSourceSizeOptions('sheep'),
  bees: getSourceSizeOptions('bees'),
}

export interface CreateBatchData {
  farmId: string
  livestockType: LivestockType
  species: string
  initialQuantity: number
  acquisitionDate: Date
  costPerUnit: number // in Naira
  // Enhanced fields
  batchName?: string | null
  sourceSize?: string | null
  structureId?: string | null
  targetHarvestDate?: Date | null
  target_weight_g?: number | null // Enhanced
  supplierId?: string | null
  notes?: string | null
}

export interface UpdateBatchData {
  species?: string
  status?: 'active' | 'depleted' | 'sold'
  batchName?: string | null
  sourceSize?: string | null
  structureId?: string | null
  targetHarvestDate?: Date | null
  target_weight_g?: number | null // Enhanced
  notes?: string | null
}

/**
 * Create a new batch
 */
export async function createBatch(
  userId: string,
  data: CreateBatchData,
): Promise<string> {
  const { db } = await import('../db')
  const { checkFarmAccess } = await import('../auth/utils')

  // Check farm access
  const hasAccess = await checkFarmAccess(userId, data.farmId)
  if (!hasAccess) {
    throw new Error('Access denied to this farm')
  }

  const totalCost = multiply(data.initialQuantity, data.costPerUnit)

  const result = await db
    .insertInto('batches')
    .values({
      farmId: data.farmId,
      livestockType: data.livestockType,
      species: data.species,
      initialQuantity: data.initialQuantity,
      currentQuantity: data.initialQuantity,
      acquisitionDate: data.acquisitionDate,
      costPerUnit: toDbString(data.costPerUnit),
      totalCost: toDbString(totalCost),
      status: 'active',
      // Enhanced fields
      batchName: data.batchName || null,
      sourceSize: data.sourceSize || null,
      structureId: data.structureId || null,
      targetHarvestDate: data.targetHarvestDate || null,
      target_weight_g: data.target_weight_g || null,
      supplierId: data.supplierId || null,
      notes: data.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

    .returning('id')
    .executeTakeFirstOrThrow()

  // Log audit
  const { logAudit } = await import('../logging/audit')
  await logAudit({
    userId,
    action: 'create',
    entityType: 'batch',
    entityId: result.id,
    details: data,
  })

  return result.id
}

// Server function for client-side calls
export const createBatchFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { batch: CreateBatchData }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return createBatch(session.user.id, data.batch)
  })

/**
 * Get batches for a user - optionally filtered by farm
 * If farmId is undefined, returns batches from all user's farms
 */
export async function getBatches(
  userId: string,
  farmId?: string,
  filters?: {
    status?: 'active' | 'depleted' | 'sold'
    livestockType?: 'poultry' | 'fish'
    species?: string
  },
) {
  const { db } = await import('../db')
  const { checkFarmAccess, getUserFarms } = await import('../auth/utils')

  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new Error('Access denied to this farm')
    }
    targetFarmIds = [farmId]
  } else {
    // getUserFarms returns string[] of farm IDs
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) {
      return []
    }
  }

  let query = db
    .selectFrom('batches')
    .leftJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'batches.id',
      'batches.farmId',
      'batches.livestockType',
      'batches.species',
      'batches.initialQuantity',
      'batches.currentQuantity',
      'batches.acquisitionDate',
      'batches.costPerUnit',
      'batches.totalCost',
      'batches.status',
      'batches.createdAt',
      'batches.updatedAt',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('batches.acquisitionDate', 'desc')

  if (filters?.status) {
    query = query.where('batches.status', '=', filters.status)
  }

  if (filters?.livestockType) {
    query = query.where('batches.livestockType', '=', filters.livestockType)
  }

  if (filters?.species) {
    query = query.where('batches.species', '=', filters.species)
  }

  return await query.execute()
}

/**
 * Get a single batch by ID
 */
export async function getBatchById(userId: string, batchId: string) {
  const { db } = await import('../db')
  const { checkFarmAccess } = await import('../auth/utils')

  const batch = await db
    .selectFrom('batches')
    .leftJoin('structures', 'structures.id', 'batches.structureId')
    .leftJoin('suppliers', 'suppliers.id', 'batches.supplierId')
    .select([
      'batches.id',
      'batches.farmId',
      'batches.batchName',
      'batches.livestockType',
      'batches.species',
      'batches.sourceSize',
      'batches.initialQuantity',
      'batches.currentQuantity',
      'batches.acquisitionDate',
      'batches.costPerUnit',
      'batches.totalCost',
      'batches.status',
      'batches.targetHarvestDate',
      'batches.notes',
      'batches.createdAt',
      'batches.updatedAt',
      'structures.name as structureName',
      'suppliers.name as supplierName',
    ])
    .where('batches.id', '=', batchId)
    .executeTakeFirst()

  if (!batch) {
    return null
  }

  // Check farm access
  const hasAccess = await checkFarmAccess(userId, batch.farmId)
  if (!hasAccess) {
    throw new Error('Access denied to this batch')
  }

  return batch
}

/**
 * Update a batch
 */
export async function updateBatch(
  userId: string,
  batchId: string,
  data: UpdateBatchData,
) {
  const { db } = await import('../db')

  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found')
  }

  const updateData: {
    species?: string
    status?: 'active' | 'depleted' | 'sold'
    batchName?: string | null
    sourceSize?: string | null
    structureId?: string | null
    targetHarvestDate?: Date | null
    notes?: string | null
  } = {}

  if (data.species !== undefined) updateData.species = data.species
  if (data.status !== undefined) updateData.status = data.status
  if (data.batchName !== undefined) updateData.batchName = data.batchName
  if (data.sourceSize !== undefined) updateData.sourceSize = data.sourceSize
  if (data.structureId !== undefined) updateData.structureId = data.structureId
  if (data.targetHarvestDate !== undefined)
    updateData.targetHarvestDate = data.targetHarvestDate
  if (data.target_weight_g !== undefined)
    updateData.target_weight_g = data.target_weight_g
  if (data.notes !== undefined) updateData.notes = data.notes

  await db
    .updateTable('batches')
    .set(updateData)
    .where('id', '=', batchId)
    .execute()

    .where('id', '=', batchId)
    .execute()

  // Log audit
  const { logAudit } = await import('../logging/audit')
  await logAudit({
    userId,
    action: 'update',
    entityType: 'batch',
    entityId: batchId,
    details: {
      before: batch,
      updates: updateData,
    },
  })

  return await getBatchById(userId, batchId)
}

// Server function for client-side calls
export const updateBatchFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { batchId: string; batch: UpdateBatchData }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return updateBatch(session.user.id, data.batchId, data.batch)
  })

/**
 * Delete a batch
 */
export async function deleteBatch(userId: string, batchId: string) {
  const { db } = await import('../db')

  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found')
  }

  // Check for related records
  const [feedRecords, eggRecords, sales, mortalities] = await Promise.all([
    db
      .selectFrom('feed_records')
      .select('id')
      .where('batchId', '=', batchId)
      .executeTakeFirst(),
    db
      .selectFrom('egg_records')
      .select('id')
      .where('batchId', '=', batchId)
      .executeTakeFirst(),
    db
      .selectFrom('sales')
      .select('id')
      .where('batchId', '=', batchId)
      .executeTakeFirst(),
    db
      .selectFrom('mortalities')
      .select('id')
      .where('batchId', '=', batchId)
      .executeTakeFirst(),
  ])

  if (feedRecords || eggRecords || sales || mortalities) {
    throw new Error(
      'Cannot delete batch with existing records. Delete related records first.',
    )
  }

  await db.deleteFrom('batches').where('id', '=', batchId).execute()

  // Log audit
  const { logAudit } = await import('../logging/audit')
  await logAudit({
    userId,
    action: 'delete',
    entityType: 'batch',
    entityId: batchId,
    details: { message: 'Batch deleted', snapshot: batch },
  })
}

// Server function for client-side calls
export const deleteBatchFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { batchId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return deleteBatch(session.user.id, data.batchId)
  })

/**
 * Update batch quantity (used by mortality, sales, etc.)
 */
export async function updateBatchQuantity(
  batchId: string,
  newQuantity: number,
) {
  const { db } = await import('../db')

  const status = newQuantity <= 0 ? 'depleted' : 'active'

  await db
    .updateTable('batches')
    .set({
      currentQuantity: newQuantity,
      status,
    })
    .where('id', '=', batchId)
    .execute()
}

/**
 * Get batch statistics
 */
export async function getBatchStats(userId: string, batchId: string) {
  const { db } = await import('../db')

  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found')
  }

  const [mortalityStats, feedStats, salesStats, expenseStats] =
    await Promise.all([
      // Mortality statistics
      db
        .selectFrom('mortality_records')
        .select([
          db.fn.count('id').as('total_deaths'),
          db.fn.sum('quantity').as('total_mortality'),
        ])
        .where('batchId', '=', batchId)
        .executeTakeFirst(),

      // Feed statistics
      db
        .selectFrom('feed_records')
        .select([
          db.fn.count('id').as('total_feedings'),
          db.fn.sum('quantityKg').as('total_feed_kg'),
          db.fn.sum('cost').as('total_feed_cost'),
        ])
        .where('batchId', '=', batchId)
        .executeTakeFirst(),

      // Sales statistics
      db
        .selectFrom('sales')
        .select([
          db.fn.count('id').as('total_sales'),
          db.fn.sum('quantity').as('total_sold'),
          db.fn.sum('totalAmount').as('total_revenue'),
        ])
        .where('batchId', '=', batchId)
        .executeTakeFirst(),

      // Other Expenses statistics
      db
        .selectFrom('expenses')
        .select(db.fn.sum('amount').as('total_expenses'))
        .where('batchId', '=', batchId)
        .executeTakeFirst(),
    ])

  const totalMortality = Number(mortalityStats?.total_mortality || 0)
  const totalSold = Number(salesStats?.total_sold || 0)
  const totalFeedKg = toNumber(String(feedStats?.total_feed_kg || '0'))
  const totalFeedCost = toNumber(String(feedStats?.total_feed_cost || '0'))

  // Calculate mortality rate
  const mortalityRate =
    batch.initialQuantity > 0
      ? (totalMortality / batch.initialQuantity) * 100
      : 0

  // Calculate average weight if we have weight samples
  const weightSamples = await db
    .selectFrom('weight_samples')
    .select(['averageWeightKg', 'date'])
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .limit(1)
    .executeTakeFirst()

  // Calculate FCR (Feed Conversion Ratio) if we have weight data
  let fcr = null
  if (weightSamples && totalFeedKg > 0) {
    const avgWeight = toNumber(weightSamples.averageWeightKg)
    const totalWeightGain = avgWeight * batch.currentQuantity
    fcr = totalFeedKg / totalWeightGain
  }

  return {
    batch,
    mortality: {
      totalDeaths: Number(mortalityStats?.total_deaths || 0),
      totalQuantity: totalMortality,
      rate: mortalityRate,
    },
    feed: {
      totalFeedings: Number(feedStats?.total_feedings || 0),
      totalKg: totalFeedKg,
      totalCost: totalFeedCost,
      fcr,
    },
    sales: {
      totalSales: Number(salesStats?.total_sales || 0),
      totalQuantity: totalSold,
      totalRevenue: toNumber(String(salesStats?.total_revenue || '0')),
    },
    expenses: {
      total: toNumber(String(expenseStats?.total_expenses || '0')),
    },
    currentWeight: weightSamples
      ? toNumber(String(weightSamples.averageWeightKg))
      : null,
  }
}

/**
 * Get inventory summary for a farm or all farms
 */
export async function getInventorySummary(userId: string, farmId?: string) {
  const { db } = await import('../db')
  const { checkFarmAccess, getUserFarms } = await import('../auth/utils')

  let targetFarmIds: Array<string> = []

  if (farmId) {
    // Check specific farm access
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new Error('Access denied to this farm')
    }
    targetFarmIds = [farmId]
  } else {
    // Get all accessible farms
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) {
      // Return empty stats if no farms
      return {
        overall: {
          totalQuantity: 0,
          activeBatches: 0,
          totalInvestment: 0,
          depletedBatches: 0,
        },
        poultry: { batches: 0, quantity: 0, investment: 0 },
        fish: { batches: 0, quantity: 0, investment: 0 },
        feed: { totalFeedings: 0, totalKg: 0, totalCost: 0, fcr: 0 },
        sales: { totalSales: 0, totalQuantity: 0, totalRevenue: 0 },
        currentWeight: null,
      }
    }
  }

  const [poultryStats, fishStats, overallStats] = await Promise.all([
    // Poultry statistics
    db
      .selectFrom('batches')
      .select([
        db.fn.count('id').as('total_batches'),
        db.fn.sum('currentQuantity').as('total_quantity'),
        db.fn.sum('totalCost').as('total_investment'),
      ])
      .where('farmId', 'in', targetFarmIds)
      .where('livestockType', '=', 'poultry')
      .where('status', '=', 'active')
      .executeTakeFirst(),

    // Fish statistics
    db
      .selectFrom('batches')
      .select([
        db.fn.count('id').as('total_batches'),
        db.fn.sum('currentQuantity').as('total_quantity'),
        db.fn.sum('totalCost').as('total_investment'),
      ])
      .where('farmId', 'in', targetFarmIds)
      .where('livestockType', '=', 'fish')
      .where('status', '=', 'active')
      .executeTakeFirst(),

    // Overall statistics
    db
      .selectFrom('batches')
      .select([
        db.fn.count('id').as('total_batches'),
        db.fn.sum('currentQuantity').as('total_quantity'),
        db.fn.sum('totalCost').as('total_investment'),
      ])
      .where('farmId', 'in', targetFarmIds)
      .where('status', '=', 'active')
      .executeTakeFirst(),
  ])

  // Get depleted batches count
  const depletedBatches = await db
    .selectFrom('batches')
    .select([db.fn.count('id').as('count')])
    .where('farmId', 'in', targetFarmIds)
    .where('status', '=', 'depleted')
    .executeTakeFirst()

  // Get feed stats - join with batches to filter by farmId
  const feedStats = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      db.fn.count('feed_records.id').as('total_feedings'),
      db.fn.sum('feed_records.quantityKg').as('total_kg'),
      db.fn.sum('feed_records.cost').as('total_cost'),
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .executeTakeFirst()

  // Get sales stats - join with batches to filter by farmId
  const salesStats = await db
    .selectFrom('sales')
    .innerJoin('batches', 'batches.id', 'sales.batchId')
    .select([
      db.fn.count('sales.id').as('total_sales'),
      db.fn.sum('sales.quantity').as('total_quantity'),
      db.fn.sum('sales.totalAmount').as('total_revenue'),
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .executeTakeFirst()

  // Calculate Average Weight (approximation across active batches)
  // Join with batches to filter by farmId
  const recentWeights = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.averageWeightKg'])
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('weight_samples.date', 'desc')
    .limit(10) // Last 10 samples
    .execute()

  const averageWeightKg =
    recentWeights.length > 0
      ? recentWeights.reduce(
        (sum, w) => sum + Number(w.averageWeightKg || 0),
        0,
      ) / recentWeights.length
      : 0

  // Helper to safely convert to number
  const safeToNumber = (val: string | number | null | undefined) =>
    Number(val || 0)

  // Calculate FCR
  const totalFeedKg = safeToNumber(String(feedStats?.total_kg || '0'))
  const totalSold = safeToNumber(String(salesStats?.total_quantity || '0'))
  const fcr = totalSold > 0 ? Number((totalFeedKg / totalSold).toFixed(2)) : 0

  const totalFeedCost = toNumber(String(feedStats?.total_cost || '0'))

  const totalQuantityOverall = toNumber(
    String(overallStats?.total_quantity || '0'),
  )
  const totalInvestmentOverall = safeToNumber(
    String(overallStats?.total_investment || '0'),
  )

  return {
    overall: {
      totalBatches: Number(overallStats?.total_batches || 0),
      activeBatches: Number(overallStats?.total_batches || 0),
      totalQuantity: totalQuantityOverall,
      totalInvestment: totalInvestmentOverall,
      depletedBatches: Number(depletedBatches?.count || 0),
    },
    poultry: {
      batches: Number(poultryStats?.total_batches || 0),
      quantity: toNumber(String(poultryStats?.total_quantity || '0')),
      investment: toNumber(String(poultryStats?.total_investment || '0')),
    },
    fish: {
      batches: Number(fishStats?.total_batches || 0),
      quantity: toNumber(String(fishStats?.total_quantity || '0')),
      investment: toNumber(String(fishStats?.total_investment || '0')),
    },
    feed: {
      totalFeedings: Number(feedStats?.total_feedings || 0),
      totalKg: totalFeedKg,
      totalCost: totalFeedCost,
      fcr,
    },
    sales: {
      totalSales: Number(salesStats?.total_sales || 0),
      totalQuantity: totalSold,
      totalRevenue: toNumber(String(salesStats?.total_revenue || '0')),
    },
    currentWeight: averageWeightKg > 0 ? averageWeightKg : null,
  }
}

/**
 * Paginated batches query with sorting and search
 */
export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
  status?: string
  livestockType?: string
}

export interface PaginatedResult<T> {
  data: Array<T>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getBatchesPaginated(
  userId: string,
  query: PaginatedQuery = {},
): Promise<
  PaginatedResult<{
    id: string
    farmId: string
    farmName: string | null
    livestockType: string
    species: string
    initialQuantity: number
    currentQuantity: number
    acquisitionDate: Date
    costPerUnit: string
    totalCost: string
    status: string
  }>
> {
  const { db } = await import('../db')
  const { sql } = await import('kysely')
  const { checkFarmAccess, getUserFarms } = await import('../auth/utils')

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const sortBy = query.sortBy || 'acquisitionDate'
  const sortOrder = query.sortOrder || 'desc'
  const search = query.search || ''

  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (query.farmId) {
    const hasAccess = await checkFarmAccess(userId, query.farmId)
    if (!hasAccess) throw new Error('Access denied')
    targetFarmIds = [query.farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 }
    }
  }

  // Build base query for count
  let countQuery = db
    .selectFrom('batches')
    .leftJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', targetFarmIds)

  // Apply search filter
  if (search) {
    countQuery = countQuery.where((eb) =>
      eb.or([
        eb('batches.species', 'ilike', `%${search}%`),
        eb('farms.name', 'ilike', `%${search}%`),
      ]),
    )
  }

  // Apply status filter
  if (query.status) {
    countQuery = countQuery.where('batches.status', '=', query.status as any)
  }

  // Apply type filter
  if (query.livestockType) {
    countQuery = countQuery.where(
      'batches.livestockType',
      '=',
      query.livestockType as any,
    )
  }

  // Get total count
  const countResult = await countQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()
  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Apply sorting
  const sortColumn =
    sortBy === 'species'
      ? 'batches.species'
      : sortBy === 'currentQuantity'
        ? 'batches.currentQuantity'
        : sortBy === 'status'
          ? 'batches.status'
          : sortBy === 'livestockType'
            ? 'batches.livestockType'
            : 'batches.acquisitionDate'

  let dataQuery = db
    .selectFrom('batches')
    .leftJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'batches.id',
      'batches.farmId',
      'batches.livestockType',
      'batches.species',
      'batches.initialQuantity',
      'batches.currentQuantity',
      'batches.acquisitionDate',
      'batches.costPerUnit',
      'batches.totalCost',
      'batches.status',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)

  // Re-apply filters
  if (search) {
    dataQuery = dataQuery.where((eb) =>
      eb.or([
        eb('batches.species', 'ilike', `%${search}%`),
        eb('farms.name', 'ilike', `%${search}%`),
      ]),
    )
  }
  if (query.status) {
    dataQuery = dataQuery.where('batches.status', '=', query.status as any)
  }
  if (query.livestockType) {
    dataQuery = dataQuery.where(
      'batches.livestockType',
      '=',
      query.livestockType as any,
    )
  }

  // Apply sorting and pagination
  const data = await dataQuery
    .orderBy(sortColumn as any, sortOrder)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return {
    data: data.map((d) => ({
      ...d,
      farmName: d.farmName || null,
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

// Server function for paginated batches
export const getBatchesPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getBatchesPaginated(session.user.id, data)
  })

// Server function for batch details
export const getBatchDetailsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { batchId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getBatchStats(session.user.id, data.batchId)
  })
