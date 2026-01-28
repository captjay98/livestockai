/**
 * Database operations for user district assignments.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Assign user to district
 */
export async function assignUserToDistrict(
    db: Kysely<Database>,
    userId: string,
    districtId: string,
    assignedBy: string,
    supervisor: boolean = false,
) {
    await db
        .insertInto('user_districts')
        .values({
            userId,
            districtId,
            assignedBy,
            isSupervisor: supervisor,
        })
        .execute()
}

/**
 * Remove user from district
 */
export async function removeUserFromDistrict(
    db: Kysely<Database>,
    userId: string,
    districtId: string,
) {
    await db
        .deleteFrom('user_districts')
        .where('userId', '=', userId)
        .where('districtId', '=', districtId)
        .execute()
}

/**
 * Get districts assigned to user
 */
export async function getUserDistricts(db: Kysely<Database>, userId: string) {
    return await db
        .selectFrom('user_districts')
        .leftJoin('regions', 'regions.id', 'user_districts.districtId')
        .select([
            'user_districts.districtId',
            'user_districts.isSupervisor',
            'user_districts.assignedAt',
            'regions.name as districtName',
            'regions.slug as districtSlug',
            'regions.level as districtLevel',
        ])
        .where('user_districts.userId', '=', userId)
        .execute()
}

/**
 * Get users assigned to district
 */
export async function getDistrictUsers(
    db: Kysely<Database>,
    districtId: string,
) {
    return await db
        .selectFrom('user_districts')
        .leftJoin('users', 'users.id', 'user_districts.userId')
        .select([
            'user_districts.userId',
            'user_districts.isSupervisor',
            'user_districts.assignedAt',
            'users.name as userName',
            'users.email as userEmail',
        ])
        .where('user_districts.districtId', '=', districtId)
        .execute()
}

/**
 * Check if user is supervisor for district
 */
export async function isSupervisor(
    db: Kysely<Database>,
    userId: string,
    districtId: string,
): Promise<boolean> {
    const result = await db
        .selectFrom('user_districts')
        .select('isSupervisor')
        .where('userId', '=', userId)
        .where('districtId', '=', districtId)
        .executeTakeFirst()
    return result?.isSupervisor ?? false
}
