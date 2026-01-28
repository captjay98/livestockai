import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as repository from './repository'
import * as service from './service'
import type {
    CreateCustomerInput,
    CustomerQuery,
    PaginatedResult,
} from './types'
import { AppError } from '~/lib/errors'

// Zod validation schemas
const createCustomerSchema = z.object({
    farmId: z.string().min(1, 'Farm ID is required'),
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long'),
    email: z.string().email('Invalid email').optional().nullable(),
    location: z.string().max(500, 'Location too long').optional().nullable(),
    customerType: z
        .enum(['individual', 'restaurant', 'retailer', 'wholesaler'])
        .optional()
        .nullable(),
})

const updateCustomerSchema = createCustomerSchema
    .partial()
    .omit({ farmId: true })

const customerQuerySchema = z.object({
    farmId: z.string().optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    q: z.string().optional(),
    customerType: z.string().optional(),
})

export type { PaginatedResult }

/**
 * Register a new customer in the system.
 */
export async function createCustomer(
    input: CreateCustomerInput,
): Promise<string> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
        // Validate input
        const validationError = service.validateCustomerData(input)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', { message: validationError })
        }

        return await repository.insertCustomer(db, input)
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
 */
export const createCustomerFn = createServerFn({ method: 'POST' })
    .inputValidator(createCustomerSchema.parse)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const { checkFarmAccess } = await import('~/features/auth/utils')
        const session = await requireAuth()

        const hasAccess = await checkFarmAccess(session.user.id, data.farmId)
        if (!hasAccess) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: data.farmId },
            })
        }

        return createCustomer(data)
    })

/**
 * Retrieve all customers in alphabetical order.
 */
export async function getCustomers(userId: string, farmId?: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess, getUserFarms } =
        await import('~/features/auth/utils')

    try {
        let targetFarmIds: Array<string> = []

        if (farmId) {
            const hasAccess = await checkFarmAccess(userId, farmId)
            if (!hasAccess) {
                throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
            }
            targetFarmIds = [farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
            if (targetFarmIds.length === 0) return []
        }

        const customers = await repository.selectCustomersByFarms(
            db,
            targetFarmIds,
        )
        // Add default aggregates for simple list
        return customers.map((c) => ({
            ...c,
            salesCount: 0,
            totalSpent: 0,
        }))
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch customers',
            cause: error,
        })
    }
}

/**
 * Server function to retrieve all customers (unpaginated).
 */
export const getCustomersFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().optional() }).parse)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getCustomers(session.user.id, data.farmId)
    })

/**
 * Retrieve a single customer record by its unique ID.
 */
export async function getCustomerById(userId: string, customerId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const customer = await repository.selectCustomerById(db, customerId)

        if (!customer) return null

        if (!userFarms.includes(customer.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: customer.farmId },
            })
        }

        return customer
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch customer',
            cause: error,
        })
    }
}

/**
 * Update an existing customer's details.
 */
export async function updateCustomer(
    userId: string,
    customerId: string,
    input: Partial<CreateCustomerInput>,
): Promise<void> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const customer = await repository.selectCustomerById(db, customerId)

        if (!customer) {
            throw new AppError('NOT_FOUND', { metadata: { customerId } })
        }

        if (!userFarms.includes(customer.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: customer.farmId },
            })
        }

        await repository.updateCustomer(db, customerId, input)
    } catch (error) {
        if (error instanceof AppError) throw error
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
        z.object({
            id: z.string().min(1, 'Customer ID is required'),
            data: updateCustomerSchema,
        }).parse,
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return updateCustomer(session.user.id, data.id, data.data)
    })

/**
 * Permanently remove a customer record from the system.
 */
export async function deleteCustomer(
    userId: string,
    customerId: string,
): Promise<void> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const customer = await repository.selectCustomerById(db, customerId)

        if (!customer) {
            throw new AppError('NOT_FOUND', { metadata: { customerId } })
        }

        if (!userFarms.includes(customer.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: customer.farmId },
            })
        }

        await repository.deleteCustomer(db, customerId)
    } catch (error) {
        if (error instanceof AppError) throw error
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
    .inputValidator(
        z.object({ id: z.string().min(1, 'Customer ID is required') }).parse,
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return deleteCustomer(session.user.id, data.id)
    })

/**
 * Retrieve a customer's full profile including their entire purchase history.
 */
export async function getCustomerWithSales(userId: string, customerId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const customer = await repository.selectCustomerById(db, customerId)
        if (!customer) return null

        if (!userFarms.includes(customer.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: customer.farmId },
            })
        }

        const sales = await repository.selectCustomerSales(db, customerId)
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
 */
export async function getTopCustomers(
    userId: string,
    farmId?: string,
    limit: number = 10,
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess, getUserFarms } =
        await import('~/features/auth/utils')

    try {
        let targetFarmIds: Array<string> = []

        if (farmId) {
            const hasAccess = await checkFarmAccess(userId, farmId)
            if (!hasAccess) {
                throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
            }
            targetFarmIds = [farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
            if (targetFarmIds.length === 0) return []
        }

        return await repository.selectTopCustomersByFarms(
            db,
            targetFarmIds,
            limit,
        )
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch top customers',
            cause: error,
        })
    }
}

/**
 * Retrieve a paginated list of customers with search and filter capabilities.
 */
export async function getCustomersPaginated(
    userId: string,
    query: CustomerQuery = {},
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess, getUserFarms } =
        await import('~/features/auth/utils')

    try {
        let targetFarmIds: Array<string> = []

        if (query.farmId) {
            const hasAccess = await checkFarmAccess(userId, query.farmId)
            if (!hasAccess) {
                throw new AppError('ACCESS_DENIED', {
                    metadata: { farmId: query.farmId },
                })
            }
            targetFarmIds = [query.farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
            if (targetFarmIds.length === 0) {
                return {
                    data: [],
                    total: 0,
                    page: query.page || 1,
                    pageSize: query.pageSize || 10,
                    totalPages: 0,
                }
            }
        }

        return await repository.selectCustomersPaginatedByFarms(
            db,
            targetFarmIds,
            query,
        )
    } catch (error) {
        if (error instanceof AppError) throw error
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
    .inputValidator(customerQuerySchema.parse)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getCustomersPaginated(session.user.id, data)
    })

/**
 * Server function to retrieve top customers by spending.
 */
export const getTopCustomersFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            farmId: z.string().optional(),
            limit: z.number().int().min(1).max(100).optional(),
        }).parse,
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getTopCustomers(session.user.id, data.farmId, data.limit)
    })

/**
 * Server function to retrieve a customer with their sales history.
 */
export const getCustomerWithSalesFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            customerId: z.string().min(1, 'Customer ID is required'),
        }).parse,
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getCustomerWithSales(session.user.id, data.customerId)
    })

// Export types for use in other files
export type { CreateCustomerInput, CustomerQuery } from './types'

/**
 * Server function to get all customers (for invoice dialog)
 */
export const getAllCustomersFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({}).parse)
    .handler(async () => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        return db
            .selectFrom('customers')
            .select(['id', 'name', 'phone'])
            .execute()
    })
