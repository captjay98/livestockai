import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  deleteReadingFn,
  getWaterQualityDataForFarmFn,
  insertReadingFn,
  updateReadingFn,
} from './server'
import type { PaginatedResult } from '~/lib/types'
import type {
  Batch,
  WaterQualityRecord,
  WaterQualitySearchParams,
} from './types'

interface UseWaterQualityPageProps {
  selectedFarmId: string | null
  searchParams: WaterQualitySearchParams
  routePath: string
}

export function useWaterQualityPage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseWaterQualityPageProps) {
  const { t } = useTranslation(['waterQuality', 'common'])
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<WaterQualityRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [selectedRecord, setSelectedRecord] =
    useState<WaterQualityRecord | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getWaterQualityDataForFarmFn({
        data: {
          farmId: selectedFarmId ?? undefined,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
        },
      })
      setPaginatedRecords(
        result.paginatedRecords as PaginatedResult<WaterQualityRecord>,
      )
      setBatches(result.batches as Array<Batch>)
    } catch (err) {
      console.error('Failed to load water quality data:', err)
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
  ])

  const updateSearch = (updates: Partial<WaterQualitySearchParams>) => {
    navigate({
    // @ts-ignore - Type limitation
      search: (prev: WaterQualitySearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleAddSubmit = async (data: any) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)

    try {
      await insertReadingFn({
        data: {
          farmId: selectedFarmId,
          data: {
            batchId: data.batchId,
            date: new Date(data.date),
            ph: parseFloat(data.ph),
            temperatureCelsius: parseFloat(data.temperatureCelsius),
            dissolvedOxygenMgL: parseFloat(data.dissolvedOxygenMgL),
            ammoniaMgL: parseFloat(data.ammoniaMgL),
          },
        },
      })
      toast.success(
        t('waterQuality:recorded', { defaultValue: 'Water quality recorded' }),
      )
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await updateReadingFn({
        data: {
          recordId: selectedRecord.id,
          data: {
            ph: parseFloat(data.ph),
            temperatureCelsius: parseFloat(data.temperatureCelsius),
            dissolvedOxygenMgL: parseFloat(data.dissolvedOxygenMgL),
            ammoniaMgL: parseFloat(data.ammoniaMgL),
            date: new Date(data.date),
            notes: data.notes || undefined,
          },
        },
      })
      toast.success(t('common:updated', { defaultValue: 'Record updated' }))
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await deleteReadingFn({
        data: { recordId: selectedRecord.id },
      })
      toast.success(t('common:deleted', { defaultValue: 'Record deleted' }))
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    paginatedRecords,
    batches,
    selectedRecord,
    setSelectedRecord,
    isLoading,
    isSubmitting,
    updateSearch,
    handleAddSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
