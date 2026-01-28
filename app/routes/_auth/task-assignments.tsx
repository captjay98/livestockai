import { createFileRoute } from '@tanstack/react-router'
import { useUserSettings } from '~/features/settings/use-user-settings'
import { TaskOverview } from '~/components/digital-foreman/TaskOverview'

export const Route = createFileRoute('/_auth/task-assignments')({
    component: TaskAssignmentsPage,
})

function TaskAssignmentsPage() {
    const { settings } = useUserSettings()
    const farmId = settings.defaultFarmId

    if (!farmId) return <div>Please select a farm first</div>

    return <TaskOverview farmId={farmId} />
}
