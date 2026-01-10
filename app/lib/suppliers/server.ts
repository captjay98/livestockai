import { createServerFn } from '@tanstack/react-start'

export interface CreateSupplierInput {
  name: string
  phone: string
  email?: string | null
  location?: string | null
  products: Array<string>
  supplierType?: 'hatchery' | 'feed_mill' | 'pharmacy' | 'equipment' | 'fingerlings' | 'other' | null
}

export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

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

export const createSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateSupplierInput) => data)
  .handler(async ({ data }) => {
    return createSupplier(data)
  })

export async function getSuppliers() {
  const { db } = await import('~/lib/db')
  return db.selectFrom('suppliers').selectAll().orderBy('name', 'asc').execute()
}

export const getSuppliersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getSuppliers()
  },
)

export async function getSupplierById(supplierId: string) {
  const { db } = await import('~/lib/db')
  return db
    .selectFrom('suppliers')
    .selectAll()
    .where('id', '=', supplierId)
    .executeTakeFirst()
}

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

export const updateSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; data: Partial<CreateSupplierInput> }) => data)
  .handler(async ({ data }) => {
    return updateSupplier(data.id, data.data)
  })

export async function deleteSupplier(supplierId: string) {
  const { db } = await import('~/lib/db')
  await db.deleteFrom('suppliers').where('id', '=', supplierId).execute()
}

export const deleteSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return deleteSupplier(data.id)
  })

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

export async function getSuppliersPaginated(
  query: PaginatedQuery = {},
) {
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
    baseQuery = baseQuery.where((eb) => eb.or([
      eb('suppliers.name', 'ilike', searchLower),
      eb('suppliers.phone', 'ilike', searchLower),
      eb('suppliers.location', 'ilike', searchLower),
      eb('suppliers.email', 'ilike', searchLower),
    ]))
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
      sql<string>`coalesce(sum(expenses.amount), 0)`.as('totalSpent')
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
    let sortCol = query.sortBy
    if (query.sortBy === 'totalSpent' || query.sortBy === 'expenseCount') {
      // already selected as alias
      dataQuery = dataQuery.orderBy(sortCol, sortOrder)
    } else {
      dataQuery = dataQuery.orderBy(`suppliers.${sortCol}`, sortOrder)
    }
  } else {
    dataQuery = dataQuery.orderBy('suppliers.createdAt', 'desc')
  }

  const rawData = await dataQuery.execute()

  const data = rawData.map(d => ({
    ...d,
    expenseCount: Number(d.expenseCount),
    totalSpent: parseFloat(d.totalSpent || '0')
  }))

  return {
    data,
    total,
    page,
    pageSize,
    totalPages
  }
}

export const getSuppliersPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    return getSuppliersPaginated(data)
  })
