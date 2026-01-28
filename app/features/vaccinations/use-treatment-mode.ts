import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
    createTreatmentFn,
    createVaccinationFn,
    deleteTreatmentFn,
    deleteVaccinationFn,
    updateTreatmentFn,
    updateVaccinationFn,
} from './server'
import type { HealthRecord } from '~/components/vaccinations/health-columns'
import type { UpdateTreatmentInput, UpdateVaccinationInput } from './server'

export type DialogType = 'vaccination' | 'treatment' | 'edit'

export function useTreatmentMode() {
    const { t } = useTranslation(['common'])
    const [dialogType, setDialogType] = useState<DialogType>('vaccination')
    const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(
        null,
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleFormSubmit = useCallback(
        async (data: any, farmId: string, onSuccess: () => void) => {
            setIsSubmitting(true)
            try {
                if (selectedRecord) {
                    if (selectedRecord.type === 'vaccination') {
                        await updateVaccinationFn({
                            data: {
                                recordId: selectedRecord.id,
                                data: {
                                    vaccineName: data.name,
                                    dosage: data.dosage,
                                    dateAdministered: new Date(data.date),
                                    nextDueDate: data.nextDueDate
                                        ? new Date(data.nextDueDate)
                                        : null,
                                    notes: data.notes || null,
                                } as UpdateVaccinationInput,
                            },
                        })
                    } else {
                        await updateTreatmentFn({
                            data: {
                                recordId: selectedRecord.id,
                                data: {
                                    medicationName: data.name,
                                    reason: data.reason,
                                    date: new Date(data.date),
                                    dosage: data.dosage,
                                    withdrawalDays: data.withdrawalDays,
                                    notes: data.notes || null,
                                } as UpdateTreatmentInput,
                            },
                        })
                    }
                } else {
                    if (data.type === 'vaccination') {
                        await createVaccinationFn({
                            data: {
                                farmId,
                                data: {
                                    batchId: data.batchId,
                                    vaccineName: data.name,
                                    dateAdministered: new Date(data.date),
                                    dosage: data.dosage,
                                    nextDueDate: data.nextDueDate
                                        ? new Date(data.nextDueDate)
                                        : undefined,
                                    notes: data.notes,
                                },
                            },
                        })
                    } else {
                        await createTreatmentFn({
                            data: {
                                farmId,
                                data: {
                                    batchId: data.batchId,
                                    medicationName: data.name,
                                    reason: data.reason,
                                    date: new Date(data.date),
                                    dosage: data.dosage,
                                    withdrawalDays: data.withdrawalDays,
                                    notes: data.notes,
                                },
                            },
                        })
                    }
                }
                toast.success(t('saved'))
                onSuccess()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : t('error'))
            } finally {
                setIsSubmitting(false)
            }
        },
        [selectedRecord, t],
    )

    const handleDeleteConfirm = useCallback(
        async (onSuccess: () => void) => {
            if (!selectedRecord) return
            setIsSubmitting(true)
            try {
                if (selectedRecord.type === 'vaccination') {
                    await deleteVaccinationFn({
                        data: { recordId: selectedRecord.id },
                    })
                } else {
                    await deleteTreatmentFn({
                        data: { recordId: selectedRecord.id },
                    })
                }
                toast.success(t('deleted'))
                onSuccess()
            } finally {
                setIsSubmitting(false)
            }
        },
        [selectedRecord, t],
    )

    const openVaccinationDialog = useCallback(() => {
        setSelectedRecord(null)
        setDialogType('vaccination')
    }, [])

    const openTreatmentDialog = useCallback(() => {
        setSelectedRecord(null)
        setDialogType('treatment')
    }, [])

    const openEditDialog = useCallback((record: HealthRecord) => {
        setSelectedRecord(record)
        setDialogType(record.type === 'treatment' ? 'treatment' : 'vaccination')
    }, [])

    return {
        dialogType,
        selectedRecord,
        isSubmitting,
        setSelectedRecord,
        handleFormSubmit,
        handleDeleteConfirm,
        openVaccinationDialog,
        openTreatmentDialog,
        openEditDialog,
    }
}
