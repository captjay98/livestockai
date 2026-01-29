/**
 * Database operations for sales management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { PaymentMethod, PaymentStatus, UnitType } from './server'

/**
 * Data for inserting a new sale
 */
export interface SaleInsert {
  farmId: string
  batchId: string | null
  customerId: string | null
  livestockType: 'poultry' | 'fish' | 'eggs'
  quantity: number
  unitPrice: string
  totalAmount: string
  date: Date
  notes: string | null
  unitType: UnitType | null
  ageWeeks: number | null
  averageWeightKg: string | null
  paymentStatus: PaymentStatus | null
  paymentMethod: PaymentMethod | null
}

/**
 * Data for updating a sale
 */
export interface SaleUpdate {
  quantity?: number
  unitPrice?: string
  totalAmount?: string
  date?: Date
  notes?: string | null
  unitType?: UnitType | null
  ageWeeks?: number | null
  averageWeightKg?: string | null
  paymentStatus?: PaymentStatus | null
  paymentMethod?: PaymentMethod | null
}

/**
 * Sale with joined data from related tables
 */
export type SaleWithJoins = {
  id: string
  farmId: string
  batchId: string | null
  customerId: string | null
  livestockType: string
  quantity: number
  unitPrice: string
  totalAmount: string
  date: Date
  notes: string | null
  unitType: string | null
  ageWeeks: number | null
  averageWeightKg: string | null
  paymentStatus: string | null
  paymentMethod: string | null
  createdAt: Date
  customerName: string | null
  batchSpecies: string | null
  farmName: string | null
}

/**
 * Batch data for quantity updates
 */
export interface BatchQuantityData {
  id: string
  currentQuantity: number
  farmId: string
}

/**
 * Result from batch query
 */
export interface BatchResult {
  id: string
  farmId: string
  currentQuantity: number
}

/**
 * Insert a new sale into the database
 *
 * @param db - Kysely database instance
 * @param data - Sale data to insert
 * @returns The ID of the created sale
 *
 * @example
 * ```ts
 * const saleId = await insertSale(db, {
 *   farmId: 'farm-1',
 *   livestockType: 'poultry',
 *   quantity: 50,
 *   unitPrice: '5.50',
 *   totalAmount: '275.00',
 *   date: new Date(),
 *   batchId: null,
 *   customerId: null,
 *   notes: null,
 *   unitType: 'bird',
 *   ageWeeks: null,
 *   averageWeightKg: null,
 *   paymentStatus: 'paid',
 *   paymentMethod: null
 * })
 * ```
 */
export async function insertSale(
  db: Kysely<Database>,
  data: SaleInsert,
): Promise<string> {
  const result = await db
    .insertInto('sales')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single sale by ID with joins
 *
 * @param db - Kysely database instance
 * @param saleId - ID of the sale to retrieve
 * @returns The sale data or null if not found
 */
export async function getSaleById(
  db: Kysely<Database>,
  saleId: string,
): Promise<SaleWithJoins | null> {
  const sale = await db
    .selectFrom('sales')
    .leftJoin('customers', 'customers.id', 'sales.customerId')
    .leftJoin('batches', 'batches.id', 'sales.batchId')
    .leftJoin('farms', 'farms.id', 'sales.farmId')
    .select([
      'sales.id',
      'sales.farmId',
      'sales.batchId',
      'sales.customerId',
      'sales.livestockType',
      'sales.quantity',
      'sales.unitPrice',
      'sales.totalAmount',
      'sales.date',
      'sales.notes',
      'sales.unitType',
      'sales.ageWeeks',
      'sales.averageWeightKg',
      'sales.paymentStatus',
      'sales.paymentMethod',
      'sales.createdAt',
      'customers.name as customerName',
      'batches.species as batchSpecies',
      'farms.name as farmName',
    ])
    .where('sales.id', '=', saleId)
    .executeTakeFirst()

  return (sale as SaleWithJoins | null) ?? null
}

/**
 * Get a batch by ID for quantity validation
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to retrieve
 * @returns The batch data or null if not found
 */
export async function getBatchById(
  db: Kysely<Database>,
  batchId: string,
): Promise<BatchQuantityData | null> {
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'currentQuantity', 'farmId'])
    .where('id', '=', batchId)
    .executeTakeFirst()

  return (batch as BatchQuantityData | null) ?? null
}

/**
 * Update batch quantity and status atomically
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch to update
 * @param subtractQuantity - Quantity to subtract
 */
export async function atomicDecrementBatchQuantity(
  db: Kysely<Database>,
  batchId: string,
  subtractQuantity: number,
): Promise<void> {
  const { sql } = await import('kysely')
  await db
    .updateTable('batches')
    .set((eb) => ({
      currentQuantity: eb('currentQuantity', '-', subtractQuantity),
      status: sql`CASE WHEN "currentQuantity" - ${subtractQuantity} <= 0 THEN 'sold' ELSE 'active' END`,
      updatedAt: new Date(),
    }))
    .where('id', '=', batchId)
    .execute()
}

/**
 * Delete a sale by ID
 *
 * @param db - Kysely database instance
 * @param saleId - ID of the sale to delete
 */
export async function deleteSale(
  db: Kysely<Database>,
  saleId: string,
): Promise<void> {
  await db.deleteFrom('sales').where('id', '=', saleId).execute()
}

/**
 * Update a sale
 *
 * @param db - Kysely database instance
 * @param saleId - ID of the sale to update
 * @param data - Fields to update
 */
export async function updateSale(
  db: Kysely<Database>,
  saleId: string,
  data: SaleUpdate,
): Promise<void> {
  await db.updateTable('sales').set(data).where('id', '=', saleId).execute()
}

/**
 * Get sales for a farm with optional filters
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @param filters - Optional filters
 * @returns Array of sales with joins
 */
export async function getSalesByFarm(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: {
    startDate?: Date
    endDate?: Date
    livestockType?: string
  },
): Promise<Array<SaleWithJoins>> {
  let query = db
    .selectFrom('sales')
    .leftJoin('customers', 'customers.id', 'sales.customerId')
    .leftJoin('batches', 'batches.id', 'sales.batchId')
    .leftJoin('farms', 'farms.id', 'sales.farmId')
    .select([
      'sales.id',
      'sales.farmId',
      'sales.batchId',
      'sales.customerId',
      'sales.livestockType',
      'sales.quantity',
      'sales.unitPrice',
      'sales.totalAmount',
      'sales.unitType',
      'sales.ageWeeks',
      'sales.averageWeightKg',
      'sales.paymentStatus',
      'sales.paymentMethod',
      'sales.date',
      'sales.notes',
      'sales.createdAt',
      'customers.name as customerName',
      'batches.species as batchSpecies',
      'farms.name as farmName',
    ])
    .where('sales.farmId', 'in', farmIds)

  if (filters?.startDate) {
    query = query.where('sales.date', '>=', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.where('sales.date', '<=', filters.endDate)
  }

  if (filters?.livestockType) {
    query = query.where(
      'sales.livestockType',
      '=',
      filters.livestockType as any,
    )
  }

  return (await query
    .orderBy('sales.date', 'desc')
    .execute()) as Array<SaleWithJoins>
}

/**
 * Get sales summary grouped by livestock type
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param filters - Optional date filters
 * @returns Array of summary rows
 */
export async function getSalesSummary(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<
  Array<{
    livestockType: 'poultry' | 'fish' | 'eggs'
    count: string
    totalQuantity: string
    totalRevenue: string
  }>
> {
  let query = db
    .selectFrom('sales')
    .select([
      'livestockType',
      (eb) => eb.fn.count('id').as('count'),
      (eb) => eb.fn.sum('quantity').as('totalQuantity'),
      (eb) => eb.fn.sum('totalAmount').as('totalRevenue'),
    ])
    .where('farmId', 'in', farmIds)
    .groupBy('livestockType')

  if (filters?.startDate) {
    query = query.where('date', '>=', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.where('date', '<=', filters.endDate)
  }

  return (await query.execute()) as Array<{
    livestockType: 'poultry' | 'fish' | 'eggs'
    count: string
    totalQuantity: string
    totalRevenue: string
  }>
}

/**
 * Get total revenue for farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param filters - Optional date filters
 * @returns Total revenue as string
 */
export async function getTotalRevenue(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<string> {
  let query = db
    .selectFrom('sales')
    .select((eb) => eb.fn.sum('totalAmount').as('total'))
    .where('farmId', 'in', farmIds)

  if (filters?.startDate) {
    query = query.where('date', '>=', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.where('date', '<=', filters.endDate)
  }

  const result = await query.executeTakeFirst()
  return (result?.total as string | null) ?? '0'
}

/**
 * Get paginated sales with filters
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param filters - Pagination and filter parameters
 * @returns Paginated result
 */
export async function getSalesPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    livestockType?: string
    paymentStatus?: string
    batchId?: string
  },
): Promise<{
  data: Array<SaleWithJoins>
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const { sql } = await import('kysely')

  const page = filters.page || 1
  const pageSize = filters.pageSize || 10
  const sortBy = filters.sortBy || 'date'
  const sortOrder = filters.sortOrder || 'desc'
  const search = filters.search || ''
  const livestockType = filters.livestockType
  const paymentStatus = filters.paymentStatus
  const batchId = filters.batchId

  // Build base query for count
  let countQuery = db
    .selectFrom('sales')
    .leftJoin('customers', 'customers.id', 'sales.customerId')
    .leftJoin('batches', 'batches.id', 'sales.batchId')
    .leftJoin('farms', 'farms.id', 'sales.farmId')
    .where('sales.farmId', 'in', farmIds)

  // Apply search filter
  if (search) {
    countQuery = countQuery.where((eb) =>
      eb.or([
        eb('customers.name', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
        eb('sales.notes', 'ilike', `%${search}%`),
      ]),
    )
  }

  // Apply type filter
  if (livestockType) {
    countQuery = countQuery.where(
      'sales.livestockType',
      '=',
      livestockType as any,
    )
  }

  // Apply payment status filter
  if (paymentStatus) {
    countQuery = countQuery.where(
      'sales.paymentStatus',
      '=',
      paymentStatus as any,
    )
  }

  // Apply batchId filter
  if (batchId) {
    countQuery = countQuery.where('sales.batchId', '=', batchId)
  }

  // Get total count
  const countResult = await countQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()
  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Apply sorting - use type-safe column reference
  type SortableColumn =
    | 'sales.totalAmount'
    | 'sales.quantity'
    | 'customers.name'
    | 'sales.livestockType'
    | 'sales.date'

  const sortColumn: SortableColumn =
    sortBy === 'totalAmount'
      ? 'sales.totalAmount'
      : sortBy === 'quantity'
        ? 'sales.quantity'
        : sortBy === 'customerName'
          ? 'customers.name'
          : sortBy === 'livestockType'
            ? 'sales.livestockType'
            : 'sales.date'

  let dataQuery = db
    .selectFrom('sales')
    .leftJoin('customers', 'customers.id', 'sales.customerId')
    .leftJoin('batches', 'batches.id', 'sales.batchId')
    .leftJoin('farms', 'farms.id', 'sales.farmId')
    .select([
      'sales.id',
      'sales.farmId',
      'sales.batchId',
      'sales.customerId',
      'sales.livestockType',
      'sales.quantity',
      'sales.unitPrice',
      'sales.totalAmount',
      'sales.unitType',
      'sales.ageWeeks',
      'sales.averageWeightKg',
      'sales.paymentStatus',
      'sales.paymentMethod',
      'sales.date',
      'sales.notes',
      'sales.createdAt',
      'customers.name as customerName',
      'batches.species as batchSpecies',
      'farms.name as farmName',
    ])
    .where('sales.farmId', 'in', farmIds)

  // Re-apply filters
  if (search) {
    dataQuery = dataQuery.where((eb) =>
      eb.or([
        eb('customers.name', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
        eb('sales.notes', 'ilike', `%${search}%`),
      ]),
    )
  }
  if (livestockType) {
    dataQuery = dataQuery.where(
      'sales.livestockType',
      '=',
      livestockType as any,
    )
  }
  if (paymentStatus) {
    dataQuery = dataQuery.where(
      'sales.paymentStatus',
      '=',
      paymentStatus as any,
    )
  }
  if (batchId) {
    dataQuery = dataQuery.where('sales.batchId', '=', batchId)
  }

  // Apply sorting and pagination
  const data = await dataQuery
    .orderBy(sortColumn, sortOrder)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return {
    data: data as Array<SaleWithJoins>,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Restore batch quantity when a sale is deleted
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @param quantity - Quantity to restore
 */
export async function restoreBatchQuantityOnDelete(
  db: Kysely<Database>,
  batchId: string,
  quantity: number,
): Promise<void> {
  await db
    .updateTable('batches')
    .set((eb) => ({
      currentQuantity: eb('currentQuantity', '+', quantity),
      status: 'active',
      updatedAt: new Date(),
    }))
    .where('id', '=', batchId)
    .execute()
}

/**
 * Adjust batch quantity when a sale is updated
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @param quantityDiff - Quantity difference (positive = increase sale, negative = decrease)
 */
export async function adjustBatchQuantityOnUpdate(
  db: Kysely<Database>,
  batchId: string,
  quantityDiff: number,
): Promise<void> {
  await db
    .updateTable('batches')
    .set((eb) => ({
      currentQuantity: eb('currentQuantity', '-', quantityDiff),
      updatedAt: new Date(),
    }))
    .where('id', '=', batchId)
    .execute()
}
