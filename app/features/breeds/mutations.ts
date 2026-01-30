import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { submitBreedRequestFn } from './server'

export const BREED_QUERY_KEYS = {
  requests: ['breed-requests'] as const,
  species: (livestockType: string | null) =>
    ['species', livestockType] as const,
  breeds: (speciesKey: string | null) => ['breeds', speciesKey] as const,
} as const

export interface SubmitBreedRequestInput {
  moduleKey: string
  speciesKey: string
  breedName: string
  typicalMarketWeightG?: number
  typicalDaysToMarket?: number
  typicalFcr?: number
  source?: string
  userEmail?: string
  notes?: string
}

export function useBreedMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['breeds', 'common'])

  const submitBreedRequest = useMutation({
    mutationFn: (data: SubmitBreedRequestInput) =>
      submitBreedRequestFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BREED_QUERY_KEYS.requests })
      toast.success(
        t('breeds:request.submitted', {
          defaultValue: "Breed request submitted! We'll review it soon.",
        }),
      )
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('breeds:request.failed', {
              defaultValue: 'Failed to submit request',
            }),
      )
    },
  })

  return {
    submitBreedRequest,
    isPending: submitBreedRequest.isPending,
  }
}
