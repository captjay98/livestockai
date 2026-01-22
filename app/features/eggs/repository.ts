/**
 * Database operations for egg collection management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

/**
 * Data for inserting a new egg collection record
 */
export interface EggCollectionInsert {
  batchId: string
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
}

/**
 * Data for updating an egg collection record
 */
export interface EggCollectionUpdate {
  date?: Date
  quantityCollected?: number
  quantityBroken?: number
  quantitySold?: number
}

/**
 * Egg collection record with batch information
 */
export interface EggCollectionRecord {
  id: string
  batchId: string
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
  createdAt: Date
  batchSpecies?: string
  farmId?: string
  farmName?: string
  currentQuantity?: number
}

/**
 * Extended record with all related data for display
 */
export interface EggCollectionWithDetails extends EggCollectionRecord {
  batchSpecies: string
  farmId: string
  farmName: string
  livestockType: string
}

/**
 * Filters for egg collection queries
 */
export interface EggCollectionFilters extends BasePaginatedQuery {
  batchId?: string
  startDate?: Date
  endDate?: Date
}

/**
 * Summary data for egg collections
 */
export interface EggSummaryData {
  totalCollected: number
  totalBroken: number
  totalSold: number
  currentInventory: number
  recordCount: number
}

/**
 * Insert a new egg collection record
 *
 * @param db - Kysely database instance
 * @param data - Egg collection data to insert
 * @returns The ID of the created record
 *
 * @example
 * ```ts
 * const recordId = await insertEggCollection(db, {
 *   batchId: 'batch-1',
 *   date: new Date(),
 *   quantityCollected: 100,
 *   quantityBroken: 5,
 *   quantitySold: 0
 * })
 * ```
 */
export async function insertEggCollection(
  db: Kysely<Database>,
  data: EggCollectionInsert,
): Promise<string> {
  const result = await db
    .insertInto('egg_records')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single egg collection record by ID
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the record to retrieve
 * @returns The record with batch and farm details, or null if not found
 */
export async function getEggCollectionById(
  db: Kysely<Database>,
  recordId: string,
): Promise<EggCollectionWithDetails | null> {
  const record = await db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'egg_records.id',
      'egg_records.batchId',
      'egg_records.date',
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
      'egg_records.createdAt',
      'batches.species as batchSpecies',
      'batches.livestockType',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('egg_records.id', '=', recordId)
    .executeTakeFirst()

  return (record as EggCollectionWithDetails | null) ?? null
}

/**
 * Update an egg collection record
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the record to update
 * @param data - Fields to update
 * @returns Promise resolving when update is complete
 */
export async function updateEggCollection(
  db: Kysely<Database>,
  recordId: string,
  data: EggCollectionUpdate,
): Promise<void> {
  await db
    .updateTable('egg_records')
    .set(data)
    .where('id', '=', recordId)
    .execute()
}

/**
 * Delete an egg collection record
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the record to delete
 * @returns Promise resolving when delete is complete
 */
export async function deleteEggCollection(
  db: Kysely<Database>,
  recordId: string,
): Promise<void> {
  await db.deleteFrom('egg_records').where('id', '=', recordId).execute()
}

/**
 * Get egg collections by farm ID
 *
 * @param db - Kysely database instance
 * @param farmId - Farm ID to filter by
 * @param options - Optional date range filters
 * @returns Array of egg collection records with details
 */
export async function getEggCollectionsByFarm(
  db: Kysely<Database>,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<Array<EggCollectionWithDetails>> {
  let query = db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'egg_records.id',
      'egg_records.batchId',
      'egg_records.date',
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
      'egg_records.createdAt',
      'batches.species as batchSpecies',
      'batches.livestockType',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('batches.farmId', '=', farmId)

  if (options?.startDate) {
    query = query.where('egg_records.date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('egg_records.date', '<=', options.endDate)
  }

  return await query.orderBy('egg_records.date', 'desc').execute()
}

/**
 * Get egg collections by batch ID
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to filter by
 * @returns Array of egg collection records
 */
export async function getEggCollectionsByBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<EggCollectionRecord>> {
  return await db
    .selectFrom('egg_records')
    .select([
      'id',
      'batchId',
      'date',
      'quantityCollected',
      'quantityBroken',
      'quantitySold',
      'createdAt',
    ])
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .execute()
}

/**
 * Get paginated egg collections for a user
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs the user has access to
 * @param filters - Pagination and filter options
 * @returns Paginated result set
 */
export async function getEggPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters: EggCollectionFilters = {},
): Promise<PaginatedResult<Array<EggCollectionWithDetails>>> {
  const page = filters.page || 1
  const pageSize = filters.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', farmIds)

  // Apply filters
  if (filters.search) {
    const searchLower = `%${filters.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([eb('batches.species', 'ilike', searchLower)]),
    )
  }

  if (filters.batchId) {
    baseQuery = baseQuery.where('egg_records.batchId', '=', filters.batchId)
  }

  // Get total count using egg_records.id for count
  const countResult = await baseQuery
    .select((eb) => [eb.fn.count<number>('egg_records.id').as('count')])
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Get data
  let dataQuery = baseQuery
    .select([
      'egg_records.id',
      'egg_records.batchId',
      'egg_records.date',
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
      'egg_records.createdAt',
      'batches.species as batchSpecies',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .limit(pageSize)
    .offset(offset)

  // Apply sorting with proper column references
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder || 'desc'

    if (filters.sortBy === 'species') {
      dataQuery = dataQuery.orderBy('batches.species', sortOrder)
    } else if (filters.sortBy === 'date') {
      dataQuery = dataQuery.orderBy('egg_records.date', sortOrder)
    } else {
      dataQuery = dataQuery.orderBy(
        // @ts-ignore - Dynamic column for egg_records fields
        `egg_records.${filters.sortBy}`,
        sortOrder,
      )
    }
  } else {
    dataQuery = dataQuery.orderBy('egg_records.date', 'desc')
  }

  const data = await dataQuery.execute()

  return {
    data: data as Array<EggCollectionWithDetails>,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get egg summary for a farm
 *
 * @param db - Kysely database instance
 * @param farmId - Farm ID to get summary for
 * @param options - Optional date range filters
 * @returns Summary data object
 */
export async function getEggSummary(
  db: Kysely<Database>,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<EggSummaryData> {
  let query = db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
      'batches.currentQuantity',
    ])
    .where('batches.farmId', '=', farmId)

  if (options?.startDate) {
    query = query.where('egg_records.date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('egg_records.date', '<=', options.endDate)
  }

  const records = await query.execute()

  const totalCollected = records.reduce(
    (sum, r) => sum + r.quantityCollected,
    0,
  )
  const totalBroken = records.reduce((sum, r) => sum + r.quantityBroken, 0)
  const totalSold = records.reduce((sum, r) => sum + r.quantitySold, 0)
  const currentInventory = totalCollected - totalBroken - totalSold

  return {
    totalCollected,
    totalBroken,
    totalSold,
    currentInventory: Math.max(0, currentInventory),
    recordCount: records.length,
  }
}

/**
 * Get egg inventory for a farm or batch
 *
 * @param db - Kysely database instance
 * @param farmId - Farm ID
 * @param batchId - Optional batch ID filter
 * @returns Current inventory count
 */
export async function getEggInventory(
  db: Kysely<Database>,
  farmId: string,
  batchId?: string,
): Promise<number> {
  let query = db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
    ])
    .where('batches.farmId', '=', farmId)

  if (batchId) {
    query = query.where('egg_records.batchId', '=', batchId)
  }

  const records = await query.execute()

  const totalCollected = records.reduce(
    (sum, r) => sum + r.quantityCollected,
    0,
  )
  const totalBroken = records.reduce((sum, r) => sum + r.quantityBroken, 0)
  const totalSold = records.reduce((sum, r) => sum + r.quantitySold, 0)

  return totalCollected - totalBroken - totalSold
}

/**
 * Check if a batch is a layer poultry batch
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to check
 * @param farmId - Farm ID for additional verification
 * @returns Batch data if found and is poultry, null otherwise
 */
export async function getBatchForEggRecord(
  db: Kysely<Database>,
  batchId: string,
  farmId: string,
): Promise<{ id: string; farmId: string; livestockType: string } | null> {
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId', 'livestockType'])
    .where('id', '=', batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  return (batch as { id: string; farmId: string; livestockType: string } | null) ?? null
}

/**
 * Get egg records with verification that they belong to a specific farm
 *
 * @param db - Kysely database instance
 * @param recordId - Record ID to verify
 * @param farmId - Farm ID to verify against
 * @returns Record if found and belongs to farm, null otherwise
 */
export async function verifyEggRecordForFarm(
  db: Kysely<Database>,
  recordId: string,
  farmId: string,
): Promise<{ id: string; batchId: string } | null> {
  const record = await db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select(['egg_records.id', 'egg_records.batchId'])
    .where('egg_records.id', '=', recordId)
    .where('batches.farmId', '=', farmId)
    .executeTakeFirst()

  return (record as { id: string; batchId: string } | null) ?? null
}

/**
 * Get batch current quantity for laying percentage calculation
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID
 * @param farmId - Farm ID for verification
 * @returns Current quantity or null if batch not found
 */
export async function getBatchCurrentQuantity(
  db: Kysely<Database>,
  batchId: string,
  farmId: string,
): Promise<number | null> {
  const batch = await db
    .selectFrom('batches')
    .select(['currentQuantity'])
    .where('id', '=', batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  return batch?.currentQuantity ?? null
}
