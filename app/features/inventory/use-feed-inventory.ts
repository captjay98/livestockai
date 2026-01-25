import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createFeedInventoryFn,
  deleteFeedInventoryFn,
  updateFeedInventoryFn,
} from './feed-server'
import type { FeedType } from './index'

export function useFeedInventory(selectedFarmId: string | null) {
  const { t } = useTranslation(['inventory'])
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createFeed = async (data: {
    feedType: FeedType
    quantityKg: number
    minThresholdKg: number
  }) => {
    if (!selectedFarmId) {
      toast.error('No farm selected')
      return
    }
    setIsSubmitting(true)
    try {
      await createFeedInventoryFn({
        data: { input: { farmId: selectedFarmId, ...data } },
      })
      toast.success(t('feed.recorded'))
      await router.invalidate() // Reload to refresh loader data
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFeed = async (
    id: string,
    data: {
      quantityKg: number
      minThresholdKg: number
    },
  ) => {
    setIsSubmitting(true)
    try {
      await updateFeedInventoryFn({ data: { id, input: data } })
      await router.invalidate() // Reload to refresh loader data
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteFeed = async (id: string) => {
    setIsSubmitting(true)
    try {
      await deleteFeedInventoryFn({ data: { id } })
      toast.success(t('feed.deleted'))
      await router.invalidate() // Reload to refresh loader data
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    createFeed,
    updateFeed,
    deleteFeed,
  }
}
