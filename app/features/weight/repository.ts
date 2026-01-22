/**
 * Database operations for weight sample management.
 * All functions are pure data access - no business logic.
 */

import { sql } from 'kysely'
import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

/**
 * Data for inserting a new weight sample record
 */
export interface WeightSampleInsert {
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: string
  minWeightKg?: string | null
  maxWeightKg?: string | null
  notes?: string | null
}

/**
 * Data for updating a weight sample record
 */
export interface WeightSampleUpdate {
  date?: Date
  sampleSize?: number
  averageWeightKg?: string
  minWeightKg?: string | null
  maxWeightKg?: string | null
  notes?: string | null
}

/**
 * Weight sample record with batch information
 */
export interface WeightSampleRecord {
  id: string
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: string
  minWeightKg: string | null
  maxWeightKg: string | null
  notes: string | null
  createdAt: Date
}

/**
 * Extended record with all related data for display
 */
export interface WeightSampleWithDetails extends WeightSampleRecord {
  batchSpecies?: string
  livestockType?: string
  farmId?: string
  farmName?: string
}

/**
 * Filters for weight sample queries
 */
export interface WeightSampleFilters extends BasePaginatedQuery {
  batchId?: string
  startDate?: Date
  endDate?: Date
}

/**
 * Paginated weight records result
 */
export interface WeightPaginatedResult extends PaginatedResult<WeightSampleWithDetails> {}

/**
 * Insert a new weight sample record
 *
 * @param db - Kysely database instance
 * @param data - Weight sample data to insert
 * @returns The ID of the created record
 */
export async function insertWeightSample(
  db: Kysely<Database>,
  data: WeightSampleInsert,
): Promise<string> {
  const result = await db
    .insertInto('weight_samples')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single weight sample record by ID
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the record to retrieve
 * @returns The record with batch and farm details, or null if not found
 */
export async function getWeightSampleById(
  db: Kysely<Database>,
  recordId: string,
): Promise<WeightSampleWithDetails | null> {
  const record = await db
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
      'batches.species as batchSpecies',
      'batches.livestockType',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('weight_samples.id', '=', recordId)
    .executeTakeFirst()

  return (record as WeightSampleWithDetails | null) ?? null
}

/**
 * Update a weight sample record
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the record to update
 * @param data - Fields to update
 * @returns Promise resolving when update is complete
 */
export async function updateWeightSample(
  db: Kysely<Database>,
  recordId: string,
  data: WeightSampleUpdate,
): Promise<void> {
  await db
    .updateTable('weight_samples')
    .set(data)
    .where('id', '=', recordId)
    .execute()
}

/**
 * Delete a weight sample record
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the record to delete
 * @returns Promise resolving when delete is complete
 */
export async function deleteWeightSample(
  db: Kysely<Database>,
  recordId: string,
): Promise<void> {
  await db.deleteFrom('weight_samples').where('id', '=', recordId).execute()
}

/**
 * Get all weight samples for a specific batch
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Array of weight sample records ordered by date ascending
 */
export async function getWeightSamplesByBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<WeightSampleRecord>> {
  const records = await db
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
    .orderBy('weight_samples.date', 'asc')
    .execute()

  return records as Array<WeightSampleRecord>
}

/**
 * Get all weight samples for a specific farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param options - Optional date range filters
 * @returns Array of weight sample records with batch and farm details
 */
export async function getWeightSamplesByFarm(
  db: Kysely<Database>,
  farmId: string,
  options?: { startDate?: Date; endDate?: Date },
): Promise<Array<WeightSampleWithDetails>> {
  let query = db
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
      'batches.species as batchSpecies',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', '=', farmId)

  if (options?.startDate) {
    query = query.where('weight_samples.date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('weight_samples.date', '<=', options.endDate)
  }

  const records = await query.orderBy('weight_samples.date', 'desc').execute()

  return records as Array<WeightSampleWithDetails>
}

/**
 * Get paginated weight records for multiple farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @param filters - Query parameters for filtering and pagination
 * @returns Paginated result with weight records
 */
export async function getWeightSamplesPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters: WeightSampleFilters,
): Promise<WeightPaginatedResult> {
  const page = filters.page || 1
  const pageSize = filters.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', farmIds)

  if (filters.search) {
    const searchLower = `%${filters.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([eb('batches.species', 'ilike', searchLower)]),
    )
  }

  if (filters.batchId) {
    baseQuery = baseQuery.where('weight_samples.batchId', '=', filters.batchId)
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
      'weight_samples.id',
      'weight_samples.batchId',
      'weight_samples.date',
      'weight_samples.sampleSize',
      'weight_samples.averageWeightKg',
      'weight_samples.minWeightKg',
      'weight_samples.maxWeightKg',
      'weight_samples.notes',
      'weight_samples.createdAt',
      'batches.species as batchSpecies',
      'batches.livestockType',
      'farms.name as farmName',
      'batches.farmId',
    ])
    .limit(pageSize)
    .offset(offset)

  if (filters.sortBy) {
    const sortOrder = filters.sortOrder || 'desc'
    let sortCol = `weight_samples.${filters.sortBy}`
    if (filters.sortBy === 'species') sortCol = 'batches.species'
    dataQuery = dataQuery.orderBy(sql.raw(sortCol), sortOrder)
  } else {
    dataQuery = dataQuery.orderBy('weight_samples.date', 'desc')
  }

  const data = await dataQuery.execute()

  return {
    data: data as Array<WeightSampleWithDetails>,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Verify a weight sample belongs to a specific farm
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the weight sample record
 * @param farmId - ID of the farm to verify against
 * @returns The record ID and batch ID if verified, null otherwise
 */
export async function verifyWeightSampleForFarm(
  db: Kysely<Database>,
  recordId: string,
  farmId: string,
): Promise<{ id: string; batchId: string } | null> {
  const record = await db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select(['weight_samples.id', 'weight_samples.batchId'])
    .where('weight_samples.id', '=', recordId)
    .where('batches.farmId', '=', farmId)
    .executeTakeFirst()

  return (record as { id: string; batchId: string } | null) ?? null
}

/**
 * Get a batch and verify it belongs to a specific farm
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @param farmId - ID of the farm to verify against
 * @returns Batch info if verified, null otherwise
 */
export async function getBatchForWeightRecord(
  db: Kysely<Database>,
  batchId: string,
  farmId: string,
): Promise<{ id: string; farmId: string; livestockType: string } | null> {
  const record = await db
    .selectFrom('batches')
    .select(['id', 'farmId', 'livestockType'])
    .where('id', '=', batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  return (
    (record as { id: string; farmId: string; livestockType: string } | null) ??
    null
  )
}

/**
 * Get all active batches for growth alert calculation
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @returns Array of active batches with farm info
 */
export async function getActiveBatchesForAlerts(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<
  Array<{
    id: string
    species: string
    livestockType: string
    acquisitionDate: Date
    farmId: string
    farmName: string | null
  }>
> {
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
    .where('batches.farmId', 'in', farmIds)
    .where('status', '=', 'active')
    .execute()

  return batches as Array<{
    id: string
    species: string
    livestockType: string
    acquisitionDate: Date
    farmId: string
    farmName: string | null
  }>
}
