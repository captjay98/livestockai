import type { EggSearchParams } from './types'

export function validateEggSearch(
  search: Record<string, unknown>,
): EggSearchParams {
  const validSortBy = [
    'date',
    'quantityCollected',
    'quantityBroken',
    'quantitySold',
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
    search: typeof search.search === 'string' ? search.search : '',
  }
}
