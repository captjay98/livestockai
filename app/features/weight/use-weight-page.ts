import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type {
  Batch,
  WeightSample,
  WeightSearchParams,
} from '~/features/weight/types'
import type { PaginatedResult } from '~/features/weight/server'
import type { GrowthAlert } from '~/components/weight/growth-alerts'
import type { WeightFormData } from '~/components/weight/weight-form-dialog'
import {
  createWeightSampleFn,
  deleteWeightSampleFn,
  getWeightDataForFarm,
  updateWeightSampleFn,
} from '~/features/weight/server'

interface UseWeightPageProps {
  selectedFarmId?: string | null
  searchParams: WeightSearchParams
  routePath: string
}

export function useWeightPage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseWeightPageProps) {
  const { t } = useTranslation(['weight', 'common'])
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<WeightSample>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [alerts, setAlerts] = useState<Array<GrowthAlert>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<WeightSample | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getWeightDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
        },
      })
      setPaginatedRecords(result.paginatedRecords)
      setBatches(result.batches)
      setAlerts(result.alerts as Array<GrowthAlert>)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedFarmId, searchParams])

  const updateSearch = (updates: Partial<WeightSearchParams>) => {
    navigate({
    // @ts-ignore - Type limitation
      search: (prev: WeightSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleFormSubmit = async (
    data: WeightFormData,
    mode: 'create' | 'edit',
  ) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        await createWeightSampleFn({
          data: {
            farmId: selectedFarmId,
            data: {
              batchId: data.batchId,
              date: new Date(data.date),
              sampleSize: parseInt(data.sampleSize),
              averageWeightKg: parseFloat(data.averageWeightKg),
            },
          },
        })
        toast.success(
          t('weight:recorded', { defaultValue: 'Weight sample recorded' }),
        )
      } else {
        if (!selectedRecord) return
        await updateWeightSampleFn({
          data: {
            recordId: selectedRecord.id,
            data: {
              sampleSize: parseInt(data.sampleSize),
              averageWeightKg: parseFloat(data.averageWeightKg),
              date: new Date(data.date),
            },
          },
        })
        toast.success(t('common:updated', { defaultValue: 'Sample updated' }))
      }
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await deleteWeightSampleFn({ data: { recordId: selectedRecord.id } })
      toast.success(t('common:deleted', { defaultValue: 'Sample deleted' }))
      loadData()
    } catch (err) {
      console.error(err)
      toast.error(
        t('common:error.delete', { defaultValue: 'Failed to delete' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    paginatedRecords,
    batches,
    alerts,
    isLoading,
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleFormSubmit,
    handleDeleteConfirm,
  }
}
