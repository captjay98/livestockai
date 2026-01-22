/**
 * Database operations for farm management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database, FarmRole } from '~/lib/db/types'

/**
 * Data for inserting a new farm
 */
export interface FarmInsert {
  name: string
  location: string
  type:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
}

/**
 * Data for updating a farm
 */
export interface FarmUpdate {
  name?: string
  location?: string
  type?:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
}

/**
 * Farm with role from user_farms join
 */
export interface FarmWithRole {
  id: string
  name: string
  location: string
  type: string
  farmRole: FarmRole
}

/**
 * Farm member with user details
 */
export interface FarmMember {
  id: string
  name: string
  email: string
  globalRole: 'admin' | 'user'
  farmRole: FarmRole
}

/**
 * Farm statistics
 */
export interface FarmStats {
  batches: {
    total: number
    active: number
    totalLivestock: number
  }
  sales: {
    count: number
    revenue: number
  }
  expenses: {
    count: number
    amount: number
  }
}

/**
 * Farm record type
 */
export interface FarmRecord {
  id: string
  name: string
  location: string
  type: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Insert a new farm into the database
 *
 * @param db - Kysely database instance
 * @param data - Farm data to insert
 * @returns The ID of the created farm
 *
 * @example
 * ```ts
 * const farmId = await insertFarm(db, {
 *   name: 'Green Acres',
 *   location: 'Nigeria',
 *   type: 'poultry'
 * })
 * ```
 */
export async function insertFarm(
  db: Kysely<Database>,
  data: FarmInsert,
): Promise<string> {
  const result = await db
    .insertInto('farms')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Assign a user to a farm with a specific role
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param role - Role to assign
 */
export async function assignUserToFarm(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
  role: FarmRole,
): Promise<void> {
  await db
    .insertInto('user_farms')
    .values({
      userId,
      farmId,
      role,
    })
    .execute()
}

/**
 * Get all farms in the system
 *
 * @param db - Kysely database instance
 * @returns Array of all farms
 */
export async function getAllFarms(
  db: Kysely<Database>,
): Promise<Array<FarmRecord>> {
  return await db
    .selectFrom('farms')
    .select(['id', 'name', 'location', 'type', 'createdAt', 'updatedAt'])
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Get farms by their IDs
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of farms
 */
export async function getFarmsByIds(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<FarmRecord>> {
  if (farmIds.length === 0) {
    return []
  }

  return await db
    .selectFrom('farms')
    .select(['id', 'name', 'location', 'type', 'createdAt', 'updatedAt'])
    .where('id', 'in', farmIds)
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Get a single farm by ID
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm to retrieve
 * @returns The farm data or null if not found
 */
export async function getFarmById(
  db: Kysely<Database>,
  farmId: string,
): Promise<FarmRecord | null> {
  const farm = await db
    .selectFrom('farms')
    .select(['id', 'name', 'location', 'type', 'createdAt', 'updatedAt'])
    .where('id', '=', farmId)
    .executeTakeFirst()

  return farm ?? null
}

/**
 * Find a farm by its exact name
 *
 * @param db - Kysely database instance
 * @param name - Name of the farm to find
 * @returns The farm data or null if not found
 *
 * @example
 * ```ts
 * const farm = await findFarmByName(db, 'Green Acres')
 * ```
 */
export async function findFarmByName(
  db: Kysely<Database>,
  name: string,
): Promise<FarmRecord | null> {
  const farm = await db
    .selectFrom('farms')
    .select(['id', 'name', 'location', 'type', 'createdAt', 'updatedAt'])
    .where('name', '=', name)
    .executeTakeFirst()

  return farm ?? null
}

/**
 * Find farms by organization user ID (via user_farms assignments)
 * Returns all farms that a user has access to
 *
 * @param db - Kysely database instance
 * @param userId - User ID to check farm access for
 * @returns Array of farms the user has access to
 *
 * @example
 * ```ts
 * const farms = await findFarmsByOrganizationUserId(db, 'user-123')
 * ```
 */
export async function findFarmsByOrganizationUserId(
  db: Kysely<Database>,
  userId: string,
): Promise<Array<FarmRecord>> {
  return await db
    .selectFrom('farms')
    .select(['id', 'name', 'location', 'type', 'createdAt', 'updatedAt'])
    .innerJoin('user_farms', 'user_farms.farmId', 'farms.id')
    .where('user_farms.userId', '=', userId)
    .orderBy('farms.name', 'asc')
    .execute()
}

/**
 * Update a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm to update
 * @param data - Fields to update
 */
export async function updateFarm(
  db: Kysely<Database>,
  farmId: string,
  data: FarmUpdate,
): Promise<void> {
  await db.updateTable('farms').set(data).where('id', '=', farmId).execute()
}

/**
 * Delete a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm to delete
 */
export async function deleteFarm(
  db: Kysely<Database>,
  farmId: string,
): Promise<void> {
  await db.deleteFrom('farms').where('id', '=', farmId).execute()
}

/**
 * Delete all user farm assignments for a farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 */
export async function deleteUserFarmAssignments(
  db: Kysely<Database>,
  farmId: string,
): Promise<void> {
  await db.deleteFrom('user_farms').where('farmId', '=', farmId).execute()
}

/**
 * Check for dependent records that would prevent farm deletion
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm to check
 * @returns Object indicating presence of dependent records
 */
export async function checkFarmDependents(
  db: Kysely<Database>,
  farmId: string,
): Promise<{
  hasBatches: boolean
  hasSales: boolean
  hasExpenses: boolean
}> {
  const [batches, sales, expenses] = await Promise.all([
    db
      .selectFrom('batches')
      .select('id')
      .where('farmId', '=', farmId)
      .executeTakeFirst(),
    db
      .selectFrom('sales')
      .select('id')
      .where('farmId', '=', farmId)
      .executeTakeFirst(),
    db
      .selectFrom('expenses')
      .select('id')
      .where('farmId', '=', farmId)
      .executeTakeFirst(),
  ])

  return {
    hasBatches: !!batches,
    hasSales: !!sales,
    hasExpenses: !!expenses,
  }
}

/**
 * Get farm statistics including batch, sales, and expense data
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @returns Farm statistics object
 */
export async function getFarmStats(
  db: Kysely<Database>,
  farmId: string,
): Promise<FarmStats> {
  const [batchStats, salesStats, expenseStats] = await Promise.all([
    // Batch statistics
    db
      .selectFrom('batches')
      .select((eb) => [
        eb.fn.count('id').as('total_batches'),
        eb.fn.sum('currentQuantity').as('total_livestock'),
        eb.fn
          .count('id')
          .filterWhere('status', '=', 'active')
          .as('active_batches'),
      ])
      .where('farmId', '=', farmId)
      .executeTakeFirst(),

    // Sales statistics (last 30 days)
    db
      .selectFrom('sales')
      .select((eb) => [
        eb.fn.count('id').as('total_sales'),
        eb.fn.sum('totalAmount').as('total_revenue'),
      ])
      .where('farmId', '=', farmId)
      .where('date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .executeTakeFirst(),

    // Expense statistics (last 30 days)
    db
      .selectFrom('expenses')
      .select((eb) => [
        eb.fn.count('id').as('total_expenses'),
        eb.fn.sum('amount').as('total_amount'),
      ])
      .where('farmId', '=', farmId)
      .where('date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .executeTakeFirst(),
  ])

  return {
    batches: {
      total: Number(batchStats?.total_batches ?? 0),
      active: Number(batchStats?.active_batches ?? 0),
      totalLivestock: Number(batchStats?.total_livestock ?? 0),
    },
    sales: {
      count: Number(salesStats?.total_sales ?? 0),
      revenue: Number(salesStats?.total_revenue ?? 0),
    },
    expenses: {
      count: Number(expenseStats?.total_expenses ?? 0),
      amount: Number(expenseStats?.total_amount ?? 0),
    },
  }
}

/**
 * Check if a user exists
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user to check
 * @returns True if user exists, false otherwise
 */
export async function checkUserExists(
  db: Kysely<Database>,
  userId: string,
): Promise<boolean> {
  const user = await db
    .selectFrom('users')
    .select('id')
    .where('id', '=', userId)
    .executeTakeFirst()

  return !!user
}

/**
 * Check if a farm exists
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm to check
 * @returns True if farm exists, false otherwise
 */
export async function checkFarmExists(
  db: Kysely<Database>,
  farmId: string,
): Promise<boolean> {
  const farm = await db
    .selectFrom('farms')
    .select('id')
    .where('id', '=', farmId)
    .executeTakeFirst()

  return !!farm
}

/**
 * Insert or update a user's farm role assignment
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param role - Role to assign
 */
export async function upsertUserFarm(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
  role: FarmRole,
): Promise<void> {
  await db
    .insertInto('user_farms')
    .values({
      userId,
      farmId,
      role,
    })
    .onConflict((oc) => oc.columns(['userId', 'farmId']).doUpdateSet({ role }))
    .execute()
}

/**
 * Get a user's role for a specific farm
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @returns The user's role or null if not assigned
 */
export async function getUserFarmRole(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
): Promise<FarmRole | null> {
  const assignment = await db
    .selectFrom('user_farms')
    .select('role')
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  return assignment?.role ?? null
}

/**
 * Count other owners of a farm (excluding a specific user)
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param userId - User ID to exclude
 * @returns Number of other owners
 */
export async function countOtherOwners(
  db: Kysely<Database>,
  farmId: string,
  userId: string,
): Promise<number> {
  const result = await db
    .selectFrom('user_farms')
    .select((eb) => eb.fn.count('userId').as('count'))
    .where('farmId', '=', farmId)
    .where('role', '=', 'owner')
    .where('userId', '!=', userId)
    .executeTakeFirst()

  return Number(result?.count ?? 0)
}

/**
 * Delete a user's farm assignment
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 */
export async function deleteUserFarm(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
): Promise<void> {
  await db
    .deleteFrom('user_farms')
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .execute()
}

/**
 * Update a user's farm role
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param role - New role
 */
export async function updateUserFarmRole(
  db: Kysely<Database>,
  userId: string,
  farmId: string,
  role: FarmRole,
): Promise<void> {
  await db
    .updateTable('user_farms')
    .set({ role })
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .execute()
}

/**
 * Get all members of a farm with their roles
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @returns Array of farm members
 */
export async function getFarmMembers(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<FarmMember>> {
  return await db
    .selectFrom('user_farms')
    .innerJoin('users', 'users.id', 'user_farms.userId')
    .select([
      'users.id',
      'users.name',
      'users.email',
      'users.role as globalRole',
      'user_farms.role as farmRole',
    ])
    .where('user_farms.farmId', '=', farmId)
    .orderBy('user_farms.role', 'asc')
    .execute()
}

/**
 * Check if a user is an admin
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @returns True if user is admin, false otherwise
 */
export async function getIsAdmin(
  db: Kysely<Database>,
  userId: string,
): Promise<boolean> {
  const user = await db
    .selectFrom('users')
    .select('role')
    .where('id', '=', userId)
    .executeTakeFirst()

  return user?.role === 'admin'
}

/**
 * Get farms with roles for a user
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @returns Array of farms with user's role
 */
export async function getUserFarmsWithRoles(
  db: Kysely<Database>,
  userId: string,
): Promise<Array<FarmWithRole>> {
  return await db
    .selectFrom('user_farms')
    .innerJoin('farms', 'farms.id', 'user_farms.farmId')
    .select([
      'farms.id',
      'farms.name',
      'farms.location',
      'farms.type',
      'user_farms.role as farmRole',
    ])
    .where('user_farms.userId', '=', userId)
    .orderBy('farms.name', 'asc')
    .execute()
}
