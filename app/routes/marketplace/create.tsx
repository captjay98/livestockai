import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMarketplaceMutations } from '~/features/marketplace/mutations'
import { CreateListingForm } from '~/components/marketplace/create-listing-form'
import { checkAuthFn } from '~/features/auth/server'
import { Skeleton } from '~/components/ui/skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/marketplace/create')({
  beforeLoad: async () => {
    await checkAuthFn({ data: {} })
  },
  loader: () => {
    // Return empty batches for now - will be loaded in component
    return { batches: [] }
  },
  pendingComponent: () => (
    <div className="container mx-auto py-6">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-96 mb-6" />
      <Skeleton className="h-96 w-full" />
    </div>
  ),
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  component: CreateListingPage,
})

function CreateListingPage() {
  const { t } = useTranslation('marketplace')
  const router = useRouter()
  const { batches } = Route.useLoaderData()
  const { createListing } = useMarketplaceMutations()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('createListing')}</h1>
        <p className="text-muted-foreground">{t('createListingDescription')}</p>
      </div>

      <CreateListingForm
        batches={batches}
        onSubmit={(data) =>
          createListing.mutate(
            { data },
            {
              onSuccess: () =>
                router.navigate({ to: '/marketplace/my-listings' }),
            },
          )
        }
        isSubmitting={createListing.isPending}
      />
    </div>
  )
}
