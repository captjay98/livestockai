import { useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
    createEggRecordAction,
    deleteEggRecordFn,
    updateEggRecordFn,
} from './server'
import type { EggSearchParams } from './types'
import type { EggCollectionWithDetails } from './repository'

interface UseEggPageProps {
    selectedFarmId: string | null
    routePath: string
}

export function useEggPage({ selectedFarmId, routePath }: UseEggPageProps) {
    const { t } = useTranslation(['eggs', 'common'])
    const navigate = useNavigate({ from: routePath as any })
    const router = useRouter()

    const [selectedRecord, setSelectedRecord] =
        useState<EggCollectionWithDetails | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const updateSearch = (updates: Partial<EggSearchParams>) => {
        navigate({
            // @ts-ignore - Type limitation
            search: (prev: EggSearchParams) => ({
                ...prev,
                ...updates,
            }),
        })
    }

    const handleAddSubmit = async (data: Record<string, unknown>) => {
        if (!selectedFarmId) return
        setIsSubmitting(true)
        try {
            await createEggRecordAction({
                data: {
                    farmId: selectedFarmId,
                    batchId: data.batchId as string,
                    date: data.date as string,
                    quantityCollected: data.quantityCollected as number,
                    quantityBroken: data.quantityBroken as number,
                    quantitySold: data.quantitySold as number,
                },
            })
            toast.success(
                t('eggs:recorded', { defaultValue: 'Egg record added' }),
            )
            await router.invalidate()
            return true // Signal success to close dialog
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to add egg record',
            )
            return false // Signal failure to keep dialog open
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditSubmit = async (data: any) => {
        if (!selectedRecord) return
        setIsSubmitting(true)
        try {
            await updateEggRecordFn({
                data: {
                    recordId: selectedRecord.id,
                    data: {
                        quantityCollected: data.quantityCollected,
                        quantityBroken: data.quantityBroken,
                        quantitySold: data.quantitySold,
                    },
                },
            })
            toast.success(
                t('common:updated', { defaultValue: 'Egg record updated' }),
            )
            await router.invalidate()
            return true // Signal success to close dialog
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update egg record',
            )
            return false // Signal failure to keep dialog open
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!selectedRecord || !selectedFarmId) return
        setIsSubmitting(true)
        try {
            await deleteEggRecordFn({
                data: {
                    farmId: selectedFarmId,
                    recordId: selectedRecord.id,
                },
            })
            toast.success(
                t('common:deleted', { defaultValue: 'Egg record deleted' }),
            )
            await router.invalidate()
            return true // Signal success to close dialog
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete egg record',
            )
            return false // Signal failure to keep dialog open
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        selectedRecord,
        setSelectedRecord,
        isSubmitting,
        updateSearch,
        handleAddSubmit,
        handleEditSubmit,
        handleDeleteConfirm,
    }
}
