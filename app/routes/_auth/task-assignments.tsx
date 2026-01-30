import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { TaskOverview } from '~/components/digital-foreman/TaskOverview'
import { TaskOverviewSkeleton } from '~/components/digital-foreman/task-overview-skeleton'
import { ErrorPage } from '~/components/error-page'
import { getAssignmentsByFarmFn } from '~/features/digital-foreman/server-tasks'

const taskAssignmentsSearchSchema = z.object({
  farmId: z.string().uuid().optional(),
})

export const Route = createFileRoute('/_auth/task-assignments')({
  validateSearch: taskAssignmentsSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ deps }) => {
    if (!deps.farmId) {
      return { tasks: [] }
    }
    const tasks = await getAssignmentsByFarmFn({
      data: { farmId: deps.farmId },
    })
    return { tasks }
  },
  pendingComponent: TaskOverviewSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: TaskAssignmentsPage,
})

function TaskAssignmentsPage() {
  const { t } = useTranslation(['common'])
  const { farmId } = Route.useSearch()

  if (!farmId) {
    return (
      <div className="p-4">
        {t('common:selectFarmFirst', {
          defaultValue: 'Please select a farm first',
        })}
      </div>
    )
  }

  return <TaskOverview farmId={farmId} />
}
