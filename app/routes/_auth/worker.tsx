import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { WorkerDashboard } from '~/components/digital-foreman/WorkerDashboard'
import { useUserSettings } from '~/features/settings/use-user-settings'

export const Route = createFileRoute('/_auth/worker')({
    component: WorkerPage,
})

function WorkerPage() {
    const { settings } = useUserSettings()
    const farmId = settings.defaultFarmId

    // Get current check-in status for this worker
    const { data: checkInStatus } = useQuery({
        queryKey: ['worker-check-in-status', farmId],
        queryFn: async () => {
            const { getOpenCheckInForCurrentUserFn } =
                await import('~/features/digital-foreman/server')
            return getOpenCheckInForCurrentUserFn({ data: { farmId: farmId! } })
        },
        enabled: !!farmId,
    })

    if (!farmId) return <div className="p-4">Please select a farm first</div>

    return (
        <WorkerDashboard
            farmId={farmId}
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
