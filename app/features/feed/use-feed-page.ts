import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createFeedRecordFn,
  deleteFeedRecordFn,
  getFeedDataForFarm,
  updateFeedRecordFn,
} from './server'
import type { PaginatedResult } from '~/lib/types'
import type { FeedRecord } from '~/components/feed/feed-columns'
import type { Batch, FeedInventory, FeedSearchParams } from './types'

interface UseFeedPageProps {
  selectedFarmId: string | null
  searchParams: FeedSearchParams
  routePath: string
}

export function useFeedPage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseFeedPageProps) {
  const { t } = useTranslation(['feed', 'common'])
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<FeedRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [inventory, setInventory] = useState<Array<FeedInventory>>([])
  const [summary, setSummary] = useState<{
    totalQuantityKg: number
    totalCost: number
    recordCount: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<FeedRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getFeedDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          feedType: searchParams.feedType,
        },
      })
      setPaginatedRecords(
        result.paginatedRecords as PaginatedResult<FeedRecord>,
      )
      setBatches(result.batches)
      setInventory(result.inventory as Array<FeedInventory>)
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

  const updateSearch = (updates: Partial<FeedSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: any) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleCreateSubmit = async (data: any) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          ...data,
          quantityKg: parseFloat(data.quantityKg),
          cost: parseFloat(data.cost),
        },
      })
      toast.success(t('feed:messages.recorded'))
      loadData()
    } catch (err) {
      toast.error(t('common:error.save'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedRecord || !selectedFarmId) return
    setIsSubmitting(true)
    try {
      await updateFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
          data: {
            ...data,
            quantityKg: parseFloat(data.quantityKg),
            cost: parseFloat(data.cost),
            date: new Date(data.date),
          },
        },
      })
      toast.success(t('feed:messages.updated'))
      loadData()
    } catch (err) {
      toast.error(t('common:error.update'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord || !selectedFarmId) return
    setIsSubmitting(true)
    try {
      await deleteFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
        },
      })
      toast.success(t('feed:messages.deleted'))
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
    inventory,
    summary,
    isLoading,
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
