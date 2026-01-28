'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CheckCircle, Clock, Image as ImageIcon } from 'lucide-react'
import { TaskApprovalDialog } from './TaskApprovalDialog'
import { getPendingApprovalsFn } from '~/features/digital-foreman/server-tasks'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

interface TaskAssignment {
  id: string
  taskId: string
  workerName: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  dueDate: string | null
  completedAt: Date | null
  completionNotes: string | null
  photoCount?: number
}

interface PendingApprovalsCardProps {
  farmId: string
}

export function PendingApprovalsCard({ farmId }: PendingApprovalsCardProps) {
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: pendingTasks = [], isLoading } = useQuery({
    queryKey: ['pending-approvals', farmId],
    queryFn: () => getPendingApprovalsFn({ data: { farmId } }),
    enabled: !!farmId,
  })

  if (isLoading) return <div>Loading...</div>

  if (pendingTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No tasks pending approval</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Pending Approvals
            <Badge variant="secondary">{pendingTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{task.workerName || 'Unknown'}</span>
                    {(task as any).photoCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3" />
                        {(task as any).photoCount}
                      </span>
                    )}
                  </div>
                  {task.completedAt && (
                    <div className="text-xs text-muted-foreground">
                      Completed {format(task.completedAt, 'MMM d, HH:mm')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] min-w-[44px]"
                    onClick={() => {
                      setSelectedTask(task as any)
                      setDialogOpen(true)
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TaskApprovalDialog
        task={selectedTask as any}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
