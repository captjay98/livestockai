import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { getMyListingsFn, updateListingFn, deleteListingFn } from '~/features/marketplace/server'
import { MyListingsTable } from '~/components/marketplace/my-listings-table'
import { ListingActions } from '~/components/marketplace/listing-actions'

const myListingsSearchSchema = z.object({
  status: z.enum(['active', 'paused', 'sold', 'expired', 'all']).default('all'),
  page: z.number().int().positive().default(1),
})

export const Route = createFileRoute('/_auth/marketplace/my-listings')({
  validateSearch: myListingsSearchSchema,
  loaderDeps: ({ search }) => ({ status: search.status, page: search.page }),
  loader: async ({ deps }) => {
    return getMyListingsFn({
      data: {
        status: deps.status,
        page: deps.page,
        pageSize: 20,
      },
    })
  },
  component: MyListingsPage,
})

function MyListingsPage() {
  const { t } = useTranslation('marketplace')
  const queryClient = useQueryClient()
  const { status, page } = Route.useSearch()
  const data = Route.useLoaderData()

  const updateListingMutation = useMutation({
    mutationFn: updateListingFn,
    onSuccess: () => {
      toast.success('Listing updated successfully')
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update listing')
    },
  })

  const deleteListingMutation = useMutation({
    mutationFn: deleteListingFn,
    onSuccess: () => {
      toast.success('Listing deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete listing')
    },
  })

  const handleAction = (action: string, listingId: string, data?: any) => {
    switch (action) {
      case 'edit':
        updateListingMutation.mutate({ data: { listingId, ...data } })
        break
      case 'pause':
        updateListingMutation.mutate({ data: { listingId, status: 'paused' } })
        break
      case 'activate':
        updateListingMutation.mutate({ data: { listingId, status: 'active' } })
        break
      case 'sold':
        updateListingMutation.mutate({ data: { listingId, status: 'sold' } })
        break
      case 'extend':
        updateListingMutation.mutate({ data: { listingId, expirationDays: 30 } })
        break
      case 'delete':
        deleteListingMutation.mutate({ data: { listingId } })
        break
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('myListings')}</h1>
        <p className="text-muted-foreground">
          {t('myListingsDescription')}
        </p>
      </div>

      <MyListingsTable
        data={data}
        currentStatus={status}
        currentPage={page}
        onAction={handleAction}
        isLoading={updateListingMutation.isPending || deleteListingMutation.isPending}
      />
    </div>
  )
}