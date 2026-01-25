import type { FeedSearchParams } from './types'

export function validateFeedSearch(
  search: Record<string, unknown>,
): FeedSearchParams {
  const validSortBy = [
    'date',
    'cost',
    'quantityKg',
    'feedType',
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
    feedType: typeof search.feedType === 'string' ? search.feedType : undefined,
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }
}
