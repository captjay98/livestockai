import type { MortalitySearchParams } from './types'

export function validateMortalitySearch(
  search: Record<string, unknown>,
): MortalitySearchParams {
  const validSortBy = ['date', 'quantity', 'cause', 'createdAt'] as const

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
    cause: typeof search.cause === 'string' ? search.cause : undefined,
  }
}
