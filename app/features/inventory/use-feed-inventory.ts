import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createFeedInventoryFn,
  deleteFeedInventoryFn,
  getFeedInventoryFn,
  updateFeedInventoryFn,
} from './feed-server'
import type { FeedInventoryItem, FeedType } from './index'

export function useFeedInventory(selectedFarmId: string | null) {
  const { t } = useTranslation(['inventory'])
  const [feedInventory, setFeedInventory] = useState<Array<FeedInventoryItem>>(
    [],
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadFeedData = async () => {
    setIsLoading(true)
    try {
      const result = await getFeedInventoryFn({
        data: { farmId: selectedFarmId || undefined },
      })
      setFeedInventory(result as Array<FeedInventoryItem>)
    } catch (err) {
      console.error('Failed to load feed inventory', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeedData()
  }, [selectedFarmId])

  const createFeed = async (data: {
    feedType: FeedType
    quantityKg: number
    minThresholdKg: number
  }) => {
    if (!selectedFarmId) throw new Error('No farm selected')
    setIsSubmitting(true)
    try {
      await createFeedInventoryFn({
        data: { input: { farmId: selectedFarmId, ...data } },
      })
      toast.success(t('feed.recorded'))
      await loadFeedData()
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
      await loadFeedData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteFeed = async (id: string) => {
    setIsSubmitting(true)
    try {
      await deleteFeedInventoryFn({ data: { id } })
      toast.success(t('feed.deleted'))
      await loadFeedData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const lowStockCount = feedInventory.filter(
    (f) => parseFloat(f.quantityKg) <= parseFloat(f.minThresholdKg),
  ).length

  return {
    feedInventory,
    isLoading,
    isSubmitting,
    lowStockCount,
    refetch: loadFeedData,
    createFeed,
    updateFeed,
    deleteFeed,
  }
}
