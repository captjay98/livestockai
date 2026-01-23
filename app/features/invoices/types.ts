import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

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
 * Search parameters for invoices route
 */
export interface InvoiceSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  status?: 'paid' | 'partial' | 'unpaid' | 'all'
}

/**
 * Invoice data for display
 */
export interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  date: Date
  dueDate: Date | null
  totalAmount: number
  status: 'paid' | 'partial' | 'unpaid'
}
