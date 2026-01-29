import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { TaskPageHeader } from '~/components/tasks/task-page-header'
import { TaskTabs } from '~/components/tasks/task-tabs'
import { useTaskPage } from '~/features/tasks/use-task-page'
import { getTasksFn } from '~/features/tasks/server'
import { TasksSkeleton } from '~/components/tasks/tasks-skeleton'

export const Route = createFileRoute('/_auth/tasks/')({
  component: TasksPage,
  loader: async ({ context }) => {
    const farmId = (context.user as any)?.settings?.defaultFarmId
    if (!farmId) return { tasks: [] }
    const tasks = await getTasksFn({ data: { farmId } })
    return { tasks }
  },
  pendingComponent: TasksSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">Error loading tasks: {error.message}</div>
  ),
})

function TasksPage() {
  const { t } = useTranslation('tasks')
  const { tasks } = Route.useLoaderData()
  const {
    hasFarm,
    dailyTasks,
    weeklyTasks,
    monthlyTasks,
    loading,
    handleToggle,
  } = useTaskPage(tasks)

  if (!hasFarm) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('selectFarm')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <TaskPageHeader />
      <TaskTabs
        dailyTasks={dailyTasks}
        weeklyTasks={weeklyTasks}
        monthlyTasks={monthlyTasks}
        onToggle={handleToggle}
        loading={loading}
      />
    </div>
  )
}
