import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Batch } from '~/components/batches/batch-columns'
import type { BatchSearchParams } from '~/features/batches/types'
import { deleteBatchFn, updateBatchFn } from '~/features/batches/server'

interface UseBatchPageProps {
    selectedFarmId?: string | null
    routePath: string
}

export function useBatchPage({ selectedFarmId, routePath }: UseBatchPageProps) {
    const { t } = useTranslation(['batches'])
    const navigate = useNavigate({ from: routePath as any })
    const queryClient = useQueryClient()

    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const updateSearch = (updates: Partial<BatchSearchParams>) => {
        // @ts-ignore - TanStack Router type limitation
        navigate({
            search: (prev: BatchSearchParams) => ({
                ...prev,
                ...updates,
            }),
        } as any)
    }

    const handleEditSubmit = async (data: {
        currentQuantity: string
        status: 'active' | 'depleted' | 'sold'
    }) => {
        if (!selectedBatch) return

        setIsSubmitting(true)
        try {
            await updateBatchFn({
                data: {
                    batchId: selectedBatch.id,
                    batch: {
                        status: data.status,
                    },
                },
            })
            toast.success(
                t('messages.updated', { defaultValue: 'Batch updated' }),
            )
            queryClient.invalidateQueries({
                queryKey: ['batches'],
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!selectedBatch) return

        setIsSubmitting(true)
        try {
            await deleteBatchFn({
                data: { batchId: selectedBatch.id },
            })
            toast.success(
                t('messages.deleted', { defaultValue: 'Batch deleted' }),
            )
            queryClient.invalidateQueries({
                queryKey: ['farm-modules', selectedFarmId],
            })
            queryClient.invalidateQueries({
                queryKey: ['batches'],
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        selectedBatch,
        setSelectedBatch,
        isSubmitting,
        updateSearch,
        handleEditSubmit,
        handleDeleteConfirm,
    }
}
