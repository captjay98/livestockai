'use client'

import { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { TaskCompletionDialog } from './TaskCompletionDialog'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

interface Task {
    id: string
    taskId: string
    status: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    dueDate: Date | null
    requiresPhoto: boolean
}

interface TodaysTasksProps {
    tasks: Array<Task>
}

const priorityColors = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
    urgent: 'destructive',
} as const

export function TodaysTasks({ tasks }: TodaysTasksProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const pendingTasks = tasks.filter(
        (t) => t.status === 'pending' || t.status === 'in_progress',
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today's Tasks ({pendingTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {pendingTasks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        No pending tasks
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingTasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                priorityColors[task.priority]
                                            }
                                        >
                                            {task.priority}
                                        </Badge>
                                        <span className="font-medium">
                                            Task #{task.taskId.slice(0, 8)}
                                        </span>
                                    </div>
                                    {task.dueDate && (
                                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            <Clock className="h-3 w-3" />
                                            Due:{' '}
                                            {format(
                                                new Date(task.dueDate),
                                                'HH:mm',
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setSelectedTask(task)
                                        setDialogOpen(true)
                                    }}
                                >
                                    Complete
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <TaskCompletionDialog
                    assignmentId={selectedTask?.id || ''}
                    requiresPhoto={selectedTask?.requiresPhoto || false}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            </CardContent>
        </Card>
    )
}
