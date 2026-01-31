import { MODULE_METADATA } from '../modules/constants'
import type { FeedSearchParams } from './types'
import type { ModuleKey } from '../modules/types'

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
    feedType:
      typeof search.feedType === 'string'
        ? search.feedType.replace(/_/g, '-')
        : undefined,
  }
}

/**
 * Validates that a feed type is compatible with a livestock type
 * @param feedType - The feed type to validate
 * @param livestockType - The livestock type from the batch
 * @returns true if compatible, false otherwise
 */
export function validateFeedTypeForLivestock(
  feedType: string,
  livestockType: string,
): boolean {
  // Map livestock types to module keys
  const livestockToModule: Partial<Record<string, ModuleKey>> = {
    poultry: 'poultry',
    fish: 'aquaculture',
    cattle: 'cattle',
    goats: 'goats',
    sheep: 'sheep',
    bees: 'bees',
  }

  const moduleKey = livestockToModule[livestockType]
  if (!moduleKey) return false

  const moduleMetadata = MODULE_METADATA[moduleKey]
  return (moduleMetadata.feedTypes as Array<string>).includes(feedType)
}
