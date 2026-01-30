import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getGeofenceFn } from '~/features/digital-foreman/server-payroll'
import { GeofenceConfig } from '~/components/digital-foreman/GeofenceConfig'
import { PageHeader } from '~/components/page-header'
import { ErrorPage } from '~/components/error-page'
import { Skeleton } from '~/components/ui/skeleton'

function GeofenceSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export const Route = createFileRoute('/_auth/farms/$farmId/geofence')({
  loader: async ({ params }) => {
    return getGeofenceFn({ data: { farmId: params.farmId } })
  },
  pendingComponent: GeofenceSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: GeofenceConfigPage,
})

function GeofenceConfigPage() {
  const { t } = useTranslation(['farms', 'common'])
  const { farmId } = Route.useParams()
  const geofence = Route.useLoaderData()

  return (
    <div className="space-y-4 p-4">
      <PageHeader
        title={t('farms:geofenceConfig', {
          defaultValue: 'Geofence Configuration',
        })}
        description={t('farms:geofenceDescription', {
          defaultValue: 'Configure the GPS boundary for worker check-ins',
        })}
      />
      <GeofenceConfig farmId={farmId} initialData={geofence} />
    </div>
  )
}
