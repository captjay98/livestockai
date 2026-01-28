'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'
import { getAssignmentsByFarmFn } from '~/features/digital-foreman/server-tasks'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/components/ui/table'

interface TaskOverviewProps {
    farmId: string
}

export function TaskOverview({ farmId }: TaskOverviewProps) {
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['task-assignments', farmId],
        queryFn: () => getAssignmentsByFarmFn({ data: { farmId } }),
        enabled: !!farmId,
    })

    if (isLoading) return <div>Loading...</div>

    const priorityColors = {
        low: 'secondary',
        medium: 'default',
        high: 'destructive',
        urgent: 'destructive',
    } as const

    return (
        <Card>
            <CardHeader>
                <CardTitle>Task Assignments</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Worker</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell>
                                    {task.workerName || 'Unassigned'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={priorityColors[task.priority]}
                                    >
                                        {task.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {task.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {task.dueDate ? (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {format(
                                                new Date(task.dueDate),
                                                'MMM d, HH:mm',
                                            )}
                                        </span>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
