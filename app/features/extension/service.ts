/**
 * Pure business logic for extension operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Check if user is a member of a district
 *
 * @param db - Database instance
 * @param userId - User ID to check
 * @param districtId - District ID to check membership for
 * @returns True if user is assigned to the district
 */
export async function checkDistrictMembership(
    db: Kysely<Database>,
    userId: string,
    districtId: string,
): Promise<boolean> {
    const result = await db
        .selectFrom('user_districts')
        .select('userId')
        .where('userId', '=', userId)
        .where('districtId', '=', districtId)
        .executeTakeFirst()

    return !!result
}

/**
 * Check if user owns the farm for an access request
 *
 * @param db - Database instance
 * @param userId - User ID to check
 * @param requestId - Access request ID
 * @returns True if user owns the farm
 */
export async function checkFarmOwnership(
    db: Kysely<Database>,
    userId: string,
    requestId: string,
): Promise<boolean> {
    const result = await db
        .selectFrom('access_requests')
        .innerJoin('user_farms', 'user_farms.farmId', 'access_requests.farmId')
        .select('user_farms.userId')
        .where('access_requests.id', '=', requestId)
        .where('user_farms.userId', '=', userId)
        .where('user_farms.role', 'in', ['owner', 'manager'])
        .executeTakeFirst()

    return !!result
}

/**
 * Check if user owns the farm for an access grant
 *
 * @param db - Database instance
 * @param userId - User ID to check
 * @param grantId - Access grant ID
 * @returns True if user owns the farm
 */
export async function checkGrantOwnership(
    db: Kysely<Database>,
    userId: string,
    grantId: string,
): Promise<boolean> {
    const result = await db
        .selectFrom('access_grants')
        .innerJoin('user_farms', 'user_farms.farmId', 'access_grants.farmId')
        .select('user_farms.userId')
        .where('access_grants.id', '=', grantId)
        .where('user_farms.userId', '=', userId)
        .where('user_farms.role', 'in', ['owner', 'manager'])
        .executeTakeFirst()

    return !!result
}
