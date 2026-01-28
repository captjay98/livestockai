import type { InvoiceSearchParams } from './types'

export function validateInvoiceSearch(
    search: Record<string, unknown>,
): InvoiceSearchParams {
    const validSortBy = [
        'date',
        'dueDate',
        'totalAmount',
        'status',
        'invoiceNumber',
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
        status:
            typeof search.status === 'string'
                ? (search.status as 'paid' | 'partial' | 'unpaid' | 'all')
                : 'all',
    }
}
