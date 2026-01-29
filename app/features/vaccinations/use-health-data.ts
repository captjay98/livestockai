import type { PaginatedQuery } from './types'

export function useHealthData(_farmId: string, _searchParams: PaginatedQuery) {
  // Hook no longer fetches data - data comes from route loader
  return {
    // These are now provided by the route loader
    paginatedRecords: {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    },
    batches: [],
    alerts: null,
    isLoading: false,
    refetch: () => {},
  }
}
