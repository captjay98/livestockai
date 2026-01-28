/**
 * Shared TypeScript types for OpenLivestock
 */

/**
 * Base pagination query parameters
 * Features can extend this with additional filters
 */
export interface BasePaginatedQuery {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    farmId?: string
}

/**
 * Standard paginated response wrapper
 */
export interface PaginatedResult<T> {
    data: Array<T>
    total: number
    page: number
    pageSize: number
    totalPages: number
}
