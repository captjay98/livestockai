import type { CustomerSearchParams } from './types'

export function validateCustomerSearch(
  search: Record<string, unknown>,
): CustomerSearchParams {
  const validSortBy = [
    'name',
    'phone',
    'email',
    'location',
    'customerType',
    'createdAt',
    'totalRevenue',
    'salesCount',
  ] as const

  return {
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
    q: (search.q as string) || '',
    customerType:
      typeof search.customerType === 'string' ? search.customerType : undefined,
  }
}
