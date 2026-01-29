import { createFileRoute } from '@tanstack/react-router'
import { useUserSettings } from '~/features/settings/use-user-settings'
import { PayrollDashboard } from '~/components/digital-foreman/PayrollDashboard'

export const Route = createFileRoute('/_auth/payroll')({
  component: PayrollPage,
})

function PayrollPage() {
  const { settings } = useUserSettings()
  const farmId = settings.defaultFarmId

  if (!farmId) return <div>Please select a farm first</div>

  return <PayrollDashboard farmId={farmId} />
}
