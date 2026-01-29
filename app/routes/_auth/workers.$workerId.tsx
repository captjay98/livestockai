import { createFileRoute } from '@tanstack/react-router'
import { WorkerProfileForm } from '~/components/digital-foreman/WorkerProfileForm'
import { useUserSettings } from '~/features/settings/use-user-settings'

export const Route = createFileRoute('/_auth/workers/$workerId')({
  component: WorkerDetailPage,
})

function WorkerDetailPage() {
  const { workerId } = Route.useParams()
  const { settings } = useUserSettings()
  const farmId = settings.defaultFarmId

  if (!farmId) return <div className="p-4">Please select a farm first</div>

  return <WorkerProfileForm farmId={farmId} userId={workerId} />
}
