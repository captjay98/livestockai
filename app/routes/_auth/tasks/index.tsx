import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import type { TaskWithStatus } from '~/features/tasks/server'
import { TaskPageHeader } from '~/components/tasks/task-page-header'
import { TaskTabs } from '~/components/tasks/task-tabs'
import { TasksSkeleton } from '~/components/tasks/tasks-skeleton'
import { TaskDialog } from '~/components/tasks/task-dialog'
import { ErrorPage } from '~/components/error-page'
import { getTasksFn } from '~/features/tasks/server'
import { useTaskMutations } from '~/features/tasks/mutations'
import { getDefaultFarmFn } from '~/features/settings/server'

const tasksSearchSchema = z.object({
  farmId: z.string().optional(),
})

export const Route = createFileRoute('/_auth/tasks/')({
  validateSearch: tasksSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ deps }) => {
    const [tasks, defaultFarmId] = await Promise.all([
      getTasksFn({ data: { farmId: deps.farmId ?? undefined } }),
      getDefaultFarmFn({ data: {} }),
    ])
    return { tasks, defaultFarmId, farmId: deps.farmId }
  },
  pendingComponent: TasksSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: TasksPage,
})

function TasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const { tasks, defaultFarmId, farmId } = Route.useLoaderData()
  const { completeTask, uncompleteTask, createTask } = useTaskMutations()

  const { dailyTasks, weeklyTasks, monthlyTasks } = useMemo(
    () => ({
      dailyTasks: tasks.filter(
        (task: TaskWithStatus) => task.frequency === 'daily',
      ),
      weeklyTasks: tasks.filter(
        (task: TaskWithStatus) => task.frequency === 'weekly',
      ),
      monthlyTasks: tasks.filter(
        (task: TaskWithStatus) => task.frequency === 'monthly',
      ),
    }),
    [tasks],
  )

  const handleToggle = (task: TaskWithStatus) => {
    if (task.completed) {
      uncompleteTask.mutate(
        { taskId: task.id },
        { onSuccess: () => router.invalidate({ sync: true }) },
      )
    } else {
      completeTask.mutate(
        { taskId: task.id },
        { onSuccess: () => router.invalidate({ sync: true }) },
      )
    }
  }

  const handleCreateTask = (data: {
    title: string
    description: string | null
    frequency: 'daily' | 'weekly' | 'monthly'
  }) => {
    const targetFarmId = farmId ?? defaultFarmId
    if (!targetFarmId) {
      return
    }

    createTask.mutate(
      {
        farmId: targetFarmId,
        task: {
          title: data.title,
          description: data.description,
          frequency: data.frequency,
        },
      },
      { onSuccess: () => router.invalidate({ sync: true }) },
    )
    setDialogOpen(false)
  }

  // Only show add button if we have a farm context
  const canAddTask = !!(farmId ?? defaultFarmId)

  // Track which task is being toggled for loading state
  const loadingTaskId = completeTask.isPending
    ? completeTask.variables.taskId
    : uncompleteTask.isPending
      ? uncompleteTask.variables.taskId
      : null

  return (
    <div className="space-y-6 pb-20">
      <TaskPageHeader
        onAddTask={canAddTask ? () => setDialogOpen(true) : undefined}
      />
      <div className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden border p-1 sm:p-2 mx-1 sm:mx-0">
        <TaskTabs
          dailyTasks={dailyTasks}
          weeklyTasks={weeklyTasks}
          monthlyTasks={monthlyTasks}
          onToggle={handleToggle}
          loading={loadingTaskId}
        />
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateTask}
        isLoading={createTask.isPending}
      />
    </div>
  )
}
