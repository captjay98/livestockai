import { useTranslation } from 'react-i18next'
import { TaskItem } from './task-item'
import type { TaskWithStatus } from '~/features/tasks/server'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/components/ui/card'

interface TaskListProps {
    title: string
    tasks: Array<TaskWithStatus>
    onToggle: (task: TaskWithStatus) => void
    loading: string | null
}

export function TaskList({ title, tasks, onToggle, loading }: TaskListProps) {
    const { t } = useTranslation('tasks')
    const completedCount = tasks.filter((task) => task.completed).length

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>
                    {t('completedCount', {
                        count: completedCount,
                        total: tasks.length,
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
                {tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={onToggle}
                        loading={loading === task.id}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                        {t('empty')}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
