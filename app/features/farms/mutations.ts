import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { createFarmFn, updateFarmFn } from './server'

export const FARM_QUERY_KEYS = {
  all: ['farms'] as const,
} as const

export function useFarmMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['farms', 'common'])

  const createFarm = useMutation({
    mutationFn: createFarmFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_QUERY_KEYS.all })
      toast.success(
        t('farms:messages.created', { defaultValue: 'Farm created' }),
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.create'))
    },
  })

  const updateFarm = useMutation({
    mutationFn: updateFarmFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_QUERY_KEYS.all })
      toast.success(
        t('farms:messages.updated', { defaultValue: 'Farm updated' }),
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.update'))
    },
  })

  return {
    createFarm,
    updateFarm,
    isPending: createFarm.isPending || updateFarm.isPending,
  }
}
