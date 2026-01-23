import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createMedicationFn,
  deleteMedicationFn,
  getMedicationInventoryFn,
  updateMedicationFn,
} from './medication-server'
import type { MedicationItem, MedicationUnit } from './index'

export function useMedicationInventory(selectedFarmId: string | null) {
  const { t } = useTranslation(['inventory'])
  const [medicationInventory, setMedicationInventory] = useState<
    Array<MedicationItem>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadMedicationData = async () => {
    setIsLoading(true)
    try {
      const result = await getMedicationInventoryFn({
        data: { farmId: selectedFarmId || undefined },
      })
      setMedicationInventory(result as Array<MedicationItem>)
    } catch (err) {
      console.error('Failed to load medication inventory', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMedicationData()
  }, [selectedFarmId])

  const createMedication = async (data: {
    medicationName: string
    quantity: number
    unit: MedicationUnit
    expiryDate: Date | null
    minThreshold: number
  }) => {
    if (!selectedFarmId) throw new Error('No farm selected')
    setIsSubmitting(true)
    try {
      await createMedicationFn({
        data: { input: { farmId: selectedFarmId, ...data } },
      })
      toast.success(t('medication.recorded'))
      await loadMedicationData()
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
      await loadMedicationData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteMedication = async (id: string) => {
    setIsSubmitting(true)
    try {
      await deleteMedicationFn({ data: { id } })
      toast.success(t('medication.deleted'))
      await loadMedicationData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const isExpiringSoon = (date: Date | string | null) => {
    if (!date) return false
    const d = new Date(date)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return d <= thirtyDaysFromNow
  }

  const isExpired = (date: Date | string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const lowStockCount = medicationInventory.filter(
    (m) => m.quantity <= m.minThreshold,
  ).length

  const expiringCount = medicationInventory.filter(
    (m) => isExpiringSoon(m.expiryDate) && !isExpired(m.expiryDate),
  ).length

  const expiredCount = medicationInventory.filter((m) =>
    isExpired(m.expiryDate),
  ).length

  return {
    medicationInventory,
    isLoading,
    isSubmitting,
    lowStockCount,
    expiringCount,
    expiredCount,
    refetch: loadMedicationData,
    createMedication,
    updateMedication,
    deleteMedication,
  }
}
