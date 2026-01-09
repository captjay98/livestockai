import { db } from '../db'
import { checkFarmAccess, getUserFarms } from '../auth/middleware'
import { multiply, toDbString, toNumber } from '../currency'

export interface CreateBatchData {
  farmId: string
  livestockType: 'poultry' | 'fish'
  species: string
  initialQuantity: number
  acquisitionDate: Date
  costPerUnit: number // in Naira
}

export interface UpdateBatchData {
  species?: string
  status?: 'active' | 'depleted' | 'sold'
}

/**
 * Create a new batch
 */
export async function createBatch(
  userId: string,
  data: CreateBatchData,
): Promise<string> {
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
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Get batches for a farm with filtering
 */
export async function getBatchesForFarm(
  userId: string,
  farmId: string,
  filters?: {
    status?: 'active' | 'depleted' | 'sold'
    livestockType?: 'poultry' | 'fish'
    species?: string
  },
) {
  // Check farm access
  const hasAccess = await checkFarmAccess(userId, farmId)
  if (!hasAccess) {
    throw new Error('Access denied to this farm')
  }

  let query = db
    .selectFrom('batches')
    .selectAll()
    .where('farmId', '=', farmId)
    .orderBy('acquisitionDate', 'desc')

  if (filters?.status) {
    query = query.where('status', '=', filters.status)
  }

  if (filters?.livestockType) {
    query = query.where('livestockType', '=', filters.livestockType)
  }

  if (filters?.species) {
    query = query.where('species', '=', filters.species)
  }

  return await query.execute()
}

/**
 * Get a single batch by ID
 */
export async function getBatchById(userId: string, batchId: string) {
  const batch = await db
    .selectFrom('batches')
    .selectAll()
    .where('id', '=', batchId)
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
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found')
  }

  const updateData: {
    species?: string
    status?: 'active' | 'depleted' | 'sold'
  } = {}

  if (data.species !== undefined) updateData.species = data.species
  if (data.status !== undefined) updateData.status = data.status

  await db
    .updateTable('batches')
    .set(updateData)
    .where('id', '=', batchId)
    .execute()

  return await getBatchById(userId, batchId)
}

/**
 * Update batch quantity (used by mortality, sales, etc.)
 */
export async function updateBatchQuantity(
  batchId: string,
  newQuantity: number,
) {
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
  const batch = await getBatchById(userId, batchId)
  if (!batch) {
    throw new Error('Batch not found')
  }

  const [mortalityStats, feedStats, salesStats] = await Promise.all([
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
    currentWeight: weightSamples
      ? toNumber(String(weightSamples.averageWeightKg))
      : null,
  }
}

/**
 * Get inventory summary for a farm or all farms
 */
export async function getInventorySummary(userId: string, farmId?: string) {
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
  const safeToNumber = (val: string | number | null | undefined) => Number(val || 0)

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
