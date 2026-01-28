/**
 * Pure business logic for invoice operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateInvoiceInput } from './types'
import { multiply, toDbString } from '~/features/settings/currency'

/**
 * Line item for invoice calculations
 */
export interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
}

/**
 * Invoice data with parsed numeric amounts
 */
export interface InvoiceWithParsedAmounts {
    id: string
    invoiceNumber: string
    totalAmount: number
    status: 'unpaid' | 'partial' | 'paid'
    date: Date
    dueDate: Date | null
    notes: string | null
    customerId: string
    customerName: string
    customerPhone: string | null
    customerEmail: string | null
    customerLocation: string | null
    farmName: string
    farmLocation: string | null
    items: Array<{
        id: string
        description: string
        quantity: number
        unitPrice: number
        total: number
    }>
}

/**
 * Generate the next sequential invoice number based on the last invoice number.
 * Format: INV-YYYY-NNNN where NNNN is a zero-padded 4-digit sequence.
 *
 * @param lastNumber - The last invoice number (e.g., "INV-2024-0001") or null if no previous invoices
 * @returns The next invoice number in sequence
 *
 * @example
 * ```ts
 * generateInvoiceNumber(null)              // Returns: "INV-2024-0001"
 * generateInvoiceNumber("INV-2024-0001")   // Returns: "INV-2024-0002"
 * generateInvoiceNumber("INV-2024-9999")   // Returns: "INV-2024-10000"
 * ```
 */
export function generateInvoiceNumber(lastNumber: string | null): string {
    const year = new Date().getFullYear()
    const prefix = `INV-${year}-`

    if (!lastNumber || !lastNumber.startsWith(prefix)) {
        // First invoice of the year or format mismatch
        return `${prefix}0001`
    }

    // Extract the numeric portion after the prefix
    const numericPortion = lastNumber.replace(prefix, '')
    const lastSequence = parseInt(numericPortion, 10)

    if (isNaN(lastSequence)) {
        // Invalid format, start fresh
        return `${prefix}0001`
    }

    const nextSequence = lastSequence + 1
    // Pad to 4 digits minimum, but allow overflow beyond 9999
    const paddedSequence = nextSequence.toString().padStart(4, '0')

    return `${prefix}${paddedSequence}`
}

/**
 * Calculate the total for a single invoice line item.
 * Uses precise decimal arithmetic to avoid floating-point errors.
 *
 * @param quantity - Quantity of items
 * @param unitPrice - Price per unit
 * @returns Total as a decimal string for database storage
 *
 * @example
 * ```ts
 * calculateItemTotal(10, 5.50)    // Returns: "55.00"
 * calculateItemTotal(3, 99.99)    // Returns: "299.97"
 * calculateItemTotal(0, 10)       // Returns: "0.00"
 * ```
 */
export function calculateItemTotal(
    quantity: number,
    unitPrice: number,
): string {
    if (quantity <= 0 || unitPrice < 0) {
        return toDbString(0)
    }
    return toDbString(multiply(quantity, unitPrice))
}

/**
 * Calculate the total amount for all invoice items.
 * Sums the quantity * unitPrice for each item.
 *
 * @param items - Array of invoice line items
 * @returns Total as a decimal string for database storage
 *
 * @example
 * ```ts
 * calculateInvoiceTotal([
 *   { quantity: 10, unitPrice: 5.50 },
 *   { quantity: 5, unitPrice: 10.00 }
 * ]) // Returns: "105.00"
 * ```
 */
export function calculateInvoiceTotal(
    items: Array<{ quantity: number; unitPrice: number }>,
): string {
    if (items.length === 0) {
        return toDbString(0)
    }

    const total = items.reduce(
        (sum, item) => {
            const itemTotal = multiply(item.quantity, item.unitPrice)
            return sum.plus(itemTotal)
        },
        multiply(0, 0),
    )

    return toDbString(total)
}

/**
 * Transform invoice data by parsing string amounts to numbers.
 * PostgreSQL DECIMAL columns are returned as strings to preserve precision.
 *
 * @param invoice - Invoice data with string amounts from database
 * @returns Invoice data with parsed numeric amounts
 */
export function transformInvoiceData(
    invoice: InvoiceWithParsedAmounts,
): InvoiceWithParsedAmounts {
    return {
        ...invoice,
        totalAmount:
            typeof invoice.totalAmount === 'string'
                ? parseFloat(invoice.totalAmount)
                : invoice.totalAmount,
        items: invoice.items.map((item) => ({
            ...item,
            unitPrice:
                typeof item.unitPrice === 'string'
                    ? parseFloat(item.unitPrice)
                    : item.unitPrice,
            total:
                typeof item.total === 'string'
                    ? parseFloat(item.total)
                    : item.total,
        })),
    }
}

/**
 * Validate invoice data before creation.
 * Returns validation error message or null if valid.
 *
 * @param data - Invoice creation data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateInvoiceData({
 *   customerId: 'customer-1',
 *   farmId: 'farm-1',
 *   items: [{ description: 'Item', quantity: 10, unitPrice: 5.50 }]
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateInvoiceData({
 *   ...sameData,
 *   items: [{ description: 'Item', quantity: 0, unitPrice: 5.50 }]
 * })
 * // Returns: "Item quantity must be greater than 0"
 * ```
 */
export function validateInvoiceData(data: CreateInvoiceInput): string | null {
    if (!data.customerId || data.customerId.trim() === '') {
        return 'Customer is required'
    }

    if (!data.farmId || data.farmId.trim() === '') {
        return 'Farm is required'
    }

    if (data.items.length === 0) {
        return 'At least one item is required'
    }

    // Validate each item
    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]

        if (!item.description || item.description.trim() === '') {
            return `Item ${i + 1} description is required`
        }

        if (item.quantity <= 0) {
            return `Item ${i + 1} quantity must be greater than 0`
        }

        if (item.unitPrice < 0) {
            return `Item ${i + 1} unit price cannot be negative`
        }
    }

    return null
}

/**
 * Validate invoice update data.
 * Currently invoices are primarily status-updated after creation,
 * but this function is available for future extensibility.
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 */
export function validateUpdateData(data: {
    status?: 'unpaid' | 'partial' | 'paid'
}): string | null {
    if (data.status !== undefined) {
        const validStatuses = ['unpaid', 'partial', 'paid']
        if (!validStatuses.includes(data.status)) {
            return `Status must be one of: ${validStatuses.join(', ')}`
        }
    }

    return null
}
