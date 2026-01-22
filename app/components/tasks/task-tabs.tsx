import { useTranslation } from 'react-i18next'
import { TaskList } from './task-list'
import type { TaskWithStatus } from '~/features/tasks/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

interface TaskTabsProps {
  dailyTasks: Array<TaskWithStatus>
  weeklyTasks: Array<TaskWithStatus>
  monthlyTasks: Array<TaskWithStatus>
  onToggle: (task: TaskWithStatus) => void
  loading: string | null
}

export function TaskTabs({
  dailyTasks,
  weeklyTasks,
  monthlyTasks,
  onToggle,
  loading,
}: TaskTabsProps) {
  const { t } = useTranslation('tasks')

  const getCompletedCount = (tasks: Array<TaskWithStatus>) =>
    tasks.filter((task) => task.completed).length

  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="daily">
          {t('frequencies.daily')} ({getCompletedCount(dailyTasks)}/
          {dailyTasks.length})
        </TabsTrigger>
        <TabsTrigger value="weekly">
          {t('frequencies.weekly')} ({getCompletedCount(weeklyTasks)}/
          {weeklyTasks.length})
        </TabsTrigger>
        <TabsTrigger value="monthly">
          {t('frequencies.monthly')} ({getCompletedCount(monthlyTasks)}/
          {monthlyTasks.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="daily" className="mt-4">
        <TaskList
          title={t('sections.daily')}
          tasks={dailyTasks}
          onToggle={onToggle}
          loading={loading}
        />
      </TabsContent>

      <TabsContent value="weekly" className="mt-4">
        <TaskList
          title={t('sections.weekly')}
          tasks={weeklyTasks}
          onToggle={onToggle}
          loading={loading}
        />
      </TabsContent>

      <TabsContent value="monthly" className="mt-4">
        <TaskList
          title={t('sections.monthly')}
          tasks={monthlyTasks}
          onToggle={onToggle}
          loading={loading}
        />
      </TabsContent>
    </Tabs>
  )
}
