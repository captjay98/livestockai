import { useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { completeTaskFn, uncompleteTaskFn } from './server'
import type { TaskWithStatus } from './server'
import { useFarm } from '~/features/farms/context'

export function useTaskPage(tasks: Array<TaskWithStatus>) {
  const router = useRouter()
  const { selectedFarmId } = useFarm()
  const [loading, setLoading] = useState<string | null>(null)

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

  return {
    farmId,
    hasFarm,
    dailyTasks,
    weeklyTasks,
    monthlyTasks,
    loading,
    handleToggle,
  }
}
