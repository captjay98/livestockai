import { useQuery } from '@tanstack/react-query'
import { getHealthRecordsPaginatedFn } from './server'
import { HEALTH_QUERY_KEYS } from './mutations'

export function useHealthRecords(farmId: string | null) {
  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.list(farmId || undefined),
    queryFn: async () => {
      if (!farmId) return { records: [], total: 0 }
      return getHealthRecordsPaginatedFn({ data: { farmId } })
    },
    enabled: !!farmId,
  })
}
