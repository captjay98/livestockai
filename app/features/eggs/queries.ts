import { useQuery } from '@tanstack/react-query'
import { getEggDataForFarmFn } from './server'
import { EGG_QUERY_KEYS } from './mutations'

export function useEggRecords(farmId: string | null) {
  return useQuery({
    queryKey: EGG_QUERY_KEYS.list(farmId || undefined),
    queryFn: async () => {
      if (!farmId) {
        return {
          paginatedRecords: {
            data: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            pageSize: 10,
          },
          summary: {
            totalCollected: 0,
            totalBroken: 0,
            totalSold: 0,
            currentInventory: 0,
            recordCount: 0,
          },
          batches: [],
        }
      }
      return getEggDataForFarmFn({ data: { farmId } })
    },
    enabled: !!farmId,
  })
}

export function usePoultryBatchesForEggs(farmId: string | null) {
  return useQuery({
    queryKey: EGG_QUERY_KEYS.poultryBatches(farmId),
    queryFn: async () => {
      if (!farmId) return []
      const data = await getEggDataForFarmFn({ data: { farmId } })
      // Extract unique batches from records
      const batchMap = new Map()
      for (const record of data.paginatedRecords.data) {
        if (record.batchId && !batchMap.has(record.batchId)) {
          batchMap.set(record.batchId, {
            id: record.batchId,
            species: record.batchSpecies || 'Unknown',
          })
        }
      }
      return Array.from(batchMap.values())
    },
    enabled: !!farmId,
  })
}
