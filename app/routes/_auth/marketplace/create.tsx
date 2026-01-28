import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createListingFn } from '~/features/marketplace/server'
import { getBatchesForFarmFn } from '~/features/batches/server'
import { CreateListingForm } from '~/components/marketplace/create-listing-form'
import { useFarm } from '~/features/farms/context'

export const Route = createFileRoute('/_auth/marketplace/create')({
  loader: async () => {
    // Fetch user's active batches for pre-fill option
    const { selectedFarmId } = useFarm.getState()
    if (!selectedFarmId) return { batches: [] }
    
    try {
      const result = await getBatchesForFarmFn({
        data: {
          farmId: selectedFarmId,
          page: 1,
          pageSize: 100,
          status: 'active',
        },
      })
      return { batches: result.paginatedBatches.data }
    } catch {
      return { batches: [] }
    }
  },
  component: CreateListingPage,
})

function CreateListingPage() {
  const { t } = useTranslation('marketplace')
  const router = useRouter()
  const { batches } = Route.useLoaderData()

  const createListingMutation = useMutation({
    mutationFn: createListingFn,
    onSuccess: () => {
      toast.success('Listing created successfully')
      router.navigate({ to: '/marketplace/my-listings' })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create listing')
    },
  })

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('createListing')}</h1>
        <p className="text-muted-foreground">
          {t('createListingDescription')}
        </p>
      </div>
      
      <CreateListingForm
        batches={batches}
        onSubmit={(data) => createListingMutation.mutate({ data })}
        isSubmitting={createListingMutation.isPending}
      />
    </div>
  )
}