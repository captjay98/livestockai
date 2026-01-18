import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

/**
 * Represents a supplier record with aggregated spending metrics.
 */
export interface SupplierRecord {
  /** Unique identifier for the supplier */
  id: string
  /** Name of the supplier or business entity */
  name: string
  /** Primary contact phone number */
  phone: string
  /** Optional contact email address */
  email: string | null
  /** Optional physical address or headquarters */
  location: string | null
  /** List of products or services provided by this supplier */
  products: Array<string>
  /** Specific classification (e.g., hatchery, feed mill) */
  supplierType: string | null
  /** Timestamp when the supplier was registered */
  createdAt: Date
  /** Aggregate total amount spent with this supplier in system currency */
  totalSpent: number
}

/**
 * Data structure for creating a new supplier record.
 */
export interface CreateSupplierInput {
  /** Supplier's full name */
  name: string
  /** Contact phone number */
  phone: string
  /** Optional contact email */
  email?: string | null
  /** Optional location description */
  location?: string | null
  /** List of products supplied */
  products: Array<string>
  /** Category of supply provided */
  supplierType?:
    | 'hatchery'
    | 'feed_mill'
    | 'pharmacy'
    | 'equipment'
    | 'fingerlings'
    | 'other'
    | null
}

/**
 * Filter and pagination parameters for querying suppliers.
 */
export interface SupplierQuery extends BasePaginatedQuery {
  /** Filter by a specific supplier classification */
  supplierType?: string
}

/**
 * Register a new supplier in the system.
 *
 * @param input - Supplier details and product list
 * @returns Promise resolving to the new supplier ID
 */
export async function createSupplier(
  input: CreateSupplierInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const result = await db
    .insertInto('suppliers')
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      location: input.location || null,
      products: input.products,
    })
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Server function to create a supplier record.
 * Validates input data.
 */
export const createSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateSupplierInput) => data)
  .handler(async ({ data }) => {
    return createSupplier(data)
  })

/**
 * Retrieve all suppliers in alphabetical order.
 *
 * @returns Promise resolving to an array of all supplier records
 */
export async function getSuppliers() {
  const { db } = await import('~/lib/db')
  return db.selectFrom('suppliers').selectAll().orderBy('name', 'asc').execute()
}

/**
 * Server function to retrieve all suppliers.
 */
export const getSuppliersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getSuppliers()
  },
)

/**
 * Retrieve a specific supplier record by its unique ID.
 *
 * @param supplierId - ID of the supplier to retrieve
 * @returns Promise resolving to the supplier or undefined
 */
export async function getSupplierById(supplierId: string) {
  const { db } = await import('~/lib/db')
  return db
    .selectFrom('suppliers')
    .selectAll()
    .where('id', '=', supplierId)
    .executeTakeFirst()
}

/**
 * Update an existing supplier's details.
 *
 * @param supplierId - ID of the supplier to update
 * @param input - Partial supplier data to apply
 */
export async function updateSupplier(
  supplierId: string,
  input: Partial<CreateSupplierInput>,
) {
  const { db } = await import('~/lib/db')
  await db
    .updateTable('suppliers')
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where('id', '=', supplierId)
    .execute()
}

/**
 * Server function to update a supplier record.
 */
export const updateSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; data: Partial<CreateSupplierInput> }) => data,
  )
  .handler(async ({ data }) => {
    return updateSupplier(data.id, data.data)
  })

/**
 * Permanently delete a supplier record from the system.
 *
 * @param supplierId - ID of the supplier to delete
 */
export async function deleteSupplier(supplierId: string) {
  const { db } = await import('~/lib/db')
  await db.deleteFrom('suppliers').where('id', '=', supplierId).execute()
}

/**
 * Server function to delete a supplier record.
 */
export const deleteSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return deleteSupplier(data.id)
  })

/**
 * Retrieve a supplier's profile along with a history of all tracked expenses (sourcing).
 *
 * @param supplierId - ID of the supplier
 * @returns Promise resolving to supplier details with expense history and total spent
 */
export async function getSupplierWithExpenses(supplierId: string) {
  const { db } = await import('~/lib/db')
  const supplier = await getSupplierById(supplierId)
  if (!supplier) return null
  const expenses = await db
    .selectFrom('expenses')
    .select(['id', 'category', 'amount', 'date', 'description'])
    .where('supplierId', '=', supplierId)
    .orderBy('date', 'desc')
    .execute()
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  return {
    ...supplier,
    expenses,
    totalSpent,
    expenseCount: expenses.length,
  }
}

/**
 * Retrieve a paginated list of suppliers with search and classification filtering.
 *
 * @param query - Query parameters (search, pagination, sorting, supplierType)
 * @returns Promise resolving to a paginated set of supplier records
 */
export async function getSuppliersPaginated(query: SupplierQuery = {}) {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('suppliers')
    .leftJoin('expenses', 'expenses.supplierId', 'suppliers.id')

  if (query.search) {
    const searchLower = `%${query.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('suppliers.name', 'ilike', searchLower),
        eb('suppliers.phone', 'ilike', searchLower),
        eb('suppliers.location', 'ilike', searchLower),
        eb('suppliers.email', 'ilike', searchLower),
      ]),
    )
  }

  // Apply supplierType filter
  if (query.supplierType) {
    baseQuery = baseQuery.where(
      'suppliers.supplierType',
      '=',
      query.supplierType as any,
    )
  }

  // Count
  const countResult = await baseQuery
    .select(sql<number>`count(distinct suppliers.id)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Data
  let dataQuery = baseQuery
    .select([
      'suppliers.id',
      'suppliers.name',
      'suppliers.phone',
      'suppliers.email',
      'suppliers.location',
      'suppliers.products',
      'suppliers.supplierType',
      'suppliers.createdAt',
      sql<number>`count(expenses.id)`.as('expenseCount'),
      sql<string>`coalesce(sum(expenses.amount), 0)`.as('totalSpent'),
    ])
    .groupBy([
      'suppliers.id',
      'suppliers.name',
      'suppliers.phone',
      'suppliers.email',
      'suppliers.location',
      'suppliers.products',
      'suppliers.supplierType',
      'suppliers.createdAt',
    ])
    .limit(pageSize)
    .offset(offset)

  if (query.sortBy) {
    const sortOrder = query.sortOrder || 'desc'
    const sortCol = query.sortBy
    if (query.sortBy === 'totalSpent' || query.sortBy === 'expenseCount') {
      dataQuery = dataQuery.orderBy(sql.raw(`"${sortCol}"`), sortOrder)
    } else {
      dataQuery = dataQuery.orderBy(
        sql.raw(`suppliers."${sortCol}"`),
        sortOrder,
      )
    }
  } else {
    dataQuery = dataQuery.orderBy(sql.raw('suppliers."createdAt"'), 'desc')
  }

  const rawData = await dataQuery.execute()

  const data = rawData.map((d) => ({
    ...d,
    expenseCount: Number(d.expenseCount),
    totalSpent: parseFloat(d.totalSpent || '0'),
  }))

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Server function to retrieve paginated supplier records.
 */
export const getSuppliersPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: SupplierQuery) => data)
  .handler(async ({ data }) => {
    return getSuppliersPaginated(data)
  })
