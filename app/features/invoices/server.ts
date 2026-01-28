import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
    calculateInvoiceTotal,
    generateInvoiceNumber as generateInvoiceNumberService,
    transformInvoiceData,
    validateInvoiceData,
    validateUpdateData,
} from './service'
import {
    deleteInvoiceItems as deleteInvoiceItemsRepo,
    deleteInvoice as deleteInvoiceRepo,
    getInvoiceById as getInvoiceByIdRepo,
    getInvoiceItems,
    getInvoicesByFarm,
    getInvoicesPaginated as getInvoicesPaginatedRepo,
    getLastInvoiceNumber,
    getSaleForInvoice,
    insertInvoice,
    insertInvoiceItems,
    updateInvoiceStatus as updateInvoiceStatusRepo,
} from './repository'
import type { CreateInvoiceInput, InvoiceQuery, PaginatedResult } from './types'
import { AppError } from '~/lib/errors'

// Zod validation schemas
const createInvoiceSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    farmId: z.string().min(1, 'Farm ID is required'),
    items: z
        .array(
            z.object({
                description: z.string().min(1, 'Description is required'),
                quantity: z.number().positive('Quantity must be positive'),
                unitPrice: z
                    .number()
                    .nonnegative('Unit price cannot be negative'),
            }),
        )
        .min(1, 'At least one item is required'),
    dueDate: z.date().optional().nullable(),
    notes: z.string().optional().nullable(),
})

const getInvoiceByIdSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
})

const updateInvoiceStatusSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    status: z.enum(['unpaid', 'partial', 'paid']),
})

const invoiceQuerySchema = z.object({
    page: z.number().positive().optional(),
    pageSize: z.number().positive().max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    q: z.string().optional(),
    status: z.enum(['unpaid', 'partial', 'paid']).optional(),
    farmId: z.string().optional(),
})

export type { PaginatedResult }

/**
 * Generate a unique, sequential invoice number for the current year.
 * Format: INV-YYYY-NNNN
 *
 * @param farmId - Farm ID to scope invoice numbers to
 * @returns Promise resolving to the next available invoice number
 */
export async function generateInvoiceNumber(farmId: string): Promise<string> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
        const year = new Date().getFullYear()
        const prefix = `INV-${year}-`

        const lastNumber = await getLastInvoiceNumber(db, prefix, farmId)

        return generateInvoiceNumberService(lastNumber)
    } catch (error) {
        throw new AppError('INTERNAL_ERROR', {
            message: 'Failed to generate invoice number',
            cause: error,
        })
    }
}

/**
 * Create a new invoice and its individual line items.
 * Automatically generates a unique invoice number and calculates the total amount.
 *
 * @param userId - ID of the user creating the invoice
 * @param input - Billing details, customer, and items
 * @returns Promise resolving to the new invoice ID
 */
export async function createInvoice(
    userId: string,
    input: CreateInvoiceInput,
): Promise<string> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess } = await import('~/features/auth/utils')

    try {
        const hasAccess = await checkFarmAccess(userId, input.farmId)
        if (!hasAccess) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: input.farmId },
            })
        }

        // Validate input data
        const validationError = validateInvoiceData(input)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                message: validationError,
            })
        }

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(input.farmId)

        // Calculate total using service function
        const totalAmount = calculateInvoiceTotal(input.items)

        // Insert invoice
        const invoiceId = await insertInvoice(db, {
            invoiceNumber,
            customerId: input.customerId,
            farmId: input.farmId,
            totalAmount,
            status: 'unpaid',
            date: new Date(),
            dueDate: input.dueDate || null,
            notes: input.notes || null,
        })

        // Insert invoice items
        const itemsToInsert = input.items.map((item) => {
            const itemTotal = calculateInvoiceTotal([
                { quantity: item.quantity, unitPrice: item.unitPrice },
            ])
            return {
                invoiceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: itemTotal
                    ? (parseFloat(itemTotal) / item.quantity).toFixed(2)
                    : '0.00',
                total: itemTotal,
            }
        })

        await insertInvoiceItems(db, itemsToInsert)

        return invoiceId
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to create invoice',
            cause: error,
        })
    }
}

/**
 * Server function to create an invoice.
 */
export const createInvoiceFn = createServerFn({ method: 'POST' })
    .inputValidator(createInvoiceSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return createInvoice(session.user.id, data)
    })

/**
 * Retrieve all invoices, optionally filtered by farm.
 *
 * @param userId - ID of the user requesting invoices
 * @param farmId - Optional ID of the farm to filter by
 * @returns Promise resolving to an array of invoices with customer names
 */
export async function getInvoices(userId: string, farmId?: string) {
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

        return await getInvoicesByFarm(db, targetFarmIds[0])
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', { cause: error })
    }
}

/**
 * Retrieve full details for a single invoice including its line items and associated customer profile.
 *
 * @param userId - ID of the user requesting the invoice
 * @param invoiceId - ID of the invoice to retrieve
 * @returns Promise resolving to the complete invoice profile or null if not found
 */
export async function getInvoiceById(userId: string, invoiceId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const invoice = await getInvoiceByIdRepo(db, invoiceId)

        if (!invoice) return null

        if (!userFarms.includes(invoice.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: invoice.farmId },
            })
        }

        const items = await getInvoiceItems(db, invoiceId)

        const fullInvoice = {
            ...invoice,
            items: items.map((item) => ({
                ...item,
                unitPrice: parseFloat(item.unitPrice),
                total: parseFloat(item.total),
            })),
        }

        return transformInvoiceData(fullInvoice as any)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', { cause: error })
    }
}

/**
 * Server function to retrieve an invoice by ID.
 */
export const getInvoiceByIdFn = createServerFn({ method: 'GET' })
    .inputValidator(getInvoiceByIdSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getInvoiceById(session.user.id, data.invoiceId)
    })

/**
 * Update the payment status of an invoice.
 *
 * @param userId - ID of the user performing the update
 * @param invoiceId - ID of the invoice
 * @param status - New payment status (unpaid, partial, paid)
 */
export async function updateInvoiceStatus(
    userId: string,
    invoiceId: string,
    status: 'unpaid' | 'partial' | 'paid',
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const invoice = await getInvoiceByIdRepo(db, invoiceId)

        if (!invoice) {
            throw new AppError('NOT_FOUND', { metadata: { invoiceId } })
        }

        if (!userFarms.includes(invoice.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: invoice.farmId },
            })
        }

        // Validate status
        const validationError = validateUpdateData({ status })
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                message: validationError,
            })
        }

        await updateInvoiceStatusRepo(db, invoiceId, status)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to update invoice status',
            cause: error,
        })
    }
}

/**
 * Server function to update invoice status.
 */
export const updateInvoiceStatusFn = createServerFn({ method: 'POST' })
    .inputValidator(updateInvoiceStatusSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return updateInvoiceStatus(session.user.id, data.invoiceId, data.status)
    })

/**
 * Permanently delete an invoice and its associated line items.
 *
 * @param userId - ID of the user performing the deletion
 * @param invoiceId - ID of the invoice to delete
 */
export async function deleteInvoice(userId: string, invoiceId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const invoice = await getInvoiceByIdRepo(db, invoiceId)

        if (!invoice) {
            throw new AppError('NOT_FOUND', { metadata: { invoiceId } })
        }

        if (!userFarms.includes(invoice.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: invoice.farmId },
            })
        }

        await deleteInvoiceItemsRepo(db, invoiceId)
        await deleteInvoiceRepo(db, invoiceId)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to delete invoice',
            cause: error,
        })
    }
}

/**
 * Utility function to convert a sales transaction into a professional invoice.
 * Automatically maps livestock type and quantity to an invoice line item.
 *
 * @param userId - ID of the user creating the invoice
 * @param saleId - ID of the sale to bill for
 * @returns Promise resolving to the new invoice ID or null if sale/customer invalid
 */
export async function createInvoiceFromSale(
    userId: string,
    saleId: string,
): Promise<string | null> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        const userFarms = await getUserFarms(userId)
        const sale = await getSaleForInvoice(db, saleId)

        if (!sale || !sale.customerId) return null

        if (!userFarms.includes(sale.farmId)) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: sale.farmId },
            })
        }

        return await createInvoice(userId, {
            customerId: sale.customerId,
            farmId: sale.farmId,
            items: [
                {
                    description: `${sale.livestockType} - ${sale.quantity} units`,
                    quantity: sale.quantity,
                    unitPrice: parseFloat(sale.unitPrice),
                },
            ],
        })
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to create invoice from sale',
            cause: error,
        })
    }
}

/**
 * Retrieve a paginated list of invoices with advanced searching, status filtering, and sorting.
 *
 * @param userId - ID of the user requesting invoices
 * @param query - Query and pagination parameters
 * @returns Promise resolving to a paginated set of invoice records
 */
export async function getInvoicesPaginated(
    userId: string,
    query: InvoiceQuery = {},
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

        // Pass all farm IDs to repository (now supports arrays)
        const result = await getInvoicesPaginatedRepo(db, {
            ...query,
            farmId: targetFarmIds,
        })

        return {
            ...result,
            data: result.data.map((d) => ({
                ...d,
                totalAmount: parseFloat(d.totalAmount),
            })),
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', { cause: error })
    }
}

/**
 * Server function to retrieve paginated invoices.
 */
export const getInvoicesPaginatedFn = createServerFn({ method: 'GET' })
    .inputValidator(invoiceQuerySchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getInvoicesPaginated(session.user.id, data)
    })
export type { CreateInvoiceInput } from './types'

/**
 * Server function to delete an invoice.
 */
export const deleteInvoiceFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ invoiceId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return deleteInvoice(session.user.id, data.invoiceId)
    })
