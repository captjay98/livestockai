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
  breedId?: string | null
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
  targetPricePerUnit?: string | null
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
  breedId: string | null
  breedName: string | null
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
  deletedAt: Date | null
  structureName: string | null
  supplierName: string | null
  formulation: {
    name: string
    species: string
    stage: string
    costPerKg: string
  } | null
}

/**
 * Filters for batch queries
 */
export interface BatchFilters {
  status?: 'active' | 'depleted' | 'sold'
  livestockType?: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species?: string
  breedId?: string
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
    .leftJoin('farms', 'farms.id', 'batches.farmId')
    .leftJoin('structures', 'structures.id', 'batches.structureId')
    .leftJoin('suppliers', 'suppliers.id', 'batches.supplierId')
    .leftJoin('breeds', 'breeds.id', 'batches.breedId')
    .select([
      'batches.id',
      'batches.farmId',
      'farms.name as farmName',
      'batches.batchName',
      'batches.livestockType',
      'batches.species',
      'batches.breedId',
      'breeds.displayName as breedName',
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
    .where('batches.deletedAt', 'is', null)
    .executeTakeFirst()

  return batch as BatchWithFarmName | null
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
    .leftJoin('breeds', 'breeds.id', 'batches.breedId')
    .leftJoin('structures', 'structures.id', 'batches.structureId')
    .leftJoin('suppliers', 'suppliers.id', 'batches.supplierId')
    .select([
      'batches.id',
      'batches.farmId',
      'batches.batchName',
      'batches.livestockType',
      'batches.species',
      'batches.breedId',
      'breeds.displayName as breedName',
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
      'batches.deletedAt',
      'farms.name as farmName',
      'structures.name as structureName',
      'suppliers.name as supplierName',
    ])
    .where('batches.farmId', 'in', farmIds)
    .where('batches.deletedAt', 'is', null)
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

  if (filters?.breedId) {
    query = query.where('batches.breedId', '=', filters.breedId)
  }

  const batches = await query.execute()

  // Get formulation data for all batches in a single query
  const batchIds = batches.map((b) => b.id)
  const formulations =
    batchIds.length > 0
      ? await db
          .selectFrom('formulation_usage')
          .leftJoin(
            'saved_formulations',
            'formulation_usage.formulationId',
            'saved_formulations.id',
          )
          .select([
            'formulation_usage.batchId',
            'saved_formulations.name',
            'saved_formulations.species',
            'saved_formulations.productionStage',
            'saved_formulations.totalCostPerKg',
          ])
          .where('formulation_usage.batchId', 'in', batchIds)
          .distinctOn('formulation_usage.batchId')
          .orderBy('formulation_usage.batchId')
          .orderBy('formulation_usage.createdAt', 'desc')
          .execute()
      : []

  // Create a map for quick lookup
  const formulationMap = new Map(
    formulations.map((f) => [
      f.batchId,
      {
        name: f.name,
        species: f.species,
        stage: f.productionStage,
        costPerKg: f.totalCostPerKg,
      },
    ]),
  )

  return batches.map((batch) => ({
    ...batch,
    formulation: formulationMap.get(batch.id) || null,
  })) as Array<BatchWithFarmName>
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
  await db.updateTable('batches').set(data).where('id', '=', batchId).execute()
}

/**
 * Update batch fields with conflict detection.
 * Returns the updated batch if successful, or null if there's a conflict.
 *
 * Uses SERIALIZABLE isolation level to prevent race conditions under high concurrency.
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to update
 * @param data - Fields to update
 * @param expectedUpdatedAt - The updatedAt timestamp the client expects
 * @returns The updated batch or null if conflict detected
 */
export async function updateBatchWithConflictCheck(
  db: Kysely<Database>,
  batchId: string,
  data: BatchUpdate,
  expectedUpdatedAt: Date,
): Promise<BatchWithFarmName | null> {
  const { sql } = await import('kysely')

  // Use a transaction with SERIALIZABLE isolation level to prevent race conditions
  return await db.transaction().execute(async (trx) => {
    // Set isolation level to SERIALIZABLE for this transaction
    await sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`.execute(trx)

    // Get current batch state
    const currentBatch = await trx
      .selectFrom('batches')
      .select([
        'id',
        'farmId',
        'livestockType',
        'species',
        'breedId',
        'batchName',
        'sourceSize',
        'initialQuantity',
        'currentQuantity',
        'acquisitionDate',
        'costPerUnit',
        'totalCost',
        'status',
        'structureId',
        'targetHarvestDate',
        'target_weight_g',
        'targetPricePerUnit',
        'supplierId',
        'notes',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ])
      .where('id', '=', batchId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst()

    if (!currentBatch) {
      return null
    }

    // Check for conflict - if server version is newer than expected
    const serverTime = new Date(currentBatch.updatedAt).getTime()
    const expectedTime = new Date(expectedUpdatedAt).getTime()

    if (serverTime > expectedTime) {
      // Conflict detected - return null to signal conflict
      return null
    }

    // No conflict - perform the update
    await trx
      .updateTable('batches')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', batchId)
      .execute()

    // Return the updated batch (use trx for transaction consistency)
    return await getBatchById(trx, batchId)
  })
}

/**
 * Get batch with updatedAt for conflict detection
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns The batch with updatedAt timestamp
 */
export async function getBatchForConflictCheck(
  db: Kysely<Database>,
  batchId: string,
): Promise<{ id: string; updatedAt: Date } | null> {
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'updatedAt'])
    .where('id', '=', batchId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst()

  return batch || null
}

/**
 * Update batch quantity and status (Sets absolute value)
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
      updatedAt: new Date(),
    })
    .where('id', '=', batchId)
    .execute()
}

/**
 * Atomically subtract quantity from a batch and update status
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @param quantity - Quantity to subtract
 */
export async function atomicSubtractBatchQuantity(
  db: Kysely<Database>,
  batchId: string,
  quantity: number,
): Promise<void> {
  const { sql } = await import('kysely')
  await db
    .updateTable('batches')
    .set((eb) => ({
      currentQuantity: eb('currentQuantity', '-', quantity),
      status: sql`CASE WHEN "currentQuantity" - ${quantity} <= 0 THEN 'depleted' ELSE 'active' END`,
      updatedAt: new Date(),
    }))
    .where('id', '=', batchId)
    .execute()
}

/**
 * Atomically add quantity to a batch
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @param quantity - Quantity to add
 */
export async function atomicAddBatchQuantity(
  db: Kysely<Database>,
  batchId: string,
  quantity: number,
): Promise<void> {
  await db
    .updateTable('batches')
    .set((eb) => ({
      currentQuantity: eb('currentQuantity', '+', quantity),
      status: 'active',
      updatedAt: new Date(),
    }))
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
  await db
    .updateTable('batches')
    .set({ deletedAt: new Date() })
    .where('id', '=', batchId)
    .execute()
}

/**
 * Restore a deleted batch
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to restore
 */
export async function restoreBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<void> {
  await db
    .updateTable('batches')
    .set({ deletedAt: null })
    .where('id', '=', batchId)
    .execute()
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
  const { sql } = await import('kysely')

  const result = await db
    .selectFrom('batches as b')
    .leftJoin('feed_records as fr', 'fr.batchId', 'b.id')
    .leftJoin('egg_records as er', 'er.batchId', 'b.id')
    .leftJoin('sales as s', 's.batchId', 'b.id')
    .leftJoin('mortality_records as mr', 'mr.batchId', 'b.id')
    .select([
      sql<boolean>`COUNT(DISTINCT fr.id) > 0`.as('hasFeedRecords'),
      sql<boolean>`COUNT(DISTINCT er.id) > 0`.as('hasEggRecords'),
      sql<boolean>`COUNT(DISTINCT s.id) > 0`.as('hasSales'),
      sql<boolean>`COUNT(DISTINCT mr.id) > 0`.as('hasMortality'),
    ])
    .where('b.id', '=', batchId)
    .groupBy('b.id')
    .executeTakeFirst()

  return {
    hasFeedRecords: result?.hasFeedRecords ?? false,
    hasEggRecords: result?.hasEggRecords ?? false,
    hasSales: result?.hasSales ?? false,
    hasMortality: result?.hasMortality ?? false,
  }
}

/**
 * Get aggregated statistics for a batch using optimized single query with JOINs
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Object containing mortality, feed, sales, and expense statistics
 */
export async function getBatchStats(db: Kysely<Database>, batchId: string) {
  const { sql } = await import('kysely')

  // Single optimized query with LEFT JOINs and aggregations
  const stats = await db
    .selectFrom('batches as b')
    .leftJoin('mortality_records as mr', 'mr.batchId', 'b.id')
    .leftJoin('feed_records as fr', 'fr.batchId', 'b.id')
    .leftJoin('sales as s', 's.batchId', 'b.id')
    .leftJoin('expenses as e', 'e.batchId', 'b.id')
    .select([
      // Mortality aggregations
      sql<number>`COUNT(DISTINCT mr.id)`.as('total_deaths'),
      sql<number>`COALESCE(SUM(mr.quantity), 0)`.as('total_mortality'),

      // Feed aggregations
      sql<number>`COUNT(DISTINCT fr.id)`.as('total_feedings'),
      sql<string>`SUM(fr."quantityKg")`.as('total_feed_kg'),
      sql<string>`SUM(fr.cost)`.as('total_feed_cost'),

      // Sales aggregations
      sql<number>`COUNT(DISTINCT s.id)`.as('total_sales'),
      sql<number>`COALESCE(SUM(s.quantity), 0)`.as('total_sold'),
      sql<string>`SUM(s."totalAmount")`.as('total_revenue'),

      // Expense aggregations
      sql<string>`SUM(e.amount)`.as('total_expenses'),
    ])
    .where('b.id', '=', batchId)
    .groupBy('b.id')
    .executeTakeFirst()

  // Get most recent formulation separately (complex join)
  const formulationData = await db
    .selectFrom('formulation_usage')
    .leftJoin(
      'saved_formulations',
      'formulation_usage.formulationId',
      'saved_formulations.id',
    )
    .select([
      'saved_formulations.name',
      'saved_formulations.species',
      'saved_formulations.productionStage',
      'saved_formulations.totalCostPerKg',
    ])
    .where('formulation_usage.batchId', '=', batchId)
    .orderBy('formulation_usage.createdAt', 'desc')
    .limit(1)
    .executeTakeFirst()

  return {
    mortality: {
      totalDeaths: Number(stats?.total_deaths || 0),
      totalMortality: Number(stats?.total_mortality || 0),
    },
    feed: {
      totalFeedings: Number(stats?.total_feedings || 0),
      totalFeedKg: stats?.total_feed_kg || null,
      totalFeedCost: stats?.total_feed_cost || null,
    },
    sales: {
      totalSales: Number(stats?.total_sales || 0),
      totalSold: Number(stats?.total_sold || 0),
      totalRevenue: stats?.total_revenue || null,
    },
    expenses: {
      totalExpenses: stats?.total_expenses || null,
    },
    formulation: formulationData
      ? {
          name: formulationData.name,
          species: formulationData.species,
          stage: formulationData.productionStage,
          costPerKg: formulationData.totalCostPerKg,
        }
      : null,
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
 * Get paginated batches with filters
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param filters - Pagination and filter parameters
 * @returns Paginated result
 */
export async function getBatchesByFarmPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: 'active' | 'depleted' | 'sold'
    livestockType?: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
    breedId?: string
  },
): Promise<{
  data: Array<BatchWithFarmName>
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const { sql } = await import('kysely')

  const page = filters.page || 1
  const pageSize = filters.pageSize || 20
  const sortBy = filters.sortBy || 'acquisitionDate'
  const sortOrder = filters.sortOrder || 'desc'
  const search = filters.search || ''

  // Build base query for count
  let countQuery = db
    .selectFrom('batches')
    .leftJoin('farms', 'farms.id', 'batches.farmId')
    .leftJoin('structures', 'structures.id', 'batches.structureId')
    .leftJoin('suppliers', 'suppliers.id', 'batches.supplierId')
    .where('batches.farmId', 'in', farmIds)
    .where('batches.deletedAt', 'is', null)

  // Apply search filter
  if (search) {
    countQuery = countQuery.where((eb) =>
      eb.or([
        eb('batches.batchName', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
        eb('batches.notes', 'ilike', `%${search}%`),
        eb('farms.name', 'ilike', `%${search}%`),
      ]),
    )
  }

  // Apply status filter
  if (filters.status) {
    countQuery = countQuery.where('batches.status', '=', filters.status)
  }

  // Apply livestock type filter
  if (filters.livestockType) {
    countQuery = countQuery.where(
      'batches.livestockType',
      '=',
      filters.livestockType,
    )
  }

  // Apply breed filter
  if (filters.breedId) {
    countQuery = countQuery.where('batches.breedId', '=', filters.breedId)
  }

  // Get total count
  const countResult = await countQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()
  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Build data query
  let dataQuery = db
    .selectFrom('batches')
    .leftJoin('farms', 'farms.id', 'batches.farmId')
    .leftJoin('structures', 'structures.id', 'batches.structureId')
    .leftJoin('suppliers', 'suppliers.id', 'batches.supplierId')
    .leftJoin('breeds', 'breeds.id', 'batches.breedId')
    .select([
      'batches.id',
      'batches.farmId',
      'batches.batchName',
      'batches.livestockType',
      'batches.species',
      'batches.breedId',
      'breeds.displayName as breedName',
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
      'structures.name as structureName',
      'suppliers.name as supplierName',
    ])
    .where('batches.farmId', 'in', farmIds)
    .where('batches.deletedAt', 'is', null)

  // Re-apply filters
  if (search) {
    dataQuery = dataQuery.where((eb) =>
      eb.or([
        eb('batches.batchName', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
        eb('batches.notes', 'ilike', `%${search}%`),
        eb('farms.name', 'ilike', `%${search}%`),
      ]),
    )
  }
  if (filters.status) {
    dataQuery = dataQuery.where('batches.status', '=', filters.status)
  }
  if (filters.livestockType) {
    dataQuery = dataQuery.where(
      'batches.livestockType',
      '=',
      filters.livestockType,
    )
  }
  if (filters.breedId) {
    dataQuery = dataQuery.where('batches.breedId', '=', filters.breedId)
  }

  // Apply sorting - use type-safe column reference
  type SortableColumn =
    | 'batches.species'
    | 'batches.currentQuantity'
    | 'batches.status'
    | 'farms.name'
    | 'batches.acquisitionDate'

  const sortColumn: SortableColumn =
    sortBy === 'species'
      ? 'batches.species'
      : sortBy === 'currentQuantity'
        ? 'batches.currentQuantity'
        : sortBy === 'status'
          ? 'batches.status'
          : sortBy === 'farmName'
            ? 'farms.name'
            : 'batches.acquisitionDate'

  const data = await dataQuery
    .orderBy(sortColumn, sortOrder)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return {
    data: data as Array<BatchWithFarmName>,
    total,
    page,
    pageSize,
    totalPages,
  }
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
      ? recentWeights.reduce(
          (sum, w) => sum + Number(w.averageWeightKg || 0),
          0,
        ) / recentWeights.length
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

/**
 * Get growth standards for a species, with optional breed-specific filtering
 *
 * @param db - Kysely database instance
 * @param species - Species name (e.g., 'Broiler', 'Catfish')
 * @param breedId - Optional breed ID for breed-specific standards
 * @returns Array of growth standards ordered by day
 *
 * Priority: If breedId provided, returns breed-specific standards.
 * If no breed-specific standards found, falls back to species-level (breedId IS NULL).
 */
export async function getGrowthStandards(
  db: Kysely<Database>,
  species: string,
  breedId?: string | null,
): Promise<
  Array<{
    id: string
    species: string
    day: number
    expected_weight_g: number
    breedId: string | null
  }>
> {
  // If breedId provided, try breed-specific standards first
  if (breedId) {
    const breedStandards = await db
      .selectFrom('growth_standards')
      .select(['id', 'species', 'day', 'expected_weight_g', 'breedId'])
      .where('species', '=', species)
      .where('breedId', '=', breedId)
      .orderBy('day', 'asc')
      .execute()

    // If breed-specific standards exist, return them
    if (breedStandards.length > 0) {
      return breedStandards
    }
  }

  // Fall back to species-level standards (breedId IS NULL)
  return db
    .selectFrom('growth_standards')
    .select(['id', 'species', 'day', 'expected_weight_g', 'breedId'])
    .where('species', '=', species)
    .where('breedId', 'is', null)
    .orderBy('day', 'asc')
    .execute()
}
