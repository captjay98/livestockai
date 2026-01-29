/**
 * Database operations for supplier management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { PaginatedResult } from '~/lib/types'
import type {
  CreateSupplierInput,
  SupplierQuery,
  SupplierRecord,
} from './server'

/**
 * Insert a new supplier record
 */
export async function insertSupplier(
  db: Kysely<Database>,
  input: CreateSupplierInput,
): Promise<string> {
  const result = await db
    .insertInto('suppliers')
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      location: input.location || null,
      products: input.products,
      supplierType: input.supplierType || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Retrieve all suppliers (unpaginated)
 */
export async function selectAllSuppliers(
  db: Kysely<Database>,
): Promise<Array<SupplierRecord>> {
  return await db
    .selectFrom('suppliers')
    .select([
      'id',
      'name',
      'phone',
      'email',
      'location',
      'products',
      'supplierType',
      'createdAt',
      'updatedAt',
    ])
    .where('deletedAt', 'is', null)
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Retrieve a supplier by ID
 */
export async function selectSupplierById(
  db: Kysely<Database>,
  supplierId: string,
): Promise<SupplierRecord | undefined> {
  return await db
    .selectFrom('suppliers')
    .select([
      'id',
      'name',
      'phone',
      'email',
      'location',
      'products',
      'supplierType',
      'createdAt',
      'updatedAt',
    ])
    .where('id', '=', supplierId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst()
}

/**
 * Update a supplier record
 */
export async function updateSupplier(
  db: Kysely<Database>,
  supplierId: string,
  input: Partial<CreateSupplierInput>,
): Promise<void> {
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
 * Delete a supplier record
 */
export async function deleteSupplier(
  db: Kysely<Database>,
  supplierId: string,
): Promise<void> {
  await db
    .updateTable('suppliers')
    .set({ deletedAt: new Date() })
    .where('id', '=', supplierId)
    .execute()
}

/**
 * Restore a deleted supplier
 */
export async function restoreSupplier(
  db: Kysely<Database>,
  supplierId: string,
): Promise<void> {
  await db
    .updateTable('suppliers')
    .set({ deletedAt: null })
    .where('id', '=', supplierId)
    .execute()
}

/**
 * Retrieve paginated suppliers with optional filtering
 */
export async function selectSuppliersPaginated(
  db: Kysely<Database>,
  query: SupplierQuery,
): Promise<PaginatedResult<SupplierRecord>> {
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
    // Validate sort column to prevent SQL injection
    const allowedCols: Record<string, string> = {
      name: 'suppliers."name"',
      phone: 'suppliers."phone"',
      email: 'suppliers."email"',
      location: 'suppliers."location"',
      supplierType: 'suppliers."supplierType"',
      createdAt: 'suppliers."createdAt"',
      totalSpent: '"totalSpent"',
      expenseCount: '"expenseCount"',
    }
    const sortCol = allowedCols[query.sortBy] || 'suppliers."createdAt"'
    dataQuery = dataQuery.orderBy(sql.raw(sortCol), sortOrder)
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
 * Retrieve expenses for a specific supplier
 */
export async function selectSupplierExpenses(
  db: Kysely<Database>,
  supplierId: string,
): Promise<
  Array<{
    id: string
    category: string
    amount: string
    date: Date
    description: string
  }>
> {
  return await db
    .selectFrom('expenses')
    .select(['id', 'category', 'amount', 'date', 'description'])
    .where('supplierId', '=', supplierId)
    .orderBy('date', 'desc')
    .execute()
}
