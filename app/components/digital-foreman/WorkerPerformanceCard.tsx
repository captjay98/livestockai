'use client'

import { CheckCircle, Clock, TrendingUp, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'

export interface WorkerPerformanceData {
  workerId: string
  workerName: string
  taskCompletionRate: number
  tasksCompleted: number
  tasksTotal: number
  attendanceRate: number
  daysPresent: number
  daysExpected: number
  approvalRate: number
  tasksApproved: number
  tasksRejected: number
}

interface WorkerPerformanceCardProps {
  data: WorkerPerformanceData
}

function MetricRow({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  subtext: string
  color: 'green' | 'amber' | 'red' | 'neutral'
}) {
  const colorClasses = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    neutral: 'text-muted-foreground',
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
      <div className={`p-2 rounded-lg bg-muted ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className={`text-lg font-bold ${colorClasses[color]}`}>{value}%</span>
        </div>
        <Progress value={value} className="h-2 mt-1" />
        <span className="text-xs text-muted-foreground">{subtext}</span>
      </div>
    </div>
  )
}

function getColor(rate: number): 'green' | 'amber' | 'red' {
  if (rate >= 80) return 'green'
  if (rate >= 50) return 'amber'
  return 'red'
}

export function WorkerPerformanceCard({ data }: WorkerPerformanceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{data.workerName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <MetricRow
          icon={CheckCircle}
          label="Task Completion"
          value={Math.round(data.taskCompletionRate)}
          subtext={`${data.tasksCompleted} of ${data.tasksTotal} tasks completed`}
          color={getColor(data.taskCompletionRate)}
        />
        <MetricRow
          icon={Clock}
          label="Attendance"
          value={Math.round(data.attendanceRate)}
          subtext={`${data.daysPresent} of ${data.daysExpected} days present`}
          color={getColor(data.attendanceRate)}
        />
        <MetricRow
          icon={data.approvalRate >= 80 ? TrendingUp : XCircle}
          label="Approval Rate"
          value={Math.round(data.approvalRate)}
          subtext={`${data.tasksApproved} approved, ${data.tasksRejected} rejected`}
          color={getColor(data.approvalRate)}
        />
      </CardContent>
    </Card>
  )
}
