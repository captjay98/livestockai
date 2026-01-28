import { useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
    deleteMortalityRecordFn,
    recordMortalityActionFn,
    updateMortalityRecordFn,
} from './server'
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
    const { t } = useTranslation(['mortality', 'common'])
    const navigate = useNavigate({ from: routePath as any })
    const router = useRouter()

    const [selectedRecord, setSelectedRecord] =
        useState<MortalityRecord | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const updateSearch = (updates: Partial<MortalitySearchParams>) => {
        navigate({
            // @ts-ignore - TanStack Router type limitation
            search: (prev: MortalitySearchParams) => ({
                ...prev,
                ...updates,
            }),
        })
    }

    const handleRecordSubmit = async (data: Record<string, unknown>) => {
        if (!selectedFarmId) return
        setIsSubmitting(true)
        try {
            await recordMortalityActionFn({
                data: {
                    farmId: selectedFarmId,
                    ...data,
                    quantity: parseInt(data.quantity as string),
                } as any,
            })
            toast.success(t('mortality:recorded'))
            // Reload page to refresh data
            await router.invalidate()
        } catch (err) {
            toast.error(t('mortality:error.record'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditSubmit = async (data: Record<string, unknown>) => {
        if (!selectedRecord) return
        setIsSubmitting(true)
        try {
            await updateMortalityRecordFn({
                data: {
                    recordId: selectedRecord.id,
                    data: {
                        ...data,
                        quantity: data.quantity
                            ? parseInt(data.quantity as string)
                            : undefined,
                        date: data.date
                            ? new Date(data.date as string | Date)
                            : undefined,
                    } as any,
                },
            })
            toast.success(t('common:updated'))
            // Reload page to refresh data
            await router.invalidate()
        } catch (err) {
            toast.error(t('common:error.update'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!selectedRecord) return
        setIsSubmitting(true)
        try {
            await deleteMortalityRecordFn({
                data: { recordId: selectedRecord.id },
            })
            toast.success(t('common:deleted'))
            // Reload page to refresh data
            await router.invalidate()
        } catch (err) {
            toast.error(t('common:error.delete'))
        } finally {
            setIsSubmitting(false)
        }
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
