import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Represents a customer record with aggregated sales metrics.
 * Used for CRM and reporting.
 */
export interface CustomerRecord {
  /** Unique identifier for the customer */
  id: string
  /** Full name of the customer or business */
  name: string
  /** Contact phone number */
  phone: string
  /** Optional email address */
  email: string | null
  /** Optional physical or delivery address */
  location: string | null
  /**
   * Categorization of the customer.
   * Helps in targeted marketing and pricing.
   */
  customerType: string | null
  /** Timestamp when the customer was first recorded */
  createdAt: Date
  /** Aggregate count of sales made to this customer */
  salesCount: number
  /** Aggregate total amount spent by this customer in system currency */
  totalSpent: number
}

/**
 * Data structure for creating a new customer record.
 */
export interface CreateCustomerInput {
  /** ID of the farm this customer belongs to */
  farmId: string
  /** Customer's full name */
  name: string
  /** Contact phone number */
  phone: string
  /** Optional contact email */
  email?: string | null
  /** Optional delivery or business address */
  location?: string | null
  /** Optional classification of the customer */
  customerType?: 'individual' | 'restaurant' | 'retailer' | 'wholesaler' | null
}

/**
 * Filter and pagination parameters for querying customers.
 */
export interface CustomerQuery extends BasePaginatedQuery {
  /** Filter by a specific customer classification */
  customerType?: string
}

/**
 * Register a new customer in the system.
 *
 * @param input - Customer details (name, phone, etc.)
 * @returns Promise resolving to the new customer ID
 */
export async function createCustomer(
  input: CreateCustomerInput,
): Promise<string> {
  const { db } = await import('~/lib/db')

  try {
    const result = await db
      .insertInto('customers')
      .values({
        farmId: input.farmId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        location: input.location || null,
        customerType: input.customerType || null,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    return result.id
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create customer',
      cause: error,
    })
  }
}

/**
 * Server function to create a customer record.
 * Validates input data.
 */
export const createCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateCustomerInput) => data)
  .handler(async ({ data }) => {
    return createCustomer(data)
  })

/**
 * Retrieve all customers in alphabetical order.
 *
 * @returns Promise resolving to an array of all customer records
 */
export async function getCustomers() {
  const { db } = await import('~/lib/db')
  try {
    return await db
      .selectFrom('customers')
      .selectAll()
      .orderBy('name', 'asc')
      .execute()
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch customers',
      cause: error,
    })
  }
}

/**
 * Retrieve a single customer record by its unique ID.
 *
 * @param customerId - ID of the customer to retrieve
 * @returns Promise resolving to the customer or undefined
 */
export async function getCustomerById(customerId: string) {
  const { db } = await import('~/lib/db')
  try {
    return await db
      .selectFrom('customers')
      .selectAll()
      .where('id', '=', customerId)
      .executeTakeFirst()
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch customer',
      cause: error,
    })
  }
}

/**
 * Update an existing customer's details.
 *
 * @param customerId - ID of the customer to update
 * @param input - Partial customer data to apply
 */
export async function updateCustomer(
  customerId: string,
  input: Partial<CreateCustomerInput>,
) {
  const { db } = await import('~/lib/db')
  try {
    await db
      .updateTable('customers')
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where('id', '=', customerId)
      .execute()
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update customer',
      cause: error,
    })
  }
}

/**
 * Server function to update a customer record.
 */
export const updateCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; data: Partial<CreateCustomerInput> }) => data,
  )
  .handler(async ({ data }) => {
    return updateCustomer(data.id, data.data)
  })

/**
 * Permanently remove a customer record from the system.
 *
 * @param customerId - ID of the customer to delete
 */
export async function deleteCustomer(customerId: string) {
  const { db } = await import('~/lib/db')
  try {
    await db.deleteFrom('customers').where('id', '=', customerId).execute()
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete customer',
      cause: error,
    })
  }
}

/**
 * Server function to delete a customer record.
 */
export const deleteCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return deleteCustomer(data.id)
  })

/**
 * Retrieve a customer's full profile including their entire purchase history.
 *
 * @param customerId - ID of the customer
 * @returns Promise resolving to customer details with sales history and total spent
 */
export async function getCustomerWithSales(customerId: string) {
  const { db } = await import('~/lib/db')

  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch customer details',
      cause: error,
    })
  }
}

/**
 * Retrieve a list of customers ranked by their lifetime spending.
 *
 * @param limit - Maximum number of customers to return (default: 10)
 * @returns Promise resolving to the highest spending customers
 */
export async function getTopCustomers(limit: number = 10) {
  const { db } = await import('~/lib/db')

  try {
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
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch top customers',
      cause: error,
    })
  }
}

/**
 * Retrieve a paginated list of customers with search and filter capabilities.
 * Includes aggregated sales metrics for each customer.
 *
 * @param query - Query parameters (search, pagination, sorting, customerType)
 * @returns Promise resolving to a paginated set of customer records
 */
export async function getCustomersPaginated(query: CustomerQuery = {}) {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')

  try {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    let baseQuery = db
      .selectFrom('customers')
      .leftJoin('sales', 'sales.customerId', 'customers.id')

    if (query.search) {
      const searchLower = `%${query.search.toLowerCase()}%`
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('customers.name', 'ilike', searchLower),
          eb('customers.phone', 'ilike', searchLower),
          eb('customers.location', 'ilike', searchLower),
          eb('customers.email', 'ilike', searchLower),
        ]),
      )
    }

    // Apply customerType filter
    if (query.customerType) {
      baseQuery = baseQuery.where(
        'customers.customerType',
        '=',
        query.customerType as any,
      )
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
        'customers.updatedAt',
        sql<number>`count(sales.id)`.as('salesCount'),
        sql<string>`coalesce(sum(sales."totalAmount"), 0)`.as('totalSpent'),
      ])
      .groupBy([
        'customers.id',
        'customers.name',
        'customers.phone',
        'customers.email',
        'customers.location',
        'customers.customerType',
        'customers.createdAt',
        'customers.updatedAt',
      ])
      .limit(pageSize)
      .offset(offset)

    if (query.sortBy) {
      const sortOrder = query.sortOrder || 'desc'
      const sortCol = query.sortBy
      if (query.sortBy === 'totalSpent' || query.sortBy === 'salesCount') {
        dataQuery = dataQuery.orderBy(sql.raw(`"${sortCol}"`), sortOrder)
      } else {
        dataQuery = dataQuery.orderBy(
          sql.raw(`customers."${sortCol}"`),
          sortOrder,
        )
      }
    } else {
      dataQuery = dataQuery.orderBy(sql.raw('customers."createdAt"'), 'desc')
    }

    const rawData = await dataQuery.execute()

    const data = rawData.map((d) => ({
      ...d,
      salesCount: Number(d.salesCount),
      totalSpent: parseFloat(d.totalSpent || '0'),
    }))

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch paginated customers',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated customer records.
 */
export const getCustomersPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: CustomerQuery) => data)
  .handler(async ({ data }) => {
    return getCustomersPaginated(data)
  })

/**
 * Server function to retrieve all customers (unpaginated).
 */
export const getCustomersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getCustomers()
  },
)
