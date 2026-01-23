import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createEggRecordAction,
  deleteEggRecordFn,
  getEggDataForFarm,
  updateEggRecordFn,
} from './server'
import type { EggBatch, EggSearchParams, EggSummary } from './types'
import type { PaginatedResult } from './server'
import type { EggCollectionWithDetails } from './repository'

interface UseEggPageProps {
  selectedFarmId: string | null
  searchParams: EggSearchParams
  routePath: string
}

export function useEggPage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseEggPageProps) {
  const { t } = useTranslation(['eggs', 'common'])
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<EggCollectionWithDetails>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<EggBatch>>([])
  const [summary, setSummary] = useState<EggSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] =
    useState<EggCollectionWithDetails | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getEggDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.search,
        },
      })
      setPaginatedRecords(result.paginatedRecords)
      setBatches(result.batches as any)
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
    searchParams.search,
  ])

  const updateSearch = (updates: Partial<EggSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: any) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleAddSubmit = async (data: any) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createEggRecordAction({
        data: {
          farmId: selectedFarmId,
          batchId: data.batchId,
          date: data.date,
          quantityCollected: data.quantityCollected,
          quantityBroken: data.quantityBroken,
          quantitySold: data.quantitySold,
        },
      })
      toast.success(t('eggs:recorded', { defaultValue: 'Egg record added' }))
      loadData()
      return true // Signal success to close dialog
    } catch (error) {
      console.error('Failed to add egg record:', error)
      return false // Signal failure to keep dialog open
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await updateEggRecordFn({
        data: {
          recordId: selectedRecord.id,
          data: {
            date: new Date(data.date),
            quantityCollected: data.quantityCollected,
            quantityBroken: data.quantityBroken,
            quantitySold: data.quantitySold,
          },
        },
      })
      toast.success(t('common:updated', { defaultValue: 'Egg record updated' }))
      loadData()
      return true // Signal success to close dialog
    } catch (error) {
      console.error('Failed to update egg record:', error)
      return false // Signal failure to keep dialog open
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord || !selectedFarmId) return
    setIsSubmitting(true)
    try {
      await deleteEggRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
        },
      })
      toast.success(t('common:deleted', { defaultValue: 'Egg record deleted' }))
      loadData()
      return true // Signal success to close dialog
    } catch (error) {
      console.error('Failed to delete egg record:', error)
      return false // Signal failure to keep dialog open
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    paginatedRecords,
    batches,
    summary,
    isLoading,
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleAddSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
