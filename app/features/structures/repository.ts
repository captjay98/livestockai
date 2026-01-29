/**
 * Database operations for structure management.
 * All functions are pure data access - no business logic.
 */

import { sql } from 'kysely'
import type { Kysely } from 'kysely'
import type { Database, StructureTable } from '~/lib/db/types'

/** Valid structure types from the database schema */
type StructureType = StructureTable['type']

/** Valid structure statuses from the database schema */
type StructureStatus = StructureTable['status']

/**
 * Data for inserting a new structure
 */
export interface StructureInsert {
  farmId: string
  name: string
  type: StructureType
  capacity: number | null
  areaSqm: string | null
  status: StructureStatus
  notes: string | null
}

/**
 * Data for updating a structure
 */
export interface StructureUpdate {
  name?: string
  type?: StructureType
  capacity?: number | null
  areaSqm?: string | null
  status?: StructureStatus
  notes?: string | null
}

/**
 * Structure with farm name
 */
export interface StructureWithFarmName {
  id: string
  farmId: string
  name: string
  type: string
  capacity: number | null
  areaSqm: string | null
  status: string
  notes: string | null
  createdAt: Date
  farmName: string | null
}

/**
 * Structure with batch counts and totals
 */
export interface StructureWithCounts {
  id: string
  farmId: string
  name: string
  type: string
  capacity: number | null
  areaSqm: string | null
  status: string
  notes: string | null
  createdAt: Date
  batchCount: number
  totalAnimals: number
}

/**
 * Filters for structure queries
 */
export interface StructureFilters {
  status?: string
  type?: string
}

/**
 * Insert a new structure into the database
 *
 * @param db - Kysely database instance
 * @param data - Structure data to insert
 * @returns The ID of the created structure
 *
 * @example
 * ```ts
 * const structureId = await insertStructure(db, {
 *   farmId: 'farm-1',
 *   name: 'House A',
 *   type: 'house',
 *   capacity: 1000,
 *   status: 'active'
 * })
 * ```
 */
export async function insertStructure(
  db: Kysely<Database>,
  data: StructureInsert,
): Promise<string> {
  const result = await db
    .insertInto('structures')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single structure by ID
 *
 * @param db - Kysely database instance
 * @param structureId - ID of the structure to retrieve
 * @returns The structure data or null if not found
 */
export async function getStructureById(
  db: Kysely<Database>,
  structureId: string,
): Promise<StructureWithFarmName | null> {
  const structure = await db
    .selectFrom('structures')
    .leftJoin('farms', 'farms.id', 'structures.farmId')
    .select([
      'structures.id',
      'structures.farmId',
      'structures.name',
      'structures.type',
      'structures.capacity',
      'structures.areaSqm',
      'structures.status',
      'structures.notes',
      'structures.createdAt',
      'farms.name as farmName',
    ])
    .where('structures.id', '=', structureId)
    .executeTakeFirst()

  return (structure as StructureWithFarmName | null) ?? null
}

/**
 * Get structures for a specific farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @returns Array of structures for the farm
 */
export async function getStructuresByFarm(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<StructureWithFarmName>> {
  return await db
    .selectFrom('structures')
    .leftJoin('farms', 'farms.id', 'structures.farmId')
    .select([
      'structures.id',
      'structures.farmId',
      'structures.name',
      'structures.type',
      'structures.capacity',
      'structures.areaSqm',
      'structures.status',
      'structures.notes',
      'structures.createdAt',
      'farms.name as farmName',
    ])
    .where('structures.farmId', '=', farmId)
    .orderBy('structures.name', 'asc')
    .execute()
}

/**
 * Get structures by type for a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param type - Structure type to filter by
 * @returns Array of structures of the specified type
 */
export async function getStructuresByType(
  db: Kysely<Database>,
  farmId: string,
  type: string,
): Promise<Array<StructureWithFarmName>> {
  return await db
    .selectFrom('structures')
    .leftJoin('farms', 'farms.id', 'structures.farmId')
    .select([
      'structures.id',
      'structures.farmId',
      'structures.name',
      'structures.type',
      'structures.capacity',
      'structures.areaSqm',
      'structures.status',
      'structures.notes',
      'structures.createdAt',
      'farms.name as farmName',
    ])
    .where('structures.farmId', '=', farmId)
    .where('structures.type', '=', type as StructureType)
    .orderBy('structures.name', 'asc')
    .execute()
}

/**
 * Get structure capacity info including batch counts
 *
 * @param db - Kysely database instance
 * @param structureId - ID of the structure
 * @returns Capacity info with batch counts or null if not found
 */
export async function getStructureCapacity(
  db: Kysely<Database>,
  structureId: string,
): Promise<{
  structureId: string
  capacity: number | null
  batchCount: number
  totalAnimals: number
} | null> {
  const result = await db
    .selectFrom('structures')
    .leftJoin('batches', (join) =>
      join
        .onRef('batches.structureId', '=', 'structures.id')
        .on('batches.status', '=', 'active'),
    )
    .select([
      'structures.id as structureId',
      'structures.capacity',
      sql<number>`count(batches.id)`.as('batchCount'),
      sql<number>`coalesce(sum(batches."currentQuantity"), 0)`.as(
        'totalAnimals',
      ),
    ])
    .where('structures.id', '=', structureId)
    .groupBy('structures.id')
    .executeTakeFirst()

  if (!result) {
    return null
  }

  return {
    structureId: result.structureId,
    capacity: result.capacity,
    batchCount: Number(result.batchCount),
    totalAnimals: Number(result.totalAnimals),
  }
}

/**
 * Update structure fields
 *
 * @param db - Kysely database instance
 * @param structureId - ID of the structure to update
 * @param data - Fields to update
 */
export async function updateStructure(
  db: Kysely<Database>,
  structureId: string,
  data: StructureUpdate,
): Promise<void> {
  await db
    .updateTable('structures')
    .set(data)
    .where('id', '=', structureId)
    .execute()
}

/**
 * Delete a structure by ID
 *
 * @param db - Kysely database instance
 * @param structureId - ID of the structure to delete
 */
export async function deleteStructure(
  db: Kysely<Database>,
  structureId: string,
): Promise<void> {
  await db.deleteFrom('structures').where('id', '=', structureId).execute()
}

/**
 * Get paginated structures with filters
 *
 * @param db - Kysely database instance
 * @param filters - Optional filters for status and type
 * @param farmId - Farm ID to filter by
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated result with structures
 */
export async function getStructuresPaginated(
  db: Kysely<Database>,
  farmId: string,
  filters?: StructureFilters,
  page = 1,
  pageSize = 20,
): Promise<{
  data: Array<StructureWithFarmName>
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  let baseQuery = db
    .selectFrom('structures')
    .leftJoin('farms', 'farms.id', 'structures.farmId')
    .select([
      'structures.id',
      'structures.farmId',
      'structures.name',
      'structures.type',
      'structures.capacity',
      'structures.areaSqm',
      'structures.status',
      'structures.notes',
      'structures.createdAt',
      'farms.name as farmName',
    ])
    .where('structures.farmId', '=', farmId)

  if (filters?.status) {
    baseQuery = baseQuery.where(
      'structures.status',
      '=',
      filters.status as StructureStatus,
    )
  }

  if (filters?.type) {
    baseQuery = baseQuery.where(
      'structures.type',
      '=',
      filters.type as StructureType,
    )
  }

  // Get total count
  const totalResult = await baseQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()
  const total = Number(totalResult?.count ?? 0)

  // Get paginated data
  const data = await baseQuery
    .orderBy('structures.name', 'asc')
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return {
    data: data as Array<StructureWithFarmName>,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get structures with batch counts for a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @returns Array of structures with batch and animal totals
 */
export async function getStructuresWithCounts(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<StructureWithCounts>> {
  const structures = await db
    .selectFrom('structures')
    .leftJoin('batches', (join) =>
      join
        .onRef('batches.structureId', '=', 'structures.id')
        .on('batches.status', '=', 'active'),
    )
    .select([
      'structures.id',
      'structures.farmId',
      'structures.name',
      'structures.type',
      'structures.capacity',
      'structures.areaSqm',
      'structures.status',
      'structures.notes',
      'structures.createdAt',
      sql<number>`count(batches.id)`.as('batchCount'),
      sql<number>`coalesce(sum(batches."currentQuantity"), 0)`.as(
        'totalAnimals',
      ),
    ])
    .where('structures.farmId', '=', farmId)
    .groupBy('structures.id')
    .orderBy('structures.name', 'asc')
    .execute()

  return structures.map((s) => ({
    ...s,
    batchCount: Number(s.batchCount),
    totalAnimals: Number(s.totalAnimals),
  })) as Array<StructureWithCounts>
}

/**
 * Check if structure has active batches
 *
 * @param db - Kysely database instance
 * @param structureId - ID of the structure
 * @returns Number of active batches assigned
 */
export async function countActiveBatches(
  db: Kysely<Database>,
  structureId: string,
): Promise<number> {
  const result = await db
    .selectFrom('batches')
    .select(sql<number>`count(*)`.as('count'))
    .where('structureId', '=', structureId)
    .where('status', '=', 'active')
    .executeTakeFirst()

  return Number(result?.count ?? 0)
}
