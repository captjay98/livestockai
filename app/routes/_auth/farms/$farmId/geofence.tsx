import { createFileRoute } from '@tanstack/react-router'
import { GeofenceConfig } from '~/components/digital-foreman/GeofenceConfig'
import { PageHeader } from '~/components/page-header'

export const Route = createFileRoute('/_auth/farms/$farmId/geofence')({
  component: GeofenceConfigPage,
})

function GeofenceConfigPage() {
  const { farmId } = Route.useParams()

  return (
    <div className="space-y-4 p-4">
      <PageHeader
        title="Geofence Configuration"
        description="Configure the GPS boundary for worker check-ins"
      />
      <GeofenceConfig farmId={farmId} />
    </div>
  )
}

export const Route = createFileRoute('/_auth/farms/$farmId/geofence')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/farms/$farmId/geofence"!</div>
}
