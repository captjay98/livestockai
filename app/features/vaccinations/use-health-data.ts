import { useEffect, useState } from 'react'
import { getHealthDataForFarm } from './server'
import type { HealthRecord } from '~/components/vaccinations/health-columns'
import type { AlertData, Batch, PaginatedQuery } from './types'
import type { PaginatedResult } from './server'

export function useHealthData(farmId: string, searchParams: PaginatedQuery) {
  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<HealthRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [alerts, setAlerts] = useState<AlertData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getHealthDataForFarm({
        data: {
          farmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.search,
          type: searchParams.type,
        },
      })
      setPaginatedRecords(
        result.paginatedRecords as PaginatedResult<HealthRecord>,
      )
      setBatches(result.batches as Array<Batch>)
      setAlerts(result.alerts as AlertData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [farmId, searchParams])

  return {
    paginatedRecords,
    batches,
    alerts,
    isLoading,
    refetch: loadData,
  }
}
