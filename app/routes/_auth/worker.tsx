import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { WorkerDashboard } from '~/components/digital-foreman/WorkerDashboard'
import { WorkerSkeleton } from '~/components/workers/worker-skeleton'
import { useFarm } from '~/features/farms/context'
import { getOpenCheckInForCurrentUserFn } from '~/features/digital-foreman/server'
import { ErrorPage } from '~/components/error-page'

const workerSearchSchema = z.object({
  farmId: z.string().optional(),
})

export const Route = createFileRoute('/_auth/worker')({
  validateSearch: workerSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ deps }) => {
    if (!deps.farmId) return null

    return getOpenCheckInForCurrentUserFn({
      data: { farmId: deps.farmId },
    })
  },
  pendingComponent: WorkerSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: WorkerPage,
})

function WorkerPage() {
  const { t } = useTranslation(['workers'])
  const { selectedFarmId } = useFarm()
  const checkInStatus = Route.useLoaderData()

  if (!selectedFarmId)
    return (
      <div className="p-4">
        {t('workers:selectFarmFirst', {
          defaultValue: 'Please select a farm first',
        })}
      </div>
    )

  return (
    <WorkerDashboard
      farmId={selectedFarmId}
      checkInId={checkInStatus?.id}
      isCheckedIn={
        checkInStatus != null &&
        !!checkInStatus.id &&
        !checkInStatus.checkOutTime
      }
      hoursToday={checkInStatus ? Number(checkInStatus.hoursWorked) : 0}
    />
  )
}
