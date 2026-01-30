import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { createListingFn, deleteListingFn, updateListingFn } from './server'

export const MARKETPLACE_QUERY_KEYS = {
  all: ['listings'] as const,
  myListings: ['my-listings'] as const,
} as const

export function useMarketplaceMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['marketplace', 'common'])

  const createListing = useMutation({
    mutationFn: createListingFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all })
      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_QUERY_KEYS.myListings,
      })
      toast.success(
        t('marketplace:messages.created', { defaultValue: 'Listing created' }),
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.create'))
    },
  })

  const updateListing = useMutation({
    mutationFn: updateListingFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all })
      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_QUERY_KEYS.myListings,
      })
      toast.success(
        t('marketplace:messages.updated', { defaultValue: 'Listing updated' }),
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.update'))
    },
  })

  const deleteListing = useMutation({
    mutationFn: deleteListingFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all })
      queryClient.invalidateQueries({
        queryKey: MARKETPLACE_QUERY_KEYS.myListings,
      })
      toast.success(
        t('marketplace:messages.deleted', { defaultValue: 'Listing deleted' }),
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.delete'))
    },
  })

  return {
    createListing,
    updateListing,
    deleteListing,
    isPending:
      createListing.isPending ||
      updateListing.isPending ||
      deleteListing.isPending,
  }
}
