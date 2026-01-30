import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useWeightMutations } from './mutations'
import type { WeightSample, WeightSearchParams } from '~/features/weight/types'
import type { WeightFormData } from '~/components/weight/weight-form-dialog'

interface UseWeightPageProps {
  selectedFarmId?: string | null
  routePath: string
}

export function useWeightPage({
  selectedFarmId,
  routePath,
}: UseWeightPageProps) {
  const navigate = useNavigate({ from: routePath as any })

  const [selectedRecord, setSelectedRecord] = useState<WeightSample | null>(
    null,
  )
  const {
    createWeight,
    updateWeight,
    deleteWeight,
    isPending: isSubmitting,
  } = useWeightMutations()

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
  ): Promise<void> => {
    if (!selectedFarmId) return

    if (mode === 'create') {
      await createWeight.mutateAsync({
        farmId: selectedFarmId,
        data: {
          batchId: data.batchId,
          date: new Date(data.date),
          sampleSize: parseInt(data.sampleSize),
          averageWeightKg: parseFloat(data.averageWeightKg),
        },
      })
      updateSearch({})
    } else {
      if (!selectedRecord) return
      await updateWeight.mutateAsync({
        recordId: selectedRecord.id,
        data: {
          sampleSize: parseInt(data.sampleSize),
          averageWeightKg: parseFloat(data.averageWeightKg),
          date: new Date(data.date),
        },
      })
      updateSearch({})
    }
  }

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!selectedRecord) return
    await deleteWeight.mutateAsync({
      recordId: selectedRecord.id,
    })
    updateSearch({})
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
