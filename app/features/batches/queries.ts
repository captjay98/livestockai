import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { getBatchesFn } from './server'
import { getBatchDetailsFn } from './server/stats'
import { BATCH_QUERY_KEYS } from './mutations'
import {
  getBreedsForSpeciesFn,
  getSpeciesForLivestockTypeFn,
  submitBreedRequestFn,
} from '~/features/breeds/server'
import { BREED_QUERY_KEYS } from '~/features/breeds/mutations'

export function useBatches(farmId: string | null) {
  return useQuery({
    queryKey: BATCH_QUERY_KEYS.list(farmId || undefined),
    queryFn: () =>
      farmId ? getBatchesFn({ data: { farmId } }) : Promise.resolve([]),
    enabled: !!farmId,
  })
}

export function useBatch(batchId: string | null) {
  return useQuery({
    queryKey: BATCH_QUERY_KEYS.detail(batchId || ''),
    queryFn: () =>
      batchId
        ? getBatchDetailsFn({ data: { batchId } })
        : Promise.resolve(null),
    enabled: !!batchId,
  })
}

export function useSpecies(livestockType: string | null) {
  return useQuery({
    queryKey: BREED_QUERY_KEYS.species(livestockType),
    queryFn: () =>
      livestockType
        ? getSpeciesForLivestockTypeFn({ data: { livestockType } })
        : Promise.resolve([]),
    enabled: !!livestockType,
  })
}

export function useBreeds(speciesKey: string | null) {
  return useQuery({
    queryKey: BREED_QUERY_KEYS.breeds(speciesKey),
    queryFn: () =>
      speciesKey
        ? getBreedsForSpeciesFn({ data: { speciesKey } })
        : Promise.resolve([]),
    enabled: !!speciesKey,
  })
}

export function useBreedMutations() {
  const { t } = useTranslation(['breeds', 'common'])

  const submitBreedRequestMutation = useMutation({
    mutationFn: submitBreedRequestFn,
    onSuccess: () => {
      toast.success(t('breeds:request.success', 'Breed request submitted'))
    },
    onError: (error: Error) => {
      toast.error(t('breeds:request.error', 'Failed to submit request'), {
        description: error.message,
      })
    },
  })

  return { submitBreedRequestMutation }
}
