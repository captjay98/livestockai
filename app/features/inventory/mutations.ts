import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createFeedInventoryFn,
  deleteFeedInventoryFn,
  updateFeedInventoryFn,
} from './feed-server'
import {
  createMedicationFn,
  deleteMedicationFn,
  updateMedicationFn,
} from './medication-server'
import type { FeedType } from '~/features/feed/constants'
import type { OptimisticContext } from '~/lib/optimistic-utils'
import { generateEntityTempId } from '~/lib/optimistic-utils'

export const INVENTORY_QUERY_KEYS = {
  feed: ['feed-inventory'] as const,
  medication: ['medication-inventory'] as const,
  supplies: ['supplies-inventory'] as const,
  lowStockSupplies: ['low-stock-supplies'] as const,
  expiringSupplies: ['expiring-supplies'] as const,
} as const

interface FeedInventoryCache {
  id: string
  farmId: string
  feedType: FeedType
  quantityKg: number
  minThresholdKg: number
  _isOptimistic?: boolean
  _tempId?: string
}

interface MedicationInventoryCache {
  id: string
  farmId: string
  medicationName: string
  quantity: number
  unit: string
  minThreshold: number
  _isOptimistic?: boolean
  _tempId?: string
}

export function useFeedMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['inventory'])

  const createFeed = useMutation<
    string,
    Error,
    {
      farmId: string
      feedType: FeedType
      quantityKg: number
      minThresholdKg: number
    },
    OptimisticContext<Array<FeedInventoryCache>>
  >({
    mutationFn: async ({ farmId, ...data }) => {
      return createFeedInventoryFn({ data: { input: { farmId, ...data } } })
    },
    onMutate: async ({ farmId, ...data }) => {
      await queryClient.cancelQueries({ queryKey: INVENTORY_QUERY_KEYS.feed })
      const previous = queryClient.getQueryData<Array<FeedInventoryCache>>(
        INVENTORY_QUERY_KEYS.feed,
      )
      const tempId = generateEntityTempId('feed-inventory')
      const optimistic: FeedInventoryCache = {
        id: tempId,
        farmId,
        ...data,
        _isOptimistic: true,
        _tempId: tempId,
      }
      queryClient.setQueryData<Array<FeedInventoryCache>>(
        INVENTORY_QUERY_KEYS.feed,
        (old = []) => [...old, optimistic],
      )
      return { previousData: previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          INVENTORY_QUERY_KEYS.feed,
          context.previousData,
        )
      }
      toast.error(
        err instanceof Error ? err.message : t('inventory:feed.error'),
      )
    },
    onSuccess: () => {
      toast.success(t('feed.recorded'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.feed })
    },
  })

  const updateFeed = useMutation<
    boolean,
    Error,
    {
      id: string
      quantityKg: number
      minThresholdKg: number
    },
    OptimisticContext<Array<FeedInventoryCache>>
  >({
    mutationFn: async ({ id, ...data }) => {
      return updateFeedInventoryFn({ data: { id, input: data } })
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: INVENTORY_QUERY_KEYS.feed })
      const previous = queryClient.getQueryData<Array<FeedInventoryCache>>([
        'feed-inventory',
      ])
      queryClient.setQueryData<Array<FeedInventoryCache>>(
        INVENTORY_QUERY_KEYS.feed,
        (old = []) =>
          old.map((item) => (item.id === id ? { ...item, ...data } : item)),
      )
      return { previousData: previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          INVENTORY_QUERY_KEYS.feed,
          context.previousData,
        )
      }
      toast.error(err instanceof Error ? err.message : t('common:error.update'))
    },
    onSuccess: () => {
      toast.success(t('common:updated'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.feed })
    },
  })

  const deleteFeed = useMutation<
    boolean,
    Error,
    string,
    OptimisticContext<Array<FeedInventoryCache>>
  >({
    mutationFn: async (id: string) => {
      return deleteFeedInventoryFn({ data: { id } })
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: INVENTORY_QUERY_KEYS.feed })
      const previous = queryClient.getQueryData<Array<FeedInventoryCache>>([
        'feed-inventory',
      ])
      queryClient.setQueryData<Array<FeedInventoryCache>>(
        INVENTORY_QUERY_KEYS.feed,
        (old = []) => old.filter((item) => item.id !== id),
      )
      return { previousData: previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          INVENTORY_QUERY_KEYS.feed,
          context.previousData,
        )
      }
      toast.error(err instanceof Error ? err.message : t('common:error.delete'))
    },
    onSuccess: () => {
      toast.success(t('feed.deleted'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.feed })
    },
  })

  return {
    createFeed,
    updateFeed,
    deleteFeed,
    isPending:
      createFeed.isPending || updateFeed.isPending || deleteFeed.isPending,
  }
}

export function useMedicationMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['inventory'])

  const createMedication = useMutation<
    string,
    Error,
    {
      farmId: string
      medicationName: string
      quantity: number
      unit:
        | 'vial'
        | 'bottle'
        | 'sachet'
        | 'ml'
        | 'g'
        | 'tablet'
        | 'kg'
        | 'liter'
      minThreshold: number
    },
    OptimisticContext<Array<MedicationInventoryCache>>
  >({
    mutationFn: async ({ farmId, ...data }) => {
      return createMedicationFn({
        data: { input: { farmId, ...data } },
      })
    },
    onMutate: async ({ farmId, ...data }) => {
      await queryClient.cancelQueries({
        queryKey: INVENTORY_QUERY_KEYS.medication,
      })
      const previous = queryClient.getQueryData<
        Array<MedicationInventoryCache>
      >(INVENTORY_QUERY_KEYS.medication)
      const tempId = generateEntityTempId('medication-inventory')
      const optimistic: MedicationInventoryCache = {
        id: tempId,
        farmId,
        ...data,
        _isOptimistic: true,
        _tempId: tempId,
      }
      queryClient.setQueryData<Array<MedicationInventoryCache>>(
        INVENTORY_QUERY_KEYS.medication,
        (old = []) => [...old, optimistic],
      )
      return { previousData: previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          INVENTORY_QUERY_KEYS.medication,
          context.previousData,
        )
      }
      toast.error(
        err instanceof Error ? err.message : t('inventory:medication.error'),
      )
    },
    onSuccess: () => {
      toast.success(t('medication.recorded'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.medication,
      })
    },
  })

  const updateMedication = useMutation<
    boolean,
    Error,
    {
      id: string
      quantity: number
      minThreshold: number
    },
    OptimisticContext<Array<MedicationInventoryCache>>
  >({
    mutationFn: async ({ id, ...data }) => {
      return updateMedicationFn({ data: { id, input: data } })
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({
        queryKey: INVENTORY_QUERY_KEYS.medication,
      })
      const previous = queryClient.getQueryData<
        Array<MedicationInventoryCache>
      >(INVENTORY_QUERY_KEYS.medication)
      queryClient.setQueryData<Array<MedicationInventoryCache>>(
        INVENTORY_QUERY_KEYS.medication,
        (old = []) =>
          old.map((item) => (item.id === id ? { ...item, ...data } : item)),
      )
      return { previousData: previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          INVENTORY_QUERY_KEYS.medication,
          context.previousData,
        )
      }
      toast.error(err instanceof Error ? err.message : t('common:error.update'))
    },
    onSuccess: () => {
      toast.success(t('common:updated'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.medication,
      })
    },
  })

  const deleteMedication = useMutation<
    boolean,
    Error,
    string,
    OptimisticContext<Array<MedicationInventoryCache>>
  >({
    mutationFn: async (id: string) => {
      return deleteMedicationFn({ data: { id } })
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: INVENTORY_QUERY_KEYS.medication,
      })
      const previous = queryClient.getQueryData<
        Array<MedicationInventoryCache>
      >(INVENTORY_QUERY_KEYS.medication)
      queryClient.setQueryData<Array<MedicationInventoryCache>>(
        INVENTORY_QUERY_KEYS.medication,
        (old = []) => old.filter((item) => item.id !== id),
      )
      return { previousData: previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          INVENTORY_QUERY_KEYS.medication,
          context.previousData,
        )
      }
      toast.error(err instanceof Error ? err.message : t('common:error.delete'))
    },
    onSuccess: () => {
      toast.success(t('medication.deleted'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.medication,
      })
    },
  })

  return {
    createMedication,
    updateMedication,
    deleteMedication,
    isPending:
      createMedication.isPending ||
      updateMedication.isPending ||
      deleteMedication.isPending,
  }
}
