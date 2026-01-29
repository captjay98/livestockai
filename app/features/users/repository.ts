/**
 * Database operations for user management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * User record type for repository functions
 */
export interface UserRecord {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  banned: boolean
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
}

/**
 * User with farm assignments
 */
export interface UserWithFarms extends UserRecord {
  farmAssignments: Array<{
    farmId: string
    role: 'owner' | 'manager' | 'viewer'
    farmName: string
  }>
}

/**
 * Farm role type
 */
type FarmRole = 'owner' | 'manager' | 'viewer' | 'worker' | 'observer'

/**
 * Retrieve all users (admin listing)
 */
export async function selectAllUsers(
  db: Kysely<Database>,
): Promise<Array<Omit<UserRecord, 'banExpires'>>> {
  return await db
    .selectFrom('users')
    .select([
      'id',
      'name',
      'email',
      'role',
      'banned',
      'banReason',
      'banExpires',
      'createdAt',
    ])
    .orderBy('createdAt', 'desc')
    .execute()
}

/**
 * Retrieve a user by ID
 */
export async function selectUserById(
  db: Kysely<Database>,
  userId: string,
): Promise<UserRecord | undefined> {
  return await db
    .selectFrom('users')
    .select([
      'id',
      'name',
      'email',
      'role',
      'banned',
      'banReason',
      'banExpires',
      'createdAt',
    ])
    .where('id', '=', userId)
    .executeTakeFirst()
}

/**
 * Retrieve user's farm assignments with farm names
 */
export async function selectUserFarmAssignments(
  db: Kysely<Database>,
  userId: string,
): Promise<Array<{ farmId: string; role: FarmRole; farmName: string }>> {
  return await db
    .selectFrom('user_farms')
    .innerJoin('farms', 'farms.id', 'user_farms.farmId')
    .select(['user_farms.farmId', 'user_farms.role', 'farms.name as farmName'])
    .where('user_farms.userId', '=', userId)
    .execute()
}

/**
 * Check if a user exists by email
 */
export async function selectUserByEmail(
  db: Kysely<Database>,
  email: string,
): Promise<{ id: string } | undefined> {
  return await db
    .selectFrom('users')
    .select(['id'])
    .where('email', '=', email)
    .executeTakeFirst()
}

/**
 * Ban a user
 */
export async function updateUserBan(
  db: Kysely<Database>,
  userId: string,
  banned: boolean,
  banReason: string | null,
  banExpires: Date | null,
): Promise<void> {
  await db
    .updateTable('users')
    .set({
      banned,
      banReason,
      banExpires,
    })
    .where('id', '=', userId)
    .execute()
}

/**
 * Update user role
 */
export async function updateUserRoleById(
  db: Kysely<Database>,
  userId: string,
  role: 'admin' | 'user',
): Promise<void> {
  await db.updateTable('users').set({ role }).where('id', '=', userId).execute()
}

/**
 * Delete a user
 */
export async function deleteUser(
  db: Kysely<Database>,
  userId: string,
): Promise<void> {
  await db.deleteFrom('users').where('id', '=', userId).execute()
}

/**
 * Check if user is the last owner of a farm
 */
export async function selectFarmOwners(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<{ userId: string }>> {
  return await db
    .selectFrom('user_farms')
    .select(['userId'])
    .where('farmId', '=', farmId)
    .where('role', '=', 'owner')
    .execute()
}

/**
 * Get farms owned by a user
 */
export async function selectUserOwnedFarms(
  db: Kysely<Database>,
  userId: string,
): Promise<Array<{ farmId: string }>> {
  return await db
    .selectFrom('user_farms')
    .select(['farmId'])
    .where('userId', '=', userId)
    .where('role', '=', 'owner')
    .execute()
}
