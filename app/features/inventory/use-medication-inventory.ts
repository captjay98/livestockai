import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createMedicationFn,
  deleteMedicationFn,
  updateMedicationFn,
} from './medication-server'
import type { MedicationUnit } from './index'

export function useMedicationInventory(selectedFarmId: string | null) {
  const { t } = useTranslation(['inventory'])
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMedication = async (data: {
    medicationName: string
    quantity: number
    unit: MedicationUnit
    expiryDate: Date | null
    minThreshold: number
  }) => {
    if (!selectedFarmId) {
      toast.error('No farm selected')
      return
    }
    setIsSubmitting(true)
    try {
      await createMedicationFn({
        data: { input: { farmId: selectedFarmId, ...data } },
      })
      toast.success(t('medication.recorded'))
      await router.invalidate() // Reload to refresh loader data
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateMedication = async (
    id: string,
    data: {
      quantity: number
      expiryDate: Date | null
      minThreshold: number
    },
  ) => {
    setIsSubmitting(true)
    try {
      await updateMedicationFn({ data: { id, input: data } })
      await router.invalidate() // Reload to refresh loader data
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteMedication = async (id: string) => {
    setIsSubmitting(true)
    try {
      await deleteMedicationFn({ data: { id } })
      toast.success(t('medication.deleted'))
      await router.invalidate() // Reload to refresh loader data
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    createMedication,
    updateMedication,
    deleteMedication,
  }
}
