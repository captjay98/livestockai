import { useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useMortalityMutations } from './mutations'
import type { MortalityRecord } from '~/components/mortality/mortality-columns'
import type { MortalitySearchParams } from './types'

interface UseMortalityPageProps {
  selectedFarmId?: string | null
  routePath: string
}

export function useMortalityPage({
  selectedFarmId,
  routePath,
}: UseMortalityPageProps) {
  const navigate = useNavigate({ from: routePath as any })
  const router = useRouter()

  const [selectedRecord, setSelectedRecord] = useState<MortalityRecord | null>(
    null,
  )
  const {
    createMortality,
    updateMortality,
    deleteMortality,
    isPending: isSubmitting,
  } = useMortalityMutations()

  const updateSearch = (updates: Partial<MortalitySearchParams>) => {
    navigate({
      // @ts-ignore - TanStack Router type limitation
      search: (prev: MortalitySearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleRecordSubmit = (data: Record<string, unknown>) => {
    if (!selectedFarmId) return
    createMortality.mutate(
      {
        farmId: selectedFarmId,
        data: {
          batchId: data.batchId as string,
          quantity: parseInt(data.quantity as string),
          date: new Date(data.date as string),
          cause: data.cause as any,
          notes: data.notes as string | undefined,
        },
      },
      {
        onSuccess: () => {
          router.invalidate()
        },
      },
    )
  }

  const handleEditSubmit = (data: Record<string, unknown>) => {
    if (!selectedRecord) return
    updateMortality.mutate(
      {
        recordId: selectedRecord.id,
        data: {
          quantity: data.quantity
            ? parseInt(data.quantity as string)
            : undefined,
          date: data.date ? new Date(data.date as string | Date) : undefined,
          cause: data.cause as any,
          notes: data.notes as string | null | undefined,
        },
      },
      {
        onSuccess: () => {
          router.invalidate()
        },
      },
    )
  }

  const handleDeleteConfirm = () => {
    if (!selectedRecord) return
    deleteMortality.mutate(
      {
        recordId: selectedRecord.id,
      },
      {
        onSuccess: () => {
          router.invalidate()
        },
      },
    )
  }

  return {
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleRecordSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
