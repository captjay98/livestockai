import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

/**
 * Represents a supplier record with aggregated spending metrics.
 */
export interface SupplierRecord {
  /** Unique identifier for the supplier */
  id: string
  /** Name of the supplier or business entity */
  name: string
  /** Primary contact phone number */
  phone: string
  /** Optional contact email address */
  email: string | null
  /** Optional physical address or headquarters */
  location: string | null
  /** List of products or services provided by this supplier */
  products: Array<string>
  /** Specific classification (e.g., hatchery, feed mill) */
  supplierType: string | null
  /** Timestamp when the supplier was registered */
  createdAt: Date
  /** Aggregate total amount spent with this supplier in system currency */
  totalSpent?: number
  expenseCount?: number
}

/**
 * Data structure for creating a new supplier record.
 */
export interface CreateSupplierInput {
  /** Supplier's full name */
  name: string
  /** Contact phone number */
  phone: string
  /** Optional contact email */
  email?: string | null
  /** Optional location description */
  location?: string | null
  /** List of products supplied */
  products: Array<string>
  /** Category of supply provided */
  supplierType?:
    | 'hatchery'
    | 'feed_mill'
    | 'pharmacy'
    | 'equipment'
    | 'fingerlings'
    | 'cattle_dealer'
    | 'goat_dealer'
    | 'sheep_dealer'
    | 'bee_supplier'
    | 'other'
    | null
}

/**
 * Filter and pagination parameters for querying suppliers.
 */
export interface SupplierQuery extends BasePaginatedQuery {
  /** Filter by a specific supplier classification */
  supplierType?: string
}

/**
 * Search parameters for suppliers route
 */
export interface SupplierSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  supplierType?: string
  q?: string
}

/**
 * Supplier data for display
 */
export interface Supplier {
  id: string
  name: string
  phone: string
  email: string | null
  location: string | null
  products: Array<string> | null
  supplierType: string | null
  totalSpent?: number
}
