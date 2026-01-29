import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createFeedRecordFn,
  deleteFeedRecordFn,
  updateFeedRecordFn,
} from './server'
import type { CreateFeedRecordInput } from './server'
import type { FeedRecord } from '~/components/feed/feed-columns'
import type { FeedSearchParams } from './types'

interface UseFeedPageProps {
  selectedFarmId: string | null
  routePath: string
}

export function useFeedPage({ selectedFarmId, routePath }: UseFeedPageProps) {
  const { t } = useTranslation(['feed', 'common'])
  const navigate = useNavigate({ from: routePath as any })

  const [selectedRecord, setSelectedRecord] = useState<FeedRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateSearch = (updates: Partial<FeedSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: FeedSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleCreateSubmit = async (
    data: Omit<CreateFeedRecordInput, 'quantityKg' | 'cost'> & {
      quantityKg: string | number
      cost: string | number
    },
  ) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          record: {
            ...data,
            quantityKg: parseFloat(data.quantityKg as string),
            cost: parseFloat(data.cost as string),
          },
        },
      })
      toast.success(t('feed:messages.recorded'))
    } catch (err) {
      toast.error(t('common:error.save'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (
    data: Partial<CreateFeedRecordInput> & {
      quantityKg?: string | number
      cost?: string | number
    },
  ) => {
    if (!selectedRecord || !selectedFarmId) return
    setIsSubmitting(true)
    try {
      await updateFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
          data: {
            ...data,
            quantityKg: data.quantityKg
              ? parseFloat(String(data.quantityKg))
              : undefined,
            cost: data.cost ? parseFloat(String(data.cost)) : undefined,
            date: data.date ? new Date(data.date as string | Date) : undefined,
          },
        },
      })
      toast.success(t('feed:messages.updated'))
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
    } catch (err) {
      toast.error(t('common:error.delete'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
