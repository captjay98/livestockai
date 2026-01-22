/**
 * Database operations for expense management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

type ExpenseCategory = Database['expenses']['category']
type FeedType = Database['feed_inventory']['feedType']

/**
 * Data for inserting a new expense
 */
export interface ExpenseInsert {
  farmId: string
  batchId: string | null
  category: ExpenseCategory
  amount: string
  date: Date
  description: string
  supplierId: string | null
  isRecurring: boolean
}

/**
 * Data for updating an expense
 */
export interface ExpenseUpdate {
  category?: ExpenseCategory
  amount?: string
  date?: Date
  description?: string
  batchId?: string | null
  supplierId?: string | null
  isRecurring?: boolean
}

/**
 * Filters for expense queries
 */
export interface ExpenseFilters {
  startDate?: Date
  endDate?: Date
  category?: string
  batchId?: string
  search?: string
}

/**
 * Result from expense query with joins
 */
export interface ExpenseWithJoins {
  id: string
  farmId: string
  farmName: string | null
  category: string
  amount: string
  date: Date
  description: string
  supplierId: string | null
  supplierName: string | null
  batchId: string | null
  batchSpecies: string | null
  batchType: string | null
  isRecurring: boolean
  createdAt: Date
}

/**
 * Feed inventory record
 */
export interface FeedInventory {
  id: string
  farmId: string
  feedType: FeedType
  quantityKg: string
  minThresholdKg: string
  updatedAt: Date
}

/**
 * Insert a new expense into the database
 *
 * @param db - Kysely database instance
 * @param data - Expense data to insert
 * @returns The ID of the created expense
 */
export async function insertExpense(
  db: Kysely<Database>,
  data: ExpenseInsert,
): Promise<string> {
  const result = await db
    .insertInto('expenses')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single expense by ID
 *
 * @param db - Kysely database instance
 * @param expenseId - ID of the expense to retrieve
 * @returns The expense data or null if not found
 */
export async function getExpenseById(
  db: Kysely<Database>,
  expenseId: string,
): Promise<ExpenseWithJoins | null> {
  const expense = await db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .leftJoin('farms', 'farms.id', 'expenses.farmId')
    .select([
      'expenses.id',
      'expenses.farmId',
      'expenses.category',
      'expenses.amount',
      'expenses.date',
      'expenses.description',
      'expenses.supplierId',
      'expenses.batchId',
      'expenses.isRecurring',
      'expenses.createdAt',
      'suppliers.name as supplierName',
      'batches.species as batchSpecies',
      'batches.livestockType as batchType',
      'farms.name as farmName',
    ])
    .where('expenses.id', '=', expenseId)
    .executeTakeFirst()

  return (expense as ExpenseWithJoins | null) ?? null
}

/**
 * Delete an expense by ID
 *
 * @param db - Kysely database instance
 * @param expenseId - ID of the expense to delete
 */
export async function deleteExpense(
  db: Kysely<Database>,
  expenseId: string,
): Promise<void> {
  await db.deleteFrom('expenses').where('id', '=', expenseId).execute()
}

/**
 * Update expense fields
 *
 * @param db - Kysely database instance
 * @param expenseId - ID of the expense to update
 * @param data - Fields to update
 */
export async function updateExpense(
  db: Kysely<Database>,
  expenseId: string,
  data: ExpenseUpdate,
): Promise<void> {
  await db
    .updateTable('expenses')
    .set(data)
    .where('id', '=', expenseId)
    .execute()
}

/**
 * Get expenses by farm IDs with optional filters
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @param filters - Optional filters for date range, category, and batch
 * @returns Array of expenses with joined entity names
 */
export async function getExpensesByFarm(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: ExpenseFilters,
): Promise<Array<ExpenseWithJoins>> {
  let query = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .leftJoin('farms', 'farms.id', 'expenses.farmId')
    .select([
      'expenses.id',
      'expenses.farmId',
      'expenses.category',
      'expenses.amount',
      'expenses.date',
      'expenses.description',
      'expenses.supplierId',
      'expenses.batchId',
      'expenses.isRecurring',
      'expenses.createdAt',
      'suppliers.name as supplierName',
      'batches.species as batchSpecies',
      'batches.livestockType as batchType',
      'farms.name as farmName',
    ])
    .where('expenses.farmId', 'in', farmIds)

  if (filters?.startDate) {
    query = query.where('expenses.date', '>=', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.where('expenses.date', '<=', filters.endDate)
  }

  if (filters?.category) {
    query = query.where(
      'expenses.category',
      '=',
      filters.category as ExpenseCategory,
    )
  }

  if (filters?.batchId) {
    query = query.where('expenses.batchId', '=', filters.batchId)
  }

  return await query.orderBy('expenses.date', 'desc').execute()
}

/**
 * Get expenses summary by category for given farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param filters - Optional date range filters
 * @returns Array of category summary results
 */
export async function getExpensesSummary(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: { startDate?: Date; endDate?: Date },
): Promise<
  Array<{ category: string; amount: string; count?: string | number }>
> {
  let query = db
    .selectFrom('expenses')
    .select([
      'category',
      db.fn.count('id').as('count'),
      db.fn.sum<string>('amount').as('totalAmount'),
    ])
    .where('farmId', 'in', farmIds)
    .groupBy('category')

  if (filters?.startDate) {
    query = query.where('date', '>=', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.where('date', '<=', filters.endDate)
  }

  const results = await query.execute()
  return results.map((r) => ({
    category: r.category,
    count: r.count,
    amount: r.totalAmount,
  })) as Array<{ category: string; amount: string; count?: string | number }>
}

/**
 * Get total expenses for given farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param filters - Optional date range filters
 * @returns Total amount as decimal string
 */
export async function getTotalExpenses(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters?: { startDate?: Date; endDate?: Date },
): Promise<string> {
  let query = db
    .selectFrom('expenses')
    .select(db.fn.sum<string>('amount').as('total'))
    .where('farmId', 'in', farmIds)

  if (filters?.startDate) {
    query = query.where('date', '>=', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.where('date', '<=', filters.endDate)
  }

  const result = await query.executeTakeFirst()
  return result?.total || '0'
}

/**
 * Get paginated expenses with filters
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param filters - Filters, sorting, and pagination options
 * @returns Paginated result with data and metadata
 */
export async function getExpensesPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters: ExpenseFilters & {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  },
): Promise<{
  data: Array<{
    id: string
    farmId: string
    farmName: string | null
    category: string
    amount: string
    date: Date
    description: string
    supplierName: string | null
    batchSpecies: string | null
    batchType: string | null
    isRecurring: boolean
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const page = filters.page || 1
  const pageSize = filters.pageSize || 10
  const sortBy = filters.sortBy || 'date'
  const sortOrder = filters.sortOrder || 'desc'
  const search = filters.search || ''

  // Build base query for counting and data
  let baseQuery = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .leftJoin('farms', 'farms.id', 'expenses.farmId')
    .where('expenses.farmId', 'in', farmIds)

  // Apply search filter
  if (search) {
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('expenses.description', 'ilike', `%${search}%`),
        eb('suppliers.name', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
      ]),
    )
  }

  // Apply category filter
  if (filters.category) {
    baseQuery = baseQuery.where(
      'expenses.category',
      '=',
      filters.category as ExpenseCategory,
    )
  }

  // Apply batch filter
  if (filters.batchId) {
    baseQuery = baseQuery.where('expenses.batchId', '=', filters.batchId)
  }

  // Apply date filters
  if (filters.startDate) {
    baseQuery = baseQuery.where('expenses.date', '>=', filters.startDate)
  }

  if (filters.endDate) {
    baseQuery = baseQuery.where('expenses.date', '<=', filters.endDate)
  }

  // Get total count
  const { sql } = await import('kysely')
  const countResult = await baseQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()
  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Build data query with explicit column selection
  let dataQuery = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .leftJoin('farms', 'farms.id', 'expenses.farmId')
    .select([
      'expenses.id',
      'expenses.farmId',
      'expenses.category',
      'expenses.amount',
      'expenses.date',
      'expenses.description',
      'expenses.isRecurring',
      'suppliers.name as supplierName',
      'batches.species as batchSpecies',
      'batches.livestockType as batchType',
      'farms.name as farmName',
    ])
    .where('expenses.farmId', 'in', farmIds)

  // Re-apply all filters to data query
  if (search) {
    dataQuery = dataQuery.where((eb) =>
      eb.or([
        eb('expenses.description', 'ilike', `%${search}%`),
        eb('suppliers.name', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
      ]),
    )
  }

  if (filters.category) {
    dataQuery = dataQuery.where(
      'expenses.category',
      '=',
      filters.category as ExpenseCategory,
    )
  }

  if (filters.batchId) {
    dataQuery = dataQuery.where('expenses.batchId', '=', filters.batchId)
  }

  if (filters.startDate) {
    dataQuery = dataQuery.where('expenses.date', '>=', filters.startDate)
  }

  if (filters.endDate) {
    dataQuery = dataQuery.where('expenses.date', '<=', filters.endDate)
  }

  // Apply sorting and pagination
  const sortColumn =
    sortBy === 'amount'
      ? 'expenses.amount'
      : sortBy === 'category'
        ? 'expenses.category'
        : sortBy === 'description'
          ? 'expenses.description'
          : sortBy === 'supplierName'
            ? 'suppliers.name'
            : 'expenses.date'

  const data = await dataQuery
    .orderBy(sortColumn as any, sortOrder)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return {
    data: data.map((d) => ({
      ...d,
      farmName: d.farmName || null,
      supplierName: d.supplierName || null,
      batchSpecies: d.batchSpecies || null,
      batchType: d.batchType || null,
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get feed inventory for a farm and feed type
 *
 * @param db - Kysely database instance
 * @param farmId - Farm ID
 * @param feedType - Type of feed
 * @returns Feed inventory record or null if not found
 */
export async function getFeedInventory(
  db: Kysely<Database>,
  farmId: string,
  feedType: FeedType,
): Promise<FeedInventory | null> {
  const inventory = await db
    .selectFrom('feed_inventory')
    .selectAll()
    .where('farmId', '=', farmId)
    .where('feedType', '=', feedType)
    .executeTakeFirst()

  return (inventory as FeedInventory | null) ?? null
}

/**
 * Update feed inventory quantity
 *
 * @param db - Kysely database instance
 * @param inventoryId - Inventory record ID
 * @param quantity - New quantity (as decimal string)
 */
export async function updateFeedInventory(
  db: Kysely<Database>,
  inventoryId: string,
  quantity: string,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set({
      quantityKg: quantity,
      updatedAt: new Date(),
    })
    .where('id', '=', inventoryId)
    .execute()
}

/**
 * Insert new feed inventory record
 *
 * @param db - Kysely database instance
 * @param data - Inventory data to insert
 * @returns The ID of the created inventory record
 */
export async function insertFeedInventory(
  db: Kysely<Database>,
  data: {
    farmId: string
    feedType: FeedType
    quantityKg: string | number
    minThresholdKg: string
  },
): Promise<string> {
  const result = await db
    .insertInto('feed_inventory')
    .values({
      farmId: data.farmId,
      feedType: data.feedType,
      quantityKg: data.quantityKg.toString(),
      minThresholdKg: data.minThresholdKg,
      updatedAt: new Date(),
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get expense farm ID for authorization check
 *
 * @param db - Kysely database instance
 * @param expenseId - Expense ID
 * @returns Farm ID or null if not found
 */
export async function getExpenseFarmId(
  db: Kysely<Database>,
  expenseId: string,
): Promise<string | null> {
  const expense = await db
    .selectFrom('expenses')
    .select('farmId')
    .where('id', '=', expenseId)
    .executeTakeFirst()

  return expense?.farmId || null
}
