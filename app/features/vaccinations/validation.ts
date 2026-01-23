export interface VaccinationSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  type?: 'all' | 'vaccination' | 'treatment'
}

export function validateVaccinationSearch(
  search: Record<string, unknown>,
): VaccinationSearchParams {
  const validSortBy = ['date', 'name', 'type', 'createdAt'] as const

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
    type:
      typeof search.type === 'string' &&
      ['all', 'vaccination', 'treatment'].includes(search.type)
        ? (search.type as 'all' | 'vaccination' | 'treatment')
        : 'all',
  }
}
