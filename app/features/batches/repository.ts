/**
 * Database operations for batch management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Data for inserting a new batch
 */
export interface BatchInsert {
  farmId: string
  livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species: string
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: 'active' | 'depleted' | 'sold'
  batchName?: string | null
  sourceSize?: string | null
  structureId?: string | null
  targetHarvestDate?: Date | null
  target_weight_g?: number | null
  supplierId?: string | null
  notes?: string | null
}

/**
 * Data for updating a batch
 */
export interface BatchUpdate {
  species?: string
  status?: 'active' | 'depleted' | 'sold'
  batchName?: string | null
  sourceSize?: string | null
  structureId?: string | null
  targetHarvestDate?: Date | null
  target_weight_g?: number | null
  notes?: string | null
}

/**
 * Result from batch query with farm name
 */
export interface BatchWithFarmName {
  id: string
  farmId: string
  farmName: string | null
  batchName: string | null
  livestockType: string
  species: string
  sourceSize: string | null
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: string
  targetHarvestDate: Date | null
  target_weight_g: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  structureName?: string | null
  supplierName?: string | null
}

/**
 * Filters for batch queries
 */
export interface BatchFilters {
  status?: 'active' | 'depleted' | 'sold'
  livestockType?: 'poultry' | 'fish'
  species?: string
  farmId?: string
}

/**
 * Insert a new batch into the database
 *
 * @param db - Kysely database instance
 * @param data - Batch data to insert
 * @returns The ID of the created batch
 *
 * @example
 * ```ts
 * const batchId = await insertBatch(db, {
 *   farmId: 'farm-1',
 *   livestockType: 'poultry',
 *   species: 'Broiler',
 *   initialQuantity: 100,
 *   currentQuantity: 100,
 *   acquisitionDate: new Date(),
 *   costPerUnit: '5.50',
 *   totalCost: '550.00',
 *   status: 'active'
 * })
 * ```
 */
export async function insertBatch(
  db: Kysely<Database>,
  data: BatchInsert,
): Promise<string> {
  const result = await db
    .insertInto('batches')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single batch by ID
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to retrieve
 * @returns The batch data or null if not found
 */
export async function getBatchById(
  db: Kysely<Database>,
  batchId: string,
): Promise<BatchWithFarmName | null> {
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

  return (batch as BatchWithFarmName | null) ?? null
}

/**
 * Get batches with optional filters
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @param filters - Optional filters for status, livestock type, and species
 * @returns Array of batches with farm names
 */
export async function getBatchesByFarm(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: BatchFilters,
): Promise<Array<BatchWithFarmName>> {
  let query = db
    .selectFrom('batches')
    .leftJoin('farms', 'farms.id', 'batches.farmId')
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
      'batches.target_weight_g',
      'batches.notes',
      'batches.createdAt',
      'batches.updatedAt',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', farmIds)
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
 * Update batch fields
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to update
 * @param data - Fields to update
 */
export async function updateBatch(
  db: Kysely<Database>,
  batchId: string,
  data: BatchUpdate,
): Promise<void> {
  await db
    .updateTable('batches')
    .set(data)
    .where('id', '=', batchId)
    .execute()
}

/**
 * Update batch quantity and status
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to update
 * @param newQuantity - New quantity value
 * @param status - New status
 */
export async function updateBatchQuantity(
  db: Kysely<Database>,
  batchId: string,
  newQuantity: number,
  status: 'active' | 'depleted' | 'sold',
): Promise<void> {
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
 * Delete a batch by ID
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to delete
 */
export async function deleteBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<void> {
  await db.deleteFrom('batches').where('id', '=', batchId).execute()
}

/**
 * Check for related records that would prevent batch deletion
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to check
 * @returns Object indicating presence of related records
 */
export async function getRelatedRecords(
  db: Kysely<Database>,
  batchId: string,
): Promise<{
  hasFeedRecords: boolean
  hasEggRecords: boolean
  hasSales: boolean
  hasMortality: boolean
}> {
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
      .selectFrom('mortality_records')
      .select('id')
      .where('batchId', '=', batchId)
      .executeTakeFirst(),
  ])

  return {
    hasFeedRecords: !!feedRecords,
    hasEggRecords: !!eggRecords,
    hasSales: !!sales,
    hasMortality: !!mortalities,
  }
}

/**
 * Get aggregated statistics for a batch
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Object containing mortality, feed, sales, and expense statistics
 */
export async function getBatchStats(db: Kysely<Database>, batchId: string) {
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

  return {
    mortality: {
      totalDeaths: Number(mortalityStats?.total_deaths || 0),
      totalMortality: Number(mortalityStats?.total_mortality || 0),
    },
    feed: {
      totalFeedings: Number(feedStats?.total_feedings || 0),
      totalFeedKg: feedStats?.total_feed_kg || null,
      totalFeedCost: feedStats?.total_feed_cost || null,
    },
    sales: {
      totalSales: Number(salesStats?.total_sales || 0),
      totalSold: Number(salesStats?.total_sold || 0),
      totalRevenue: salesStats?.total_revenue || null,
    },
    expenses: {
      totalExpenses: expenseStats?.total_expenses || null,
    },
  }
}

/**
 * Get weight samples for a batch
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @param limit - Maximum number of samples to return
 * @returns Array of weight samples ordered by date descending
 */
export async function getWeightSamples(
  db: Kysely<Database>,
  batchId: string,
  limit = 1,
) {
  return await db
    .selectFrom('weight_samples')
    .select(['averageWeightKg', 'date'])
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .limit(limit)
    .execute()
}

/**
 * Get inventory summary statistics for given farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Object containing poultry, fish, and overall statistics
 */
export async function getInventorySummary(
  db: Kysely<Database>,
  farmIds: Array<string>,
) {
  const [poultryStats, fishStats, overallStats, depletedBatches] =
    await Promise.all([
      // Poultry statistics
      db
        .selectFrom('batches')
        .select([
          db.fn.count('id').as('total_batches'),
          db.fn.sum('currentQuantity').as('total_quantity'),
          db.fn.sum('totalCost').as('total_investment'),
        ])
        .where('farmId', 'in', farmIds)
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
        .where('farmId', 'in', farmIds)
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
        .where('farmId', 'in', farmIds)
        .where('status', '=', 'active')
        .executeTakeFirst(),

      // Get depleted batches count
      db
        .selectFrom('batches')
        .select([db.fn.count('id').as('count')])
        .where('farmId', 'in', farmIds)
        .where('status', '=', 'depleted')
        .executeTakeFirst(),
    ])

  // Get feed stats - join with batches to filter by farmId
  const feedStats = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      db.fn.count('feed_records.id').as('total_feedings'),
      db.fn.sum('feed_records.quantityKg').as('total_kg'),
      db.fn.sum('feed_records.cost').as('total_cost'),
    ])
    .where('batches.farmId', 'in', farmIds)
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
    .where('batches.farmId', 'in', farmIds)
    .executeTakeFirst()

  // Get recent weight samples
  const recentWeights = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.averageWeightKg'])
    .where('batches.farmId', 'in', farmIds)
    .orderBy('weight_samples.date', 'desc')
    .limit(10)
    .execute()

  const averageWeightKg =
    recentWeights.length > 0
      ? recentWeights.reduce((sum, w) => sum + Number(w.averageWeightKg || 0), 0) /
        recentWeights.length
      : 0

  return {
    poultry: poultryStats,
    fish: fishStats,
    overall: overallStats,
    depletedBatches: depletedBatches,
    feedStats,
    salesStats,
    averageWeightKg,
  }
}
