/**
 * Database operations for module management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { FarmModule, LivestockType, ModuleKey } from './types'

/**
 * Retrieve all module records for a farm.
 */
export async function selectFarmModules(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<FarmModule>> {
  const modules = await db
    .selectFrom('farm_modules')
    .selectAll()
    .where('farmId', '=', farmId)
    .execute()

  return modules.map((m) => ({
    ...m,
    createdAt: new Date(m.createdAt),
  }))
}

/**
 * Retrieve a single module record for a farm.
 */
export async function selectFarmModule(
  db: Kysely<Database>,
  farmId: string,
  moduleKey: ModuleKey,
): Promise<FarmModule | undefined> {
  return await db
    .selectFrom('farm_modules')
    .selectAll()
    .where('farmId', '=', farmId)
    .where('moduleKey', '=', moduleKey)
    .executeTakeFirst()
}

/**
 * Insert default modules for a new farm.
 */
export async function insertFarmModules(
  db: Kysely<Database>,
  modules: Array<{ farmId: string; moduleKey: ModuleKey; enabled: boolean }>,
): Promise<void> {
  if (modules.length === 0) return

  await db.insertInto('farm_modules').values(modules).execute()
}

/**
 * Upsert a module record (insert or update based on existence).
 */
export async function upsertFarmModule(
  db: Kysely<Database>,
  farmId: string,
  moduleKey: ModuleKey,
  enabled: boolean,
): Promise<void> {
  await db
    .insertInto('farm_modules')
    .values({ farmId, moduleKey, enabled })
    .onConflict((oc) =>
      oc.column('farmId').column('moduleKey').doUpdateSet({ enabled }),
    )
    .execute()
}

/**
 * Update a module's enabled status.
 */
export async function updateFarmModule(
  db: Kysely<Database>,
  farmId: string,
  moduleKey: ModuleKey,
  enabled: boolean,
): Promise<void> {
  await db
    .updateTable('farm_modules')
    .set({ enabled })
    .where('farmId', '=', farmId)
    .where('moduleKey', '=', moduleKey)
    .execute()
}

/**
 * Check if a module record exists for a farm.
 */
export async function existsFarmModule(
  db: Kysely<Database>,
  farmId: string,
  moduleKey: ModuleKey,
): Promise<boolean> {
  const result = await db
    .selectFrom('farm_modules')
    .select('id')
    .where('farmId', '=', farmId)
    .where('moduleKey', '=', moduleKey)
    .executeTakeFirst()

  return result !== undefined
}

/**
 * Count active batches for specific livestock types in a farm.
 */
export async function countActiveBatchesByLivestockTypes(
  db: Kysely<Database>,
  farmId: string,
  livestockTypes: ReadonlyArray<LivestockType>,
): Promise<number> {
  if (livestockTypes.length === 0) {
    return 0
  }

  const result = await db
    .selectFrom('batches')
    .select((eb) => eb.fn.count<number>('id').as('count'))
    .where('farmId', '=', farmId)
    .where('status', '=', 'active')
    .where('livestockType', 'in', livestockTypes)
    .executeTakeFirst()

  return Number(result?.count || 0)
}
