
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  deleteMortalityRecordFn,
  getMortalityDataForFarmFn,
  recordMortalityActionFn,
  updateMortalityRecordFn,
} from './server'
import type { PaginatedResult } from '~/lib/types'
import type { MortalityRecord } from '~/components/mortality/mortality-columns'
import type { BatchAlert } from '~/features/monitoring/server'
import type { Batch, MortalitySearchParams } from './types'

interface UseMortalityPageProps {
  selectedFarmId?: string | null
  searchParams: MortalitySearchParams
  routePath: string
}

export function useMortalityPage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseMortalityPageProps) {
  const { t } = useTranslation(['mortality', 'common'])
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<MortalityRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [alerts, setAlerts] = useState<Array<BatchAlert>>([])
  const [summary, setSummary] = useState<{
    totalDeaths: number
    recordCount: number
    criticalAlerts: number
    totalAlerts: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<MortalityRecord | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getMortalityDataForFarmFn({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          cause: searchParams.cause,
        },
      })
      setPaginatedRecords(result.paginatedRecords as PaginatedResult<MortalityRecord>)
      setBatches(result.batches)
      setAlerts(result.alerts)
      setSummary(result.summary)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedFarmId, searchParams])

  const updateSearch = (updates: Partial<MortalitySearchParams>) => {
    navigate({
      // @ts-ignore - TanStack Router type limitation
      search: (prev: any) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleRecordSubmit = async (data: any) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await recordMortalityActionFn({
        data: {
          farmId: selectedFarmId,
          ...data,
          quantity: parseInt(data.quantity),
        },
      })
      toast.success(t('mortality:recorded'))
      loadData()
    } catch (err) {
      toast.error(t('mortality:error.record'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await updateMortalityRecordFn({
        data: {
          recordId: selectedRecord.id,
          data: {
            ...data,
            quantity: parseInt(data.quantity),
            date: new Date(data.date),
          },
        },
      })
      toast.success(t('common:updated'))
      loadData()
    } catch (err) {
      toast.error(t('common:error.update'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await deleteMortalityRecordFn({ data: { recordId: selectedRecord.id } })
      toast.success(t('common:deleted'))
      loadData()
    } catch (err) {
      toast.error(t('common:error.delete'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    paginatedRecords,
    batches,
    alerts,
    summary,
    isLoading,
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleRecordSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
