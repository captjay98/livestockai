/**
 * Database operations for regions management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Get all countries
 */
export async function getCountries(db: Kysely<Database>) {
  return await db
    .selectFrom('countries')
    .select(['id', 'code', 'name', 'localizedNames', 'createdAt'])
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Get regions by country ID
 */
export async function getRegionsByCountry(
  db: Kysely<Database>,
  countryId: string,
) {
  return await db
    .selectFrom('regions')
    .select([
      'id',
      'countryId',
      'parentId',
      'level',
      'name',
      'slug',
      'localizedNames',
      'isActive',
      'createdAt',
      'updatedAt',
    ])
    .where('countryId', '=', countryId)
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Get districts by region ID
 */
export async function getDistrictsByRegion(
  db: Kysely<Database>,
  regionId: string,
) {
  return await db
    .selectFrom('regions')
    .select([
      'id',
      'countryId',
      'parentId',
      'level',
      'name',
      'slug',
      'localizedNames',
      'isActive',
      'createdAt',
      'updatedAt',
    ])
    .where('parentId', '=', regionId)
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Get region by ID
 */
export async function getRegionById(db: Kysely<Database>, id: string) {
  return await db
    .selectFrom('regions')
    .select([
      'id',
      'countryId',
      'parentId',
      'level',
      'name',
      'slug',
      'localizedNames',
      'isActive',
      'createdAt',
      'updatedAt',
    ])
    .where('id', '=', id)
    .executeTakeFirst()
}

/**
 * Create new region
 */
export async function createRegion(
  db: Kysely<Database>,
  data: {
    name: string
    slug: string
    level: 1 | 2
    countryId: string
    parentId?: string | null
    localizedNames?: Record<string, string>
  },
) {
  const result = await db
    .insertInto('regions')
    .values({
      name: data.name,
      slug: data.slug,
      level: data.level,
      countryId: data.countryId,
      parentId: data.parentId ?? null,
      localizedNames: (data.localizedNames ?? {}) as any,
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Update region
 */
export async function updateRegion(
  db: Kysely<Database>,
  id: string,
  data: {
    name?: string
    slug?: string
    localizedNames?: Record<string, string>
  },
) {
  await db
    .updateTable('regions')
    .set(data as any)
    .where('id', '=', id)
    .execute()
}

/**
 * Delete region
 */
export async function deleteRegion(db: Kysely<Database>, id: string) {
  await db.deleteFrom('regions').where('id', '=', id).execute()
}

/**
 * Check if region has child regions
 */
export async function hasChildRegions(
  db: Kysely<Database>,
  id: string,
): Promise<boolean> {
  const result = await db
    .selectFrom('regions')
    .select('id')
    .where('parentId', '=', id)
    .limit(1)
    .executeTakeFirst()
  return !!result
}

/**
 * Check if region has farm assignments
 */
export async function hasFarmAssignments(
  db: Kysely<Database>,
  id: string,
): Promise<boolean> {
  const result = await db
    .selectFrom('user_districts')
    .select('userId')
    .where('districtId', '=', id)
    .limit(1)
    .executeTakeFirst()
  return !!result
}
