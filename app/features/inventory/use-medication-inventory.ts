import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useMedicationMutations } from './mutations'
import type { MedicationUnit } from './index'

export function useMedicationInventory(selectedFarmId: string | null) {
  const { t } = useTranslation(['errors'])
  const {
    createMedication: createMedicationM,
    updateMedication: updateMedicationM,
    deleteMedication: deleteMedicationM,
    isPending: isSubmitting,
  } = useMedicationMutations()

  const createMedication = async (data: {
    medicationName: string
    quantity: number
    unit: MedicationUnit
    expiryDate: Date | null
    minThreshold: number
  }) => {
    if (!selectedFarmId) {
      toast.error(
        t('errors:noFarmSelected', {
          defaultValue: 'No farm selected',
        }),
      )
      return
    }
    await createMedicationM.mutateAsync({
      farmId: selectedFarmId,
      medicationName: data.medicationName,
      quantity: data.quantity,
      unit: data.unit,
      minThreshold: data.minThreshold,
    })
  }

  const updateMedication = async (
    id: string,
    data: {
      quantity: number
      expiryDate: Date | null
      minThreshold: number
    },
  ) => {
    await updateMedicationM.mutateAsync({ id, ...data })
  }

  const deleteMedication = async (id: string) => {
    await deleteMedicationM.mutateAsync(id)
  }

  return {
    isSubmitting,
    createMedication,
    updateMedication,
    deleteMedication,
  }
}
