'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckInButton } from './CheckInButton'
import { TodaysTasks } from './TodaysTasks'
import { getAssignmentsByWorkerFn } from '~/features/digital-foreman/server-tasks'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface WorkerDashboardProps {
  farmId: string
  checkInId?: string | null
  isCheckedIn: boolean
  hoursToday?: number
}

export function WorkerDashboard({ farmId, checkInId, isCheckedIn, hoursToday = 0 }: WorkerDashboardProps) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['worker-tasks'],
    queryFn: () => getAssignmentsByWorkerFn({ data: {} }),
  })

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold">{hoursToday.toFixed(1)}h</div>
            <div className="text-muted-foreground">Hours worked today</div>
          </div>
          <CheckInButton farmId={farmId} checkInId={checkInId} isCheckedIn={isCheckedIn} />
        </CardContent>
      </Card>

      <TodaysTasks tasks={tasks} />
    </div>
  )
}
