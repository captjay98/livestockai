import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { WorkerProfileForm } from '~/components/digital-foreman/WorkerProfileForm'
import { WorkerSkeleton } from '~/components/workers/worker-skeleton'
import { ErrorPage } from '~/components/error-page'
import { getWorkerProfileByUserIdFn } from '~/features/digital-foreman/server'

const workerDetailSearchSchema = z.object({
  farmId: z.string().uuid().optional(),
})

export const Route = createFileRoute('/_auth/workers/$workerId')({
  validateSearch: workerDetailSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ params, deps }) => {
    if (!deps.farmId) {
      return { profile: null }
    }
    const profile = await getWorkerProfileByUserIdFn({
      data: {
        userId: params.workerId,
        farmId: deps.farmId,
      },
    })
    return { profile }
  },
  pendingComponent: WorkerSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: WorkerDetailPage,
})

function WorkerDetailPage() {
  const { t } = useTranslation(['workers'])
  const { workerId } = Route.useParams()
  const { farmId } = Route.useSearch()
  const { profile } = Route.useLoaderData()

  if (!farmId) {
    return (
      <div className="p-4">
        {t('workers:selectFarmFirst', {
          defaultValue: 'Please select a farm first',
        })}
      </div>
    )
  }

  return (
    <WorkerProfileForm
      farmId={farmId}
      userId={workerId}
      existingProfile={
        profile
          ? {
              id: profile.id,
              phone: profile.phone,
              wageRateAmount: profile.wageRateAmount.toString(),
              wageRateType: profile.wageRateType,
              permissions: profile.permissions as Array<string>,
            }
          : undefined
      }
    />
  )
}
