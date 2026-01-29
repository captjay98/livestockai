import { createFileRoute } from '@tanstack/react-router'
import { useUserSettings } from '~/features/settings/use-user-settings'
import { AttendanceOverview } from '~/components/digital-foreman/AttendanceOverview'

export const Route = createFileRoute('/_auth/attendance')({
  component: AttendancePage,
})

function AttendancePage() {
  const { settings } = useUserSettings()
  const farmId = settings.defaultFarmId

  if (!farmId) return <div>Please select a farm first</div>

  return <AttendanceOverview farmId={farmId} />
}
