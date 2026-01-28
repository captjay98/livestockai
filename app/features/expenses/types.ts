import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

/**
 * Expense category type
 */
export type ExpenseCategory =
    | 'feed'
    | 'medicine'
    | 'equipment'
    | 'utilities'
    | 'labor'
    | 'transport'
    | 'livestock'
    | 'livestock_chicken'
    | 'livestock_fish'
    | 'maintenance'
    | 'marketing'
    | 'other'

/**
 * Data structure for recording a new financial expense.
 * Supports linking to specific batches, suppliers, and feed inventory.
 */
export interface CreateExpenseInput {
    /** ID of the farm incurred the expense */
    farmId: string
    /** Optional ID of a specific livestock batch for cost attribution */
    batchId?: string | null
    /** Specific expense classification */
    category: ExpenseCategory
    /** Monetary amount in system currency */
    amount: number
    /** Date the expense occurred */
    date: Date
    /** Brief description or item name */
    description: string
    /** Optional ID of the supplier for sourcing history */
    supplierId?: string | null
    /** Whether this is a recurring monthly/weekly cost */
    isRecurring?: boolean
    /** Specific feed category when category is 'feed' */
    feedType?: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed'
    /** Feed weight in kilograms for inventory tracking */
    feedQuantityKg?: number
}

/**
 * Data structure for updating an existing expense.
 */
export interface UpdateExpenseInput {
    /** Updated category */
    category?: ExpenseCategory
    /** Updated amount */
    amount?: number
    /** Updated date */
    date?: Date
    /** Updated description */
    description?: string
    /** Updated batch association */
    batchId?: string | null
    /** Updated supplier association */
    supplierId?: string | null
    /** Updated recurring flag */
    isRecurring?: boolean
}

/**
 * Filter and pagination parameters for querying expenses.
 */
export interface ExpenseQuery extends BasePaginatedQuery {
    /** Filter by a specific livestock batch */
    batchId?: string
    /** Filter by an expense category */
    category?: string
}

/**
 * Search parameters for expenses route
 */
export interface ExpenseSearchParams {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    q?: string
    category?: string
    farmId?: string
}

/**
 * Expenses summary data structure
 */
export interface ExpensesSummaryData {
    byCategory: Record<string, { count: number; amount: number }>
    total: { count: number; amount: number }
}

/**
 * Batch data for expense forms
 */
export interface ExpenseBatch {
    id: string
    species: string
    livestockType: string
    currentQuantity: number
    status: string
}

/**
 * Supplier data for expense forms
 */
export interface ExpenseSupplier {
    id: string
    name: string
}
