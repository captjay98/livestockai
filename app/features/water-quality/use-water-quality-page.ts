import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { deleteReadingFn, insertReadingFn, updateReadingFn } from './server'
import type { WaterQualityRecord, WaterQualitySearchParams } from './types'

interface UseWaterQualityPageProps {
  selectedFarmId: string | null
  searchParams: WaterQualitySearchParams
  routePath: string
}

export function useWaterQualityPage({
  selectedFarmId,
}: UseWaterQualityPageProps) {
  const { t } = useTranslation(['waterQuality', 'common'])
  const router = useRouter()

  const [selectedRecord, setSelectedRecord] =
    useState<WaterQualityRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddSubmit = async (data: {
    batchId: string
    date: string | Date
    ph: string | number
    temperatureCelsius: string | number
    dissolvedOxygenMgL: string | number
    ammoniaMgL: string | number
    notes?: string
  }) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)

    try {
      await insertReadingFn({
        data: {
          farmId: selectedFarmId,
          data: {
            batchId: data.batchId,
            date: new Date(data.date),
            ph: parseFloat(String(data.ph)),
            temperatureCelsius: parseFloat(String(data.temperatureCelsius)),
            dissolvedOxygenMgL: parseFloat(String(data.dissolvedOxygenMgL)),
            ammoniaMgL: parseFloat(String(data.ammoniaMgL)),
          },
        },
      })
      toast.success(
        t('waterQuality:recorded', { defaultValue: 'Water quality recorded' }),
      )
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: {
    ph: string | number
    temperatureCelsius: string | number
    dissolvedOxygenMgL: string | number
    ammoniaMgL: string | number
    date?: string | Date
    notes?: string | null
  }) => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await updateReadingFn({
        data: {
          recordId: selectedRecord.id,
          data: {
            ph: parseFloat(String(data.ph)),
            temperatureCelsius: parseFloat(String(data.temperatureCelsius)),
            dissolvedOxygenMgL: parseFloat(String(data.dissolvedOxygenMgL)),
            ammoniaMgL: parseFloat(String(data.ammoniaMgL)),
            date: data.date ? new Date(data.date) : undefined,
            notes: data.notes || undefined,
          },
        },
      })
      toast.success(t('common:updated', { defaultValue: 'Record updated' }))
      await router.invalidate()
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
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    handleAddSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
