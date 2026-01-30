/**
 * Repository layer for supplies inventory - Database operations only
 */

import { sql } from 'kysely'
import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { SupplyCategory } from './supplies-service'

export interface SupplyItem {
  id: string
  farmId: string
  itemName: string
  category: SupplyCategory
  quantityKg: string
  unit: string
  minThresholdKg: string
  costPerUnit: string | null
  supplierId: string | null
  lastRestocked: Date | null
  expiryDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SupplyInsert {
  farmId: string
  itemName: string
  category:
    | 'disinfectant'
    | 'bedding'
    | 'chemical'
    | 'pest_control'
    | 'fuel'
    | 'packaging'
  quantityKg: string
  unit: 'kg' | 'liters' | 'pieces' | 'bags'
  minThresholdKg: string
  costPerUnit?: string | null
  supplierId?: string | null
  lastRestocked?: Date | null
  expiryDate?: Date | null
  notes?: string | null
}

export interface SupplyUpdate {
  itemName?: string
  category?:
    | 'disinfectant'
    | 'bedding'
    | 'chemical'
    | 'pest_control'
    | 'fuel'
    | 'packaging'
  quantityKg?: string
  unit?: 'kg' | 'liters' | 'pieces' | 'bags'
  minThresholdKg?: string
  costPerUnit?: string | null
  supplierId?: string | null
  lastRestocked?: Date | null
  expiryDate?: Date | null
  notes?: string | null
}

/**
 * Get all supplies for a farm
 */
export async function getSuppliesByFarm(
  db: Kysely<Database>,
  farmId: string,
  category?: SupplyCategory,
): Promise<Array<SupplyItem>> {
  let query = db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .orderBy('itemName', 'asc')

  if (category) {
    query = query.where('category', '=', category)
  }

  return query.execute()
}

/**
 * Get supply by ID
 */
export async function getSupplyById(
  db: Kysely<Database>,
  id: string,
): Promise<SupplyItem | undefined> {
  return db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}

/**
 * Get low stock supplies for a farm
 */
export async function getLowStockSupplies(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<SupplyItem>> {
  return db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .where(
      sql<boolean>`CAST("quantityKg" AS decimal) <= CAST("minThresholdKg" AS decimal)`,
    )
    .orderBy('quantityKg', 'asc')
    .execute()
}

/**
 * Get expiring supplies for a farm
 */
export async function getExpiringSupplies(
  db: Kysely<Database>,
  farmId: string,
  daysAhead: number,
): Promise<Array<SupplyItem>> {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return db
    .selectFrom('supplies_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .where('expiryDate', 'is not', null)
    .where('expiryDate', '>', new Date())
    .where('expiryDate', '<=', futureDate)
    .orderBy('expiryDate', 'asc')
    .execute()
}

/**
 * Create a new supply item
 */
export async function createSupply(
  db: Kysely<Database>,
  data: SupplyInsert,
): Promise<string> {
  const result = await db
    .insertInto('supplies_inventory')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Update a supply item
 */
export async function updateSupply(
  db: Kysely<Database>,
  id: string,
  data: SupplyUpdate,
): Promise<void> {
  await db
    .updateTable('supplies_inventory')
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

/**
 * Delete a supply item
 */
export async function deleteSupply(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db.deleteFrom('supplies_inventory').where('id', '=', id).execute()
}

/**
 * Add stock to a supply item (atomic)
 */
export async function addStock(
  db: Kysely<Database>,
  supplyId: string,
  quantity: number,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    const current = await trx
      .selectFrom('supplies_inventory')
      .select('quantityKg')
      .where('id', '=', supplyId)
      .executeTakeFirstOrThrow()

    // Use integer arithmetic to avoid floating-point precision loss
    // Convert to grams (integer), add, then convert back to kg
    const currentGrams = Math.round(parseFloat(current.quantityKg) * 1000)
    const addGrams = Math.round(quantity * 1000)
    const newGrams = currentGrams + addGrams
    const newQuantity = (newGrams / 1000).toFixed(2)

    await trx
      .updateTable('supplies_inventory')
      .set({
        quantityKg: newQuantity,
        lastRestocked: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', supplyId)
      .execute()
  })
}

/**
 * Reduce stock from a supply item (atomic)
 */
export async function reduceStock(
  db: Kysely<Database>,
  supplyId: string,
  quantity: number,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    const current = await trx
      .selectFrom('supplies_inventory')
      .select('quantityKg')
      .where('id', '=', supplyId)
      .executeTakeFirstOrThrow()

    // Use integer arithmetic to avoid floating-point precision loss
    // Convert to grams (integer), subtract, then convert back to kg
    const currentGrams = Math.round(parseFloat(current.quantityKg) * 1000)
    const subtractGrams = Math.round(quantity * 1000)
    const newGrams = currentGrams - subtractGrams
    const newQuantity = (newGrams / 1000).toFixed(2)

    await trx
      .updateTable('supplies_inventory')
      .set({
        quantityKg: newQuantity,
        updatedAt: new Date(),
      })
      .where('id', '=', supplyId)
      .execute()
  })
}
