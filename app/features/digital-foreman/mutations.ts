import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { createWorkerProfileFn, getWorkersByFarmFn } from './server'

export const WORKER_QUERY_KEYS = {
  all: ['workers'] as const,
  byFarm: (farmId: string | null) =>
    [...WORKER_QUERY_KEYS.all, farmId] as const,
} as const

export function useWorkers(farmId: string | null) {
  return useQuery({
    queryKey: WORKER_QUERY_KEYS.byFarm(farmId),
    queryFn: () =>
      farmId ? getWorkersByFarmFn({ data: { farmId } }) : Promise.resolve([]),
    enabled: !!farmId,
  })
}

export function useWorkerMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['workers', 'common'])

  const createWorker = useMutation({
    mutationFn: createWorkerProfileFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_QUERY_KEYS.all })
      toast.success(t('workers:create.success', 'Worker created successfully'))
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t('workers:create.error', 'Failed to create worker'),
      )
    },
  })

  return {
    createWorker,
    isPending: createWorker.isPending,
  }
}
