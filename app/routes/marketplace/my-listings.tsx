import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { checkAuthFn } from '~/features/auth/server'
import {
  deleteListingFn,
  getMyListingsFn,
  updateListingFn,
} from '~/features/marketplace/server'
import { MyListingsTable } from '~/components/marketplace/my-listings-table'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

const myListingsSearchSchema = z.object({
  status: z.enum(['active', 'paused', 'sold', 'expired', 'all']).default('all'),
  page: z.number().int().positive().default(1),
})

export const Route = createFileRoute('/marketplace/my-listings')({
  beforeLoad: async () => {
    await checkAuthFn({ data: {} })
  },
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
  pendingComponent: DataTableSkeleton,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  component: MyListingsPage,
})

function MyListingsPage() {
  const { t } = useTranslation('marketplace')
  const queryClient = useQueryClient()
  Route.useSearch()
  const data = Route.useLoaderData()

  const updateListingMutation = useMutation({
    mutationFn: updateListingFn,
    onSuccess: () => {
      toast.success(
        t('marketplace:messages.listingUpdated', {
          defaultValue: 'Listing updated successfully',
        }),
      )
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          t('marketplace:messages.updateFailed', {
            defaultValue: 'Failed to update listing',
          }),
      )
    },
  })

  const deleteListingMutation = useMutation({
    mutationFn: deleteListingFn,
    onSuccess: () => {
      toast.success(
        t('marketplace:messages.listingDeleted', {
          defaultValue: 'Listing deleted successfully',
        }),
      )
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          t('marketplace:messages.deleteFailed', {
            defaultValue: 'Failed to delete listing',
          }),
      )
    },
  })

  const handleAction = (
    action: string,
    listingId: string,
    actionData?: any,
  ) => {
    switch (action) {
      case 'edit':
        updateListingMutation.mutate({ data: { listingId, ...actionData } })
        break
      case 'pause':
        updateListingMutation.mutate({
          data: { listingId, status: 'paused' },
        })
        break
      case 'activate':
        updateListingMutation.mutate({
          data: { listingId, status: 'active' },
        })
        break
      case 'sold':
        updateListingMutation.mutate({
          data: { listingId, status: 'sold' },
        })
        break
      case 'extend':
        updateListingMutation.mutate({
          data: { listingId, expirationDays: 30 },
        })
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
        <p className="text-muted-foreground">{t('myListingsDescription')}</p>
      </div>

      <MyListingsTable
        listings={data.data}
        onAction={(listingId, action) => handleAction(action, listingId)}
      />
    </div>
  )
}
