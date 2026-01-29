import type { WeightSearchParams } from './types'

export function validateWeightSearch(
  search: Record<string, unknown>,
): WeightSearchParams {
  const validSortBy = [
    'date',
    'averageWeightKg',
    'sampleSize',
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
    batchId: typeof search.batchId === 'string' ? search.batchId : undefined,
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }
}
