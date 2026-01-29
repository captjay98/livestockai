/**
 * Database operations for feed management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

/**
 * Data for inserting a new feed record
 */
export interface FeedRecordInsert {
  batchId: string
  feedType: string
  quantityKg: string
  cost: string
  date: Date
  supplierId?: string | null
  inventoryId?: string | null
  brandName?: string | null
  bagSizeKg?: number | null
  numberOfBags?: number | null
  notes?: string | null
}

/**
 * Data for updating a feed record
 */
export interface FeedRecordUpdate {
  feedType?: string | undefined
  quantityKg?: string | undefined
  cost?: string | undefined
  date?: Date | undefined
  batchId?: string | undefined
}

/**
 * Feed record with joined batch data
 */
export interface FeedRecordWithBatch {
  id: string
  batchId: string
  feedType: string
  quantityKg: string
  cost: string
  date: Date
  supplierId: string | null
  inventoryId: string | null
  brandName: string | null
  bagSizeKg: number | null
  numberOfBags: number | null
  notes: string | null
  createdAt: Date
}

/**
 * Feed inventory record
 */
export interface FeedInventoryRecord {
  id: string
  farmId: string
  feedType: string
  quantityKg: string
  minThresholdKg: string | null
  updatedAt: Date
}

/**
 * Batch record
 */
export interface BatchRecord {
  id: string
  farmId: string
  currentQuantity: number
}

/**
 * Weight sample record
 */
export interface WeightSampleRecord {
  averageWeightKg: string
  date: Date
}

/**
 * Feed record for summary (type, quantity, cost)
 */
export interface FeedRecordForSummary {
  feedType: string
  quantityKg: string
  cost: string
}

/**
 * Feed record for stats (quantity, cost)
 */
export interface FeedRecordForStats {
  quantityKg: string
  cost: string
}

/**
 * Paginated feed query filters
 */
export interface FeedPaginatedFilters extends BasePaginatedQuery {
  farmIds: Array<string>
  batchId?: string
}

/**
 * Insert a new feed record
 *
 * @param db - Kysely database instance
 * @param data - Feed record data to insert
 * @returns The ID of the created feed record
 */
export async function insertFeedRecord(
  db: Kysely<Database>,
  data: FeedRecordInsert,
): Promise<string> {
  const result = await db
    .insertInto('feed_records')
    .values(data as any)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a feed record by ID
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the feed record
 * @returns The feed record or null if not found
 */
export async function getFeedRecordById(
  db: Kysely<Database>,
  recordId: string,
): Promise<FeedRecordWithBatch | null> {
  const record = await db
    .selectFrom('feed_records')
    .select([
      'id',
      'batchId',
      'feedType',
      'brandName',
      'bagSizeKg',
      'numberOfBags',
      'quantityKg',
      'cost',
      'date',
      'supplierId',
      'inventoryId',
      'notes',
      'createdAt',
    ])
    .where('id', '=', recordId)
    .executeTakeFirst()

  return record ?? null
}

/**
 * Get a batch by ID
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns The batch record or null if not found
 */
export async function getBatchById(
  db: Kysely<Database>,
  batchId: string,
): Promise<BatchRecord | null> {
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId', 'currentQuantity'])
    .where('id', '=', batchId)
    .executeTakeFirst()

  return batch ?? null
}

/**
 * Get feed inventory by ID
 *
 * @param db - Kysely database instance
 * @param inventoryId - ID of the inventory record
 * @returns The feed inventory record or null if not found
 */
export async function getFeedInventoryById(
  db: Kysely<Database>,
  inventoryId: string,
): Promise<FeedInventoryRecord | null> {
  const inventory = await db
    .selectFrom('feed_inventory')
    .select([
      'id',
      'farmId',
      'feedType',
      'quantityKg',
      'minThresholdKg',
      'updatedAt',
    ])
    .where('id', '=', inventoryId)
    .executeTakeFirst()

  return inventory ?? null
}

/**
 * Get feed inventory by farm and feed type
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param feedType - Type of feed
 * @returns The feed inventory record or null if not found
 */
export async function getFeedInventoryByFarmAndType(
  db: Kysely<Database>,
  farmId: string,
  feedType: string,
): Promise<FeedInventoryRecord | null> {
  const inventory = await db
    .selectFrom('feed_inventory')
    .select([
      'id',
      'farmId',
      'feedType',
      'quantityKg',
      'minThresholdKg',
      'updatedAt',
    ])
    .where('farmId', '=', farmId)
    .where('feedType', '=', feedType as any)
    .executeTakeFirst()

  return inventory ?? null
}

/**
 * Deduct quantity from feed inventory
 *
 * @param db - Kysely database instance
 * @param inventoryId - ID of the inventory record
 * @param quantity - Quantity to deduct
 */
export async function deductFromInventory(
  db: Kysely<Database>,
  inventoryId: string,
  quantity: string,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set((eb) => ({
      quantityKg: eb('quantityKg', '-', quantity),
      updatedAt: new Date(),
    }))
    .where('id', '=', inventoryId)
    .execute()
}

/**
 * Delete a feed record
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the feed record to delete
 */
export async function deleteFeedRecord(
  db: Kysely<Database>,
  recordId: string,
): Promise<void> {
  await db.deleteFrom('feed_records').where('id', '=', recordId).execute()
}

/**
 * Restore inventory on feed record deletion (add quantity back)
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param feedType - Type of feed
 * @param quantity - Quantity to restore
 */
export async function restoreInventoryOnDelete(
  db: Kysely<Database>,
  farmId: string,
  feedType: string,
  quantity: string,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set((eb) => ({
      quantityKg: eb('quantityKg', '+', quantity),
      updatedAt: new Date(),
    }))
    .where('farmId', '=', farmId)
    .where('feedType', '=', feedType as any)
    .execute()
}

/**
 * Update a feed record
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the feed record to update
 * @param data - Fields to update
 */
export async function updateFeedRecord(
  db: Kysely<Database>,
  recordId: string,
  data: FeedRecordUpdate,
): Promise<void> {
  await db
    .updateTable('feed_records')
    .set(data as any)
    .where('id', '=', recordId)
    .execute()
}

/**
 * Restore old inventory when updating feed type or quantity
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param feedType - Type of feed to restore
 * @param quantity - Quantity to restore
 */
export async function restoreOldInventory(
  db: Kysely<Database>,
  farmId: string,
  feedType: string,
  quantity: string,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set((eb) => ({
      quantityKg: eb('quantityKg', '+', quantity),
      updatedAt: new Date(),
    }))
    .where('farmId', '=', farmId)
    .where('feedType', '=', feedType as any)
    .execute()
}

/**
 * Get new feed inventory (for update scenario)
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param feedType - Type of feed
 * @returns The feed inventory record or null if not found
 */
export async function getNewInventory(
  db: Kysely<Database>,
  farmId: string,
  feedType: string,
): Promise<FeedInventoryRecord | null> {
  const inventory = await db
    .selectFrom('feed_inventory')
    .select([
      'id',
      'farmId',
      'feedType',
      'quantityKg',
      'minThresholdKg',
      'updatedAt',
    ])
    .where('farmId', '=', farmId)
    .where('feedType', '=', feedType as any)
    .executeTakeFirst()

  return inventory ?? null
}

/**
 * Deduct new inventory when updating feed type or quantity
 *
 * @param db - Kysely database instance
 * @param inventoryId - ID of the inventory record
 * @param quantity - Quantity to deduct
 */
export async function deductNewInventory(
  db: Kysely<Database>,
  inventoryId: string,
  quantity: string,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set((eb) => ({
      quantityKg: eb('quantityKg', '-', quantity),
      updatedAt: new Date(),
    }))
    .where('id', '=', inventoryId)
    .execute()
}

/**
 * Get all feed records for a batch
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Array of feed records
 */
export async function getFeedRecordsByBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<FeedRecordWithBatch>> {
  const records = await db
    .selectFrom('feed_records')
    .select([
      'id',
      'batchId',
      'feedType',
      'brandName',
      'bagSizeKg',
      'numberOfBags',
      'quantityKg',
      'cost',
      'date',
      'supplierId',
      'inventoryId',
      'notes',
      'createdAt',
    ])
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .execute()

  return records
}

/**
 * Get paginated feed records with filters
 *
 * @param db - Kysely database instance
 * @param filters - Pagination and filter options
 * @returns Paginated result with feed records
 */
export async function getFeedRecordsPaginated(
  db: Kysely<Database>,
  filters: FeedPaginatedFilters,
): Promise<PaginatedResult<any>> {
  const {
    farmIds,
    batchId,
    search,
    page = 1,
    pageSize = 10,
    sortBy,
    sortOrder,
  } = filters
  const offset = (page - 1) * pageSize

  const { sql } = await import('kysely')

  let baseQuery = db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', farmIds)

  // Apply filters
  if (search) {
    const searchLower = `%${search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('feed_records.feedType', 'ilike', searchLower as any),
        eb('batches.species', 'ilike', searchLower as any),
      ]),
    )
  }

  if (batchId) {
    baseQuery = baseQuery.where('feed_records.batchId', '=', batchId)
  }

  // Get total count
  const countResult = await baseQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Get data
  let dataQuery = baseQuery
    .leftJoin('suppliers', 'suppliers.id', 'feed_records.supplierId')
    .select([
      'feed_records.id',
      'feed_records.batchId',
      'feed_records.feedType',
      'feed_records.brandName',
      'feed_records.bagSizeKg',
      'feed_records.numberOfBags',
      'feed_records.quantityKg',
      'feed_records.cost',
      'feed_records.date',
      'feed_records.supplierId',
      'feed_records.notes',
      'feed_records.createdAt',
      'batches.species',
      'batches.livestockType',
      'batches.batchName',
      'farms.name as farmName',
      'batches.farmId',
      'suppliers.name as supplierName',
    ])
    .limit(pageSize)
    .offset(offset)

  // Apply sorting
  if (sortBy) {
    const order = sortOrder || 'desc'
    const sortColumn = mapSortColumnToDbColumn(sortBy)
    dataQuery = dataQuery.orderBy(sql.raw(sortColumn), order)
  } else {
    dataQuery = dataQuery.orderBy('feed_records.date', 'desc')
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

/**
 * Get feed summary for a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @returns Array of feed records for summary calculation
 */
export async function getFeedSummary(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<FeedRecordForSummary>> {
  const records = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      'feed_records.feedType',
      'feed_records.quantityKg',
      'feed_records.cost',
    ])
    .where('batches.farmId', '=', farmId)
    .execute()

  return records
}

/**
 * Get weight samples for FCR calculation
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Array of weight samples ordered by date ascending
 */
export async function getWeightSamples(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<WeightSampleRecord>> {
  const samples = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.averageWeightKg', 'weight_samples.date'])
    .where('weight_samples.batchId', '=', batchId)
    .orderBy('weight_samples.date', 'asc')
    .execute()

  return samples
}

/**
 * Get batch current quantity
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Current quantity or null if not found
 */
export async function getBatchQuantity(
  db: Kysely<Database>,
  batchId: string,
): Promise<number | null> {
  const batch = await db
    .selectFrom('batches')
    .select(['currentQuantity'])
    .where('id', '=', batchId)
    .executeTakeFirst()

  return batch?.currentQuantity ?? null
}

/**
 * Get feed inventory records for farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of feed inventory records
 */
export async function getFeedInventoryForFarms(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<FeedInventoryRecord>> {
  const inventory = await db
    .selectFrom('feed_inventory')
    .select([
      'id',
      'farmId',
      'feedType',
      'quantityKg',
      'minThresholdKg',
      'updatedAt',
    ])
    .where('farmId', 'in', farmIds)
    .execute()

  return inventory
}

/**
 * Get feed stats for a farm
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of feed records for stats calculation
 */
export async function getFeedStatsData(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<FeedRecordForStats>> {
  const records = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select(['feed_records.quantityKg', 'feed_records.cost'])
    .where('batches.farmId', 'in', farmIds)
    .execute()

  return records
}

/**
 * Get feed records for summary by batch
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param batchId - ID of the batch
 * @returns Array of feed records for summary
 */
export async function getFeedSummaryByBatch(
  db: Kysely<Database>,
  farmId: string,
  batchId: string,
): Promise<Array<FeedRecordForSummary>> {
  const records = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      'feed_records.feedType',
      'feed_records.quantityKg',
      'feed_records.cost',
    ])
    .where('feed_records.batchId', '=', batchId)
    .where('batches.farmId', '=', farmId)
    .execute()

  return records
}

/**
 * Get feed record with batch info for validation
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the feed record
 * @returns Feed record with feedType, quantityKg, or null if not found
 */
export async function getFeedRecordForValidation(
  db: Kysely<Database>,
  recordId: string,
): Promise<{ feedType: string; quantityKg: string } | null> {
  const record = await db
    .selectFrom('feed_records')
    .select(['feedType', 'quantityKg'])
    .where('id', '=', recordId)
    .executeTakeFirst()

  return record ?? null
}

/**
 * Get all feed records (for general queries)
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of feed records with join data
 */
export async function getFeedRecordsByFarms(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<any>> {
  const records = await db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'feed_records.id',
      'feed_records.batchId',
      'feed_records.feedType',
      'feed_records.quantityKg',
      'feed_records.cost',
      'feed_records.date',
      'feed_records.supplierId',
      'feed_records.createdAt',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .where('batches.farmId', 'in', farmIds)
    .orderBy('feed_records.date', 'desc')
    .execute()

  return records
}

// Helper function - validates and maps sort columns to prevent SQL injection
function mapSortColumnToDbColumn(sortBy: string): string {
  const sortMap: Record<string, string> = {
    date: 'feed_records.date',
    cost: 'feed_records.cost',
    quantityKg: 'feed_records.quantityKg',
    feedType: 'feed_records.feedType',
    createdAt: 'feed_records.createdAt',
  }
  return sortMap[sortBy] || 'feed_records.date' // Safe default instead of interpolating user input
}
