/**
 * Database operations for breeds
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { Breed, BreedSeedData, ModuleKey } from './types'

export async function getAllBreeds(
  db: Kysely<Database>,
): Promise<Array<Breed>> {
  return db
    .selectFrom('breeds')
    .select([
      'id',
      'moduleKey',
      'speciesKey',
      'breedName',
      'displayName',
      'typicalMarketWeightG',
      'typicalDaysToMarket',
      'typicalFcr',
      'sourceSizes',
      'regions',
      'isDefault',
      'isActive',
      'createdAt',
    ])
    .where('isActive', '=', true)
    .orderBy('displayName', 'asc')
    .execute()
}

export async function getBreedsByModule(
  db: Kysely<Database>,
  moduleKey: ModuleKey,
): Promise<Array<Breed>> {
  return db
    .selectFrom('breeds')
    .select([
      'id',
      'moduleKey',
      'speciesKey',
      'breedName',
      'displayName',
      'typicalMarketWeightG',
      'typicalDaysToMarket',
      'typicalFcr',
      'sourceSizes',
      'regions',
      'isDefault',
      'isActive',
      'createdAt',
    ])
    .where('moduleKey', '=', moduleKey)
    .where('isActive', '=', true)
    .orderBy('displayName', 'asc')
    .execute()
}

export async function getBreedsBySpecies(
  db: Kysely<Database>,
  speciesKey: string,
): Promise<Array<Breed>> {
  return db
    .selectFrom('breeds')
    .select([
      'id',
      'moduleKey',
      'speciesKey',
      'breedName',
      'displayName',
      'typicalMarketWeightG',
      'typicalDaysToMarket',
      'typicalFcr',
      'sourceSizes',
      'regions',
      'isDefault',
      'isActive',
      'createdAt',
    ])
    .where('speciesKey', '=', speciesKey)
    .where('isActive', '=', true)
    .orderBy('displayName', 'asc')
    .execute()
}

export async function getBreedById(
  db: Kysely<Database>,
  id: string,
): Promise<Breed | undefined> {
  return db
    .selectFrom('breeds')
    .select([
      'id',
      'moduleKey',
      'speciesKey',
      'breedName',
      'displayName',
      'typicalMarketWeightG',
      'typicalDaysToMarket',
      'typicalFcr',
      'sourceSizes',
      'regions',
      'isDefault',
      'isActive',
      'createdAt',
    ])
    .where('id', '=', id)
    .executeTakeFirst()
}

export async function getDefaultBreedForSpecies(
  db: Kysely<Database>,
  speciesKey: string,
): Promise<Breed | undefined> {
  return db
    .selectFrom('breeds')
    .select([
      'id',
      'moduleKey',
      'speciesKey',
      'breedName',
      'displayName',
      'typicalMarketWeightG',
      'typicalDaysToMarket',
      'typicalFcr',
      'sourceSizes',
      'regions',
      'isDefault',
      'isActive',
      'createdAt',
    ])
    .where('speciesKey', '=', speciesKey)
    .where('isDefault', '=', true)
    .where('isActive', '=', true)
    .executeTakeFirst()
}

export async function insertBreed(
  db: Kysely<Database>,
  data: BreedSeedData,
): Promise<string> {
  const result = await db
    .insertInto('breeds')
    .values({
      ...data,
      isActive: true,
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get unique species for a module
 * Returns distinct speciesKey values with labels derived from the key
 */
export async function getSpeciesForModule(
  db: Kysely<Database>,
  moduleKey: ModuleKey,
): Promise<Array<{ value: string; label: string }>> {
  const results = await db
    .selectFrom('breeds')
    .select('speciesKey')
    .distinct()
    .where('moduleKey', '=', moduleKey)
    .where('isActive', '=', true)
    .orderBy('speciesKey', 'asc')
    .execute()

  return results.map((r) => ({
    value: r.speciesKey,
    label: r.speciesKey, // speciesKey is already Title Case (e.g., "Broiler")
  }))
}

/**
 * Get unique species for a livestock type
 * Maps livestock type to module key and returns species
 */
export async function getSpeciesForLivestockType(
  db: Kysely<Database>,
  livestockType: string,
): Promise<Array<{ value: string; label: string }>> {
  // Map livestock type to module key
  const moduleKeyMap: Partial<Record<string, ModuleKey>> = {
    poultry: 'poultry',
    fish: 'aquaculture',
    cattle: 'cattle',
    goats: 'goats',
    sheep: 'sheep',
    bees: 'bees',
  }

  const moduleKey = moduleKeyMap[livestockType]
  if (!moduleKey) {
    return []
  }

  return getSpeciesForModule(db, moduleKey)
}
