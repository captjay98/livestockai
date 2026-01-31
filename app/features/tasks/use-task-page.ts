import { useMemo } from 'react'
import { useTaskMutations } from './mutations'
import type { TaskWithStatus } from './server'
import { useFarm } from '~/features/farms/context'

export function useTaskPage(tasks: Array<TaskWithStatus>) {
  const { selectedFarmId } = useFarm()
  const { completeTask, uncompleteTask, isPending } = useTaskMutations()

  const farmId = selectedFarmId
  const hasFarm = Boolean(farmId)

  const { dailyTasks, weeklyTasks, monthlyTasks } = useMemo(
    () => ({
      dailyTasks: tasks.filter((task) => task.frequency === 'daily'),
      weeklyTasks: tasks.filter((task) => task.frequency === 'weekly'),
      monthlyTasks: tasks.filter((task) => task.frequency === 'monthly'),
    }),
    [tasks],
  )

  const handleToggle = (task: TaskWithStatus) => {
    if (!farmId) return
    if (task.completed) {
      uncompleteTask.mutate({ taskId: task.id })
    } else {
      completeTask.mutate({ taskId: task.id })
    }
  }

  // Get the currently loading task ID from the mutation variables
  const loading = completeTask.isPending
    ? completeTask.variables.taskId
    : uncompleteTask.isPending
      ? uncompleteTask.variables.taskId
      : null

  return {
    farmId,
    hasFarm,
    dailyTasks,
    weeklyTasks,
    monthlyTasks,
    loading,
    handleToggle,
    isPending,
  }
}
