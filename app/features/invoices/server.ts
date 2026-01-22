import { createServerFn } from '@tanstack/react-start'
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
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Represents a summarized invoice record for listing and reporting.
 */
export interface InvoiceRecord {
  /** Unique identifier for the invoice */
  id: string
  /** Human-readable invoice number (e.g., INV-2024-0001) */
  invoiceNumber: string
  /** Total value of all items in the invoice */
  totalAmount: number
  /** Payment status of the invoice */
  status: 'unpaid' | 'partial' | 'paid'
  /** Date the invoice was issued */
  date: Date
  /** Optional date by which payment is expected */
  dueDate: Date | null
  /** Name of the customer associated with this invoice */
  customerName: string
}

/**
 * Data structure for creating a new invoice.
 */
export interface CreateInvoiceInput {
  /** ID of the customer being billed */
  customerId: string
  /** ID of the farm issuing the invoice */
  farmId: string
  /** List of line items to include */
  items: Array<{
    /** Description of the product or service */
    description: string
    /** Quantity sold */
    quantity: number
    /** Price per unit */
    unitPrice: number
  }>
  /** Optional payment deadline */
  dueDate?: Date | null
  /** Optional internal or external notes */
  notes?: string | null
}

/**
 * Filter and pagination parameters for querying invoices.
 */
export interface InvoiceQuery extends BasePaginatedQuery {
  /** Filter by payment status */
  status?: 'unpaid' | 'partial' | 'paid'
}

/**
 * Generate a unique, sequential invoice number for the current year.
 * Format: INV-YYYY-NNNN
 *
 * @param farmId - Farm ID to scope invoice numbers to
 * @returns Promise resolving to the next available invoice number
 */
export async function generateInvoiceNumber(farmId: string): Promise<string> {
  const { db } = await import('~/lib/db')

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
 * @param input - Billing details, customer, and items
 * @returns Promise resolving to the new invoice ID
 */
export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<string> {
  const { db } = await import('~/lib/db')

  try {
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
  .inputValidator((data: CreateInvoiceInput) => data)
  .handler(async ({ data }) => {
    return createInvoice(data)
  })

/**
 * Retrieve all invoices, optionally filtered by farm.
 *
 * @param farmId - Optional ID of the farm to filter by
 * @returns Promise resolving to an array of invoices with customer names
 */
export async function getInvoices(farmId?: string) {
  const { db } = await import('~/lib/db')

  try {
    if (!farmId) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Farm ID is required',
      })
    }

    return await getInvoicesByFarm(db, farmId)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', { cause: error })
  }
}

/**
 * Retrieve full details for a single invoice including its line items and associated customer profile.
 *
 * @param invoiceId - ID of the invoice to retrieve
 * @returns Promise resolving to the complete invoice profile or null if not found
 */
export async function getInvoiceById(invoiceId: string) {
  const { db } = await import('~/lib/db')

  try {
    const invoice = await getInvoiceByIdRepo(db, invoiceId)

    if (!invoice) return null

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
  .inputValidator((data: { invoiceId: string }) => data)
  .handler(async ({ data }) => {
    return getInvoiceById(data.invoiceId)
  })

/**
 * Update the payment status of an invoice.
 *
 * @param invoiceId - ID of the invoice
 * @param status - New payment status (unpaid, partial, paid)
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'unpaid' | 'partial' | 'paid',
) {
  const { db } = await import('~/lib/db')

  try {
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
  .inputValidator(
    (data: { invoiceId: string; status: 'unpaid' | 'partial' | 'paid' }) =>
      data,
  )
  .handler(async ({ data }) => {
    return updateInvoiceStatus(data.invoiceId, data.status)
  })

/**
 * Permanently delete an invoice and its associated line items.
 *
 * @param invoiceId - ID of the invoice to delete
 */
export async function deleteInvoice(invoiceId: string) {
  const { db } = await import('~/lib/db')

  try {
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
 * @param saleId - ID of the sale to bill for
 * @returns Promise resolving to the new invoice ID or null if sale/customer invalid
 */
export async function createInvoiceFromSale(
  saleId: string,
): Promise<string | null> {
  const { db } = await import('~/lib/db')

  try {
    const sale = await getSaleForInvoice(db, saleId)

    if (!sale || !sale.customerId) return null

    return await createInvoice({
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
 * @param query - Query and pagination parameters
 * @returns Promise resolving to a paginated set of invoice records
 */
export async function getInvoicesPaginated(query: InvoiceQuery = {}) {
  const { db } = await import('~/lib/db')

  try {
    const result = await getInvoicesPaginatedRepo(db, query)

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
  .inputValidator((data: InvoiceQuery) => data)
  .handler(async ({ data }) => {
    return getInvoicesPaginated(data)
  })
