import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

/**
 * Input data for creating a new sales record
 */
import type { SaleTable } from '~/lib/db/types/financial'

export type { PaginatedResult }

export type UnitType = 'bird' | 'kg' | 'crate' | 'piece'
export type PaymentStatus = 'paid' | 'pending' | 'partial'
export type PaymentMethod = 'cash' | 'transfer' | 'credit'

// ... existing imports

export interface CreateSaleInput {
  /** ID of the farm the sale belongs to */
  farmId: string
  /** Optional ID of the specific batch being sold from */
  batchId?: string | null
  /** Optional ID of the customer who made the purchase */
  customerId?: string | null
  /** The type of item sold (livestock type) */
  livestockType: SaleTable['livestockType']
  /** Quantity of items sold */
  quantity: number
  /** Unit price for the item sold */
  unitPrice: number
  /** Date of the transaction */
  date: Date
  /** Optional transaction notes */
  notes?: string | null
  // Enhanced fields
  /** The unit of measurement for quantity (bird, kg, crate, piece) */
  unitType?: UnitType | null
  /** Optional age of the livestock in weeks at time of sale */
  ageWeeks?: number | null
  /** Optional average weight in kilograms at time of sale */
  averageWeightKg?: number | null
  /** Status of the payment (paid, pending, partial) */
  paymentStatus?: PaymentStatus | null
  /** Method of payment used (cash, transfer, credit) */
  paymentMethod?: PaymentMethod | null
}

/**
 * Input data for updating an existing sales record
 */
export interface UpdateSaleInput {
  /** Updated quantity sold */
  quantity?: number
  /** Updated unit price */
  unitPrice?: number
  /** Updated transaction date */
  date?: Date
  /** Updated transaction notes */
  notes?: string | null
  // Enhanced fields
  /** Updated unit type */
  unitType?: UnitType | null
  /** Updated age in weeks */
  ageWeeks?: number | null
  /** Updated average weight in kg */
  averageWeightKg?: number | null
  /** Updated payment status */
  paymentStatus?: PaymentStatus | null
  /** Updated payment method */
  paymentMethod?: PaymentMethod | null
}

/**
 * Paginated sales query with sorting and search
 */
export interface SalesQuery extends BasePaginatedQuery {
  batchId?: string
  livestockType?: string
  paymentStatus?: string
}

/**
 * Search parameters for sales route
 */
export interface SalesSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  livestockType?: string
  paymentStatus?: string
  farmId?: string
}

/**
 * Sales summary data structure
 */
export interface SalesSummaryData {
  poultry: { count: number; quantity: number; revenue: number }
  fish: { count: number; quantity: number; revenue: number }
  cattle: { count: number; quantity: number; revenue: number }
  goats: { count: number; quantity: number; revenue: number }
  sheep: { count: number; quantity: number; revenue: number }
  bees: { count: number; quantity: number; revenue: number }
  total: { count: number; quantity: number; revenue: number }
}

/**
 * Batch data for sales forms
 */
export interface SaleBatch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

/**
 * Customer data for sales forms
 */
export interface SaleCustomer {
  id: string
  name: string
  phone: string
}

/**
 * Validate search parameters for sales route
 */
export function validateSalesSearch(
  search: Record<string, unknown>,
): SalesSearchParams {
  const validSortBy = [
    'date',
    'totalAmount',
    'quantity',
    'livestockType',
    'paymentStatus',
    'createdAt',
  ] as const
  return {
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy:
      typeof search.sortBy === 'string' &&
      (validSortBy as ReadonlyArray<string>).includes(search.sortBy)
        ? search.sortBy
        : 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    livestockType:
      typeof search.livestockType === 'string'
        ? search.livestockType
        : undefined,
    paymentStatus:
      typeof search.paymentStatus === 'string'
        ? search.paymentStatus
        : undefined,
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }
}
