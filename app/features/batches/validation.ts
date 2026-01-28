import type { BatchSearchParams } from './types'

/**
 * Validates and normalizes batch search parameters from URL search params
 */
export function validateBatchSearch(
    search: Record<string, unknown>,
): BatchSearchParams {
    const validStatuses = ['active', 'depleted', 'sold'] as const
    const validLivestockTypes = ['poultry', 'fish'] as const
    const validSortBy = [
        'species',
        'currentQuantity',
        'status',
        'livestockType',
        'acquisitionDate',
        'createdAt',
    ] as const

    return {
        farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
        page: Number(search.page) || 1,
        pageSize: Number(search.pageSize) || 10,
        sortBy:
            typeof search.sortBy === 'string' &&
            (validSortBy as ReadonlyArray<string>).includes(search.sortBy)
                ? search.sortBy
                : 'createdAt',
        sortOrder:
            typeof search.sortOrder === 'string' &&
            (search.sortOrder === 'asc' || search.sortOrder === 'desc')
                ? search.sortOrder
                : 'desc',
        q: typeof search.q === 'string' ? search.q : '',
        status:
            typeof search.status === 'string' &&
            (validStatuses as ReadonlyArray<string>).includes(search.status)
                ? (search.status as 'active' | 'depleted' | 'sold')
                : undefined,
        livestockType:
            typeof search.livestockType === 'string' &&
            (validLivestockTypes as ReadonlyArray<string>).includes(
                search.livestockType,
            )
                ? (search.livestockType as 'poultry' | 'fish')
                : undefined,
        breedId:
            typeof search.breedId === 'string' ? search.breedId : undefined,
    }
}
