import type { ExpenseSearchParams } from './types'

export function validateExpenseSearch(
    search: Record<string, unknown>,
): ExpenseSearchParams {
    const validSortBy = [
        'date',
        'amount',
        'category',
        'description',
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
        category:
            typeof search.category === 'string' ? search.category : undefined,
        farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
    }
}
