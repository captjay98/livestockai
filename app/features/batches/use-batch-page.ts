import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { PaginatedResult } from '~/features/batches/server'
import type { Batch } from '~/components/batches/batch-columns'
import type {
  BatchSearchParams,
  InventorySummary,
} from '~/features/batches/types'
import {
  deleteBatchFn,
  getBatchesForFarmFn,
  updateBatchFn,
} from '~/features/batches/server'

interface UseBatchPageProps {
  selectedFarmId?: string | null
  searchParams: BatchSearchParams
  routePath: string
}

export function useBatchPage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseBatchPageProps) {
  const { t } = useTranslation(['batches'])
  const navigate = useNavigate({ from: routePath as any })
  const queryClient = useQueryClient()

  const [paginatedBatches, setPaginatedBatches] = useState<
    PaginatedResult<Batch>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getBatchesForFarmFn({
        data: {
          farmId: selectedFarmId || undefined,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          status: searchParams.status,
          livestockType: searchParams.livestockType,
        },
      })
      setPaginatedBatches(result.paginatedBatches)
      setSummary(result.summary)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    selectedFarmId,
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.status,
    searchParams.livestockType,
  ])

  const updateSearch = (updates: Partial<BatchSearchParams>) => {
    // @ts-ignore - TanStack Router type limitation
    navigate({
      search: (prev: any) => ({
        ...prev,
        ...updates,
      }),
    } as any)
  }

  const handleEditSubmit = async (data: {
    currentQuantity: string
    status: 'active' | 'depleted' | 'sold'
  }) => {
    if (!selectedBatch) return

    setIsSubmitting(true)
    try {
      await updateBatchFn({
        data: {
          batchId: selectedBatch.id,
          batch: {
            status: data.status,
          },
        },
      })
      toast.success(t('messages.updated', { defaultValue: 'Batch updated' }))
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return

    setIsSubmitting(true)
    try {
      await deleteBatchFn({
        data: { batchId: selectedBatch.id },
      })
      toast.success(t('messages.deleted', { defaultValue: 'Batch deleted' }))
      queryClient.invalidateQueries({
        queryKey: ['farm-modules', selectedFarmId],
      })
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    paginatedBatches,
    summary,
    isLoading,
    selectedBatch,
    setSelectedBatch,
    isSubmitting,
    updateSearch,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
