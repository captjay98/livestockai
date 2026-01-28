/**
 * Database operations for customer management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { CreateCustomerInput, CustomerQuery } from './server'

/** Raw customer record from database */
export interface CustomerDbRecord {
    id: string
    farmId: string
    name: string
    phone: string
    email: string | null
    location: string | null
    customerType: string | null
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
}

/**
 * Insert a new customer record
 */
export async function insertCustomer(
    db: Kysely<Database>,
    input: CreateCustomerInput,
): Promise<string> {
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
}

/**
 * Retrieve all customers for specific farms (unpaginated)
 */
export async function selectCustomersByFarms(
    db: Kysely<Database>,
    farmIds: Array<string>,
): Promise<Array<CustomerDbRecord>> {
    return await db
        .selectFrom('customers')
        .select([
            'id',
            'farmId',
            'name',
            'phone',
            'email',
            'location',
            'customerType',
            'createdAt',
            'updatedAt',
        ])
        .where('farmId', 'in', farmIds)
        .where('deletedAt', 'is', null)
        .orderBy('name', 'asc')
        .execute()
}

/**
 * Retrieve all customers for a farm (unpaginated)
 */
export async function selectAllCustomers(
    db: Kysely<Database>,
): Promise<Array<CustomerDbRecord>> {
    return await db
        .selectFrom('customers')
        .select([
            'id',
            'farmId',
            'name',
            'phone',
            'email',
            'location',
            'customerType',
            'createdAt',
            'updatedAt',
        ])
        .where('deletedAt', 'is', null)
        .orderBy('name', 'asc')
        .execute()
}

/**
 * Retrieve a customer by ID
 */
export async function selectCustomerById(
    db: Kysely<Database>,
    customerId: string,
): Promise<CustomerDbRecord | undefined> {
    return await db
        .selectFrom('customers')
        .select([
            'id',
            'farmId',
            'name',
            'phone',
            'email',
            'location',
            'customerType',
            'createdAt',
            'updatedAt',
        ])
        .where('id', '=', customerId)
        .where('deletedAt', 'is', null)
        .executeTakeFirst()
}

/**
 * Update a customer record
 */
export async function updateCustomer(
    db: Kysely<Database>,
    customerId: string,
    input: Partial<CreateCustomerInput>,
): Promise<void> {
    await db
        .updateTable('customers')
        .set({
            ...input,
            updatedAt: new Date(),
        })
        .where('id', '=', customerId)
        .execute()
}

/**
 * Delete a customer record
 */
export async function deleteCustomer(
    db: Kysely<Database>,
    customerId: string,
): Promise<void> {
    await db
        .updateTable('customers')
        .set({ deletedAt: new Date() })
        .where('id', '=', customerId)
        .execute()
}

/**
 * Restore a deleted customer
 */
export async function restoreCustomer(
    db: Kysely<Database>,
    customerId: string,
): Promise<void> {
    await db
        .updateTable('customers')
        .set({ deletedAt: null })
        .where('id', '=', customerId)
        .execute()
}

/**
 * Retrieve paginated customers for specific farms with optional filtering
 */
export async function selectCustomersPaginatedByFarms(
    db: Kysely<Database>,
    farmIds: Array<string>,
    query: CustomerQuery,
) {
    const { sql } = await import('kysely')
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    let baseQuery = db
        .selectFrom('customers')
        .leftJoin('sales', 'sales.customerId', 'customers.id')
        .where('customers.farmId', 'in', farmIds)
        .where('customers.deletedAt', 'is', null)

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
        // Validate sort column to prevent SQL injection
        const allowedCols: Record<string, string> = {
            name: 'customers."name"',
            phone: 'customers."phone"',
            email: 'customers."email"',
            location: 'customers."location"',
            customerType: 'customers."customerType"',
            createdAt: 'customers."createdAt"',
            totalSpent: '"totalSpent"',
            salesCount: '"salesCount"',
        }
        const sortCol = allowedCols[query.sortBy] || 'customers."createdAt"'
        dataQuery = dataQuery.orderBy(sql.raw(sortCol), sortOrder)
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
}

/**
 * Retrieve paginated customers with optional filtering
 */
export async function selectCustomersPaginated(
    db: Kysely<Database>,
    query: CustomerQuery,
) {
    const { sql } = await import('kysely')
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
        // Validate sort column to prevent SQL injection
        const allowedCols: Record<string, string> = {
            name: 'customers."name"',
            phone: 'customers."phone"',
            email: 'customers."email"',
            location: 'customers."location"',
            customerType: 'customers."customerType"',
            createdAt: 'customers."createdAt"',
            totalSpent: '"totalSpent"',
            salesCount: '"salesCount"',
        }
        const sortCol = allowedCols[query.sortBy] || 'customers."createdAt"'
        dataQuery = dataQuery.orderBy(sql.raw(sortCol), sortOrder)
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
}

/**
 * Retrieve sales for a specific customer
 */
export async function selectCustomerSales(
    db: Kysely<Database>,
    customerId: string,
) {
    return await db
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
}

/**
 * Retrieve top customers by total spent for specific farms
 */
export async function selectTopCustomersByFarms(
    db: Kysely<Database>,
    farmIds: Array<string>,
    limit: number = 10,
): Promise<
    Array<{
        id: string
        name: string
        phone: string
        location: string | null
        salesCount: number
        totalSpent: number
    }>
> {
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
        .where('customers.farmId', 'in', farmIds)
        .where('customers.deletedAt', 'is', null)
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

/**
 * Retrieve top customers by total spent
 */
export async function selectTopCustomers(
    db: Kysely<Database>,
    limit: number = 10,
): Promise<
    Array<{
        id: string
        name: string
        phone: string
        location: string | null
        salesCount: number
        totalSpent: number
    }>
> {
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
