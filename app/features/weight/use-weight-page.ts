import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { WeightSample, WeightSearchParams } from '~/features/weight/types'
import type { WeightFormData } from '~/components/weight/weight-form-dialog'
import {
  createWeightSampleFn,
  deleteWeightSampleFn,
  updateWeightSampleFn,
} from '~/features/weight/server'

interface UseWeightPageProps {
  selectedFarmId?: string | null
  routePath: string
}

export function useWeightPage({
  selectedFarmId,
  routePath,
}: UseWeightPageProps) {
  const { t } = useTranslation(['weight', 'common'])
  const navigate = useNavigate({ from: routePath as any })

  const [selectedRecord, setSelectedRecord] = useState<WeightSample | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      // Trigger route refresh by updating search params
      updateSearch({})
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
      // Trigger route refresh by updating search params
      updateSearch({})
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('common:error.delete', { defaultValue: 'Failed to delete' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleFormSubmit,
    handleDeleteConfirm,
  }
}
