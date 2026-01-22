import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, ClipboardList, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'
import {
  getTasksFn,
  completeTaskFn,
  uncompleteTaskFn,
  type TaskWithStatus,
} from '~/features/tasks/server'
import { useSettings } from '~/features/settings'

export const Route = createFileRoute('/_auth/tasks/')({
  component: TasksPage,
  loader: async ({ context }) => {
    const farmId = context.user?.settings?.defaultFarmId
    if (!farmId) return { tasks: [] }
    const tasks = await getTasksFn({ data: { farmId } })
    return { tasks }
  },
})

function TasksPage() {
  const { t } = useTranslation(['common'])
  const router = useRouter()
  const { tasks } = Route.useLoaderData()
  const { settings } = useSettings()
  const farmId = settings?.defaultFarmId

  const [loading, setLoading] = useState<string | null>(null)

  const dailyTasks = tasks.filter((t: TaskWithStatus) => t.frequency === 'daily')
  const weeklyTasks = tasks.filter((t: TaskWithStatus) => t.frequency === 'weekly')
  const monthlyTasks = tasks.filter((t: TaskWithStatus) => t.frequency === 'monthly')

  const handleToggle = async (task: TaskWithStatus) => {
    if (!farmId) return
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

  if (!farmId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a farm first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {t('common:tasks', { defaultValue: 'Tasks' })}
          </h1>
          <p className="text-sm text-muted-foreground">
            Daily, weekly, and monthly check-ins
          </p>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">
            Daily ({dailyTasks.filter((t: TaskWithStatus) => t.completed).length}/{dailyTasks.length})
          </TabsTrigger>
          <TabsTrigger value="weekly">
            Weekly ({weeklyTasks.filter((t: TaskWithStatus) => t.completed).length}/{weeklyTasks.length})
          </TabsTrigger>
          <TabsTrigger value="monthly">
            Monthly ({monthlyTasks.filter((t: TaskWithStatus) => t.completed).length}/{monthlyTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <TaskList
            title="Today's Priorities"
            tasks={dailyTasks}
            onToggle={handleToggle}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-4 space-y-4">
          <TaskList
            title="This Week"
            tasks={weeklyTasks}
            onToggle={handleToggle}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-4">
          <TaskList
            title="This Month"
            tasks={monthlyTasks}
            onToggle={handleToggle}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TaskList({
  title,
  tasks,
  onToggle,
  loading,
}: {
  title: string
  tasks: TaskWithStatus[]
  onToggle: (task: TaskWithStatus) => void
  loading: string | null
}) {
  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {completedCount}/{tasks.length} completed
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
              task.completed
                ? 'bg-muted/50 border-transparent opacity-60'
                : 'bg-card hover:bg-accent/50 hover:border-primary/20',
            )}
            onClick={() => onToggle(task)}
          >
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'font-medium block truncate',
                  task.completed && 'line-through text-muted-foreground',
                )}
              >
                {task.title}
              </span>
              {task.description && (
                <span className="text-xs text-muted-foreground block truncate">
                  {task.description}
                </span>
              )}
            </div>
            <Button
              variant={task.completed ? 'ghost' : 'outline'}
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full shrink-0 ml-2',
                task.completed
                  ? 'text-green-500 hover:text-green-600'
                  : 'text-muted-foreground',
              )}
              disabled={loading === task.id}
            >
              {loading === task.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No tasks found for this period.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
