import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

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
    customerType?:
        | 'individual'
        | 'restaurant'
        | 'retailer'
        | 'wholesaler'
        | null
}

/**
 * Filter and pagination parameters for querying customers.
 */
export interface CustomerQuery extends BasePaginatedQuery {
    /** Filter by a specific customer classification */
    customerType?: string
}

/**
 * Search parameters for customers route
 */
export interface CustomerSearchParams {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    q?: string
    customerType?: string
}

/**
 * Top customer data for dashboard
 */
export interface TopCustomer {
    id: string
    name: string
    phone: string
    totalSpent: number
    salesCount: number
}

/**
 * Customer form data
 */
export interface CustomerFormData {
    name: string
    phone: string
    email: string
    location: string
    customerType: string
}
