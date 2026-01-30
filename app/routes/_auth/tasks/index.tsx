import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import type { TaskWithStatus } from '~/features/tasks/server'
import { TaskPageHeader } from '~/components/tasks/task-page-header'
import { TaskTabs } from '~/components/tasks/task-tabs'
import { TasksSkeleton } from '~/components/tasks/tasks-skeleton'
import { TaskDialog } from '~/components/tasks/task-dialog'
import { ErrorPage } from '~/components/error-page'
import {
  completeTaskFn,
  createTaskFn,
  getTasksFn,
  uncompleteTaskFn,
} from '~/features/tasks/server'
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
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const { tasks, defaultFarmId, farmId } = Route.useLoaderData()

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

  const handleToggle = async (task: TaskWithStatus) => {
    setLoading(task.id)
    try {
      if (task.completed) {
        await uncompleteTaskFn({ data: { taskId: task.id } })
      } else {
        await completeTaskFn({ data: { taskId: task.id } })
      }
      router.invalidate()
    } finally {
      setLoading(null)
    }
  }

  const handleCreateTask = async (data: {
    title: string
    description: string | null
    frequency: 'daily' | 'weekly' | 'monthly'
  }) => {
    // Use the farmId from search params, or fall back to default farm
    const targetFarmId = farmId ?? defaultFarmId
    if (!targetFarmId) {
      throw new Error('No farm selected')
    }

    setCreating(true)
    try {
      await createTaskFn({
        data: {
          farmId: targetFarmId,
          data: {
            title: data.title,
            description: data.description,
            frequency: data.frequency,
          },
        },
      })
      router.invalidate()
    } finally {
      setCreating(false)
    }
  }

  // Only show add button if we have a farm context
  const canAddTask = !!(farmId ?? defaultFarmId)

  return (
    <div className="space-y-6 pb-20">
      <TaskPageHeader
        onAddTask={canAddTask ? () => setDialogOpen(true) : undefined}
      />
      <div className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden border p-1 sm:p-2">
        <TaskTabs
          dailyTasks={dailyTasks}
          weeklyTasks={weeklyTasks}
          monthlyTasks={monthlyTasks}
          onToggle={handleToggle}
          loading={loading}
        />
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateTask}
        isLoading={creating}
      />
    </div>
  )
}
