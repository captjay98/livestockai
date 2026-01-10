import { createServerFn } from '@tanstack/react-start'

export interface CreateCustomerInput {
  name: string
  phone: string
  email?: string | null
  location?: string | null
  customerType?: 'individual' | 'restaurant' | 'retailer' | 'wholesaler' | null
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

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<string> {
  const { db } = await import('~/lib/db')

  const result = await db
    .insertInto('customers')
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      location: input.location || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export const createCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateCustomerInput) => data)
  .handler(async ({ data }) => {
    return createCustomer(data)
  })

export async function getCustomers() {
  const { db } = await import('~/lib/db')
  return db.selectFrom('customers').selectAll().orderBy('name', 'asc').execute()
}

export async function getCustomerById(customerId: string) {
  const { db } = await import('~/lib/db')
  return db
    .selectFrom('customers')
    .selectAll()
    .where('id', '=', customerId)
    .executeTakeFirst()
}

export async function updateCustomer(
  customerId: string,
  input: Partial<CreateCustomerInput>,
) {
  const { db } = await import('~/lib/db')
  await db
    .updateTable('customers')
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where('id', '=', customerId)
    .execute()
}

export const updateCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; data: Partial<CreateCustomerInput> }) => data)
  .handler(async ({ data }) => {
    return updateCustomer(data.id, data.data)
  })

export async function deleteCustomer(customerId: string) {
  const { db } = await import('~/lib/db')
  // Check for sales first? Or cascade?
  // Ideally check for dependencies. For now assumes safe deletion or DB error.
  await db.deleteFrom('customers').where('id', '=', customerId).execute()
}

export const deleteCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return deleteCustomer(data.id)
  })

export async function getCustomerWithSales(customerId: string) {
  const { db } = await import('~/lib/db')

  const customer = await getCustomerById(customerId)
  if (!customer) return null

  const sales = await db
    .selectFrom('sales')
    .select([
      'id',
      'livestockType',
      'quantity',
      'unitPrice',
      'totalAmount',
      'date',
    ])
    .where('customerId', '=', customerId)
    .orderBy('date', 'desc')
    .execute()

  const totalSpent = sales.reduce(
    (sum, s) => sum + parseFloat(s.totalAmount),
    0,
  )

  return {
    ...customer,
    sales,
    totalSpent,
    salesCount: sales.length,
  }
}

export async function getTopCustomers(limit: number = 10) {
  const { db } = await import('~/lib/db')

  const customers = await db
    .selectFrom('customers')
    .leftJoin('sales', 'sales.customerId', 'customers.id')
    .select([
      'customers.id',
      'customers.name',
      'customers.phone',
      'customers.location',
      db.fn.count('sales.id').as('salesCount'),
      db.fn.sum<string>('sales.totalAmount').as('totalSpent'),
    ])
    .groupBy([
      'customers.id',
      'customers.name',
      'customers.phone',
      'customers.location',
    ])
    .orderBy('totalSpent', 'desc')
    .limit(limit)
    .execute()

  return customers.map((c) => ({
    ...c,
    salesCount: Number(c.salesCount),
    totalSpent: parseFloat(c.totalSpent || '0'),
  }))
}

export async function getCustomersPaginated(
  query: PaginatedQuery = {},
) {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('customers')
    .leftJoin('sales', 'sales.customerId', 'customers.id')

  if (query.search) {
    const searchLower = `%${query.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) => eb.or([
      eb('customers.name', 'ilike', searchLower),
      eb('customers.phone', 'ilike', searchLower),
      eb('customers.location', 'ilike', searchLower),
      eb('customers.email', 'ilike', searchLower),
    ]))
  }

  // Count
  const countResult = await baseQuery
    .select(sql<number>`count(distinct customers.id)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Data
  let dataQuery = baseQuery
    .select([
      'customers.id',
      'customers.name',
      'customers.phone',
      'customers.email',
      'customers.location',
      'customers.customerType',
      'customers.createdAt',
      sql<number>`count(sales.id)`.as('salesCount'),
      sql<string>`coalesce(sum(sales.total_amount), 0)`.as('totalSpent')
    ])
    .groupBy([
      'customers.id',
      'customers.name',
      'customers.phone',
      'customers.email',
      'customers.location',
      'customers.customerType',
      'customers.createdAt',
    ])
    .limit(pageSize)
    .offset(offset)

  if (query.sortBy) {
    const sortOrder = query.sortOrder || 'desc'
    let sortCol = query.sortBy
    if (query.sortBy === 'totalSpent' || query.sortBy === 'salesCount') {
      // already selected asalias, but kysely needs exact reference sometimes
      // using alias directly in orderBy string usually works in postrgres
      dataQuery = dataQuery.orderBy(sortCol, sortOrder)
    } else {
      dataQuery = dataQuery.orderBy(`customers.${sortCol}`, sortOrder)
    }
  } else {
    dataQuery = dataQuery.orderBy('customers.createdAt', 'desc')
  }

  const rawData = await dataQuery.execute()

  const data = rawData.map(d => ({
    ...d,
    salesCount: Number(d.salesCount),
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

export const getCustomersPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    return getCustomersPaginated(data)
  })
