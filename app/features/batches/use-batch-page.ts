import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Batch } from '~/components/batches/batch-columns'
import { deleteBatchFn, updateBatchFn } from '~/features/batches/server'
import { BATCH_QUERY_KEYS } from '~/features/batches/mutations'

interface UseBatchPageProps {
  // Reserved for future use
}

export function useBatchPage(_props: UseBatchPageProps = {}) {
  const { t } = useTranslation(['batches'])
  const queryClient = useQueryClient()

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      queryClient.invalidateQueries({
        queryKey: BATCH_QUERY_KEYS.all,
      })
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
        queryKey: BATCH_QUERY_KEYS.farmModules,
      })
      queryClient.invalidateQueries({
        queryKey: BATCH_QUERY_KEYS.all,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedBatch,
    setSelectedBatch,
    isSubmitting,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
