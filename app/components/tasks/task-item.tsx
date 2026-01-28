import { Check, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TaskWithStatus } from '~/features/tasks/server'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface TaskItemProps {
    task: TaskWithStatus
    onToggle: (task: TaskWithStatus) => void
    loading: boolean
}

export function TaskItem({ task, onToggle, loading }: TaskItemProps) {
    const { t } = useTranslation('tasks')

    return (
        <div
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
                    {t(task.title)}
                </span>
                {task.description && (
                    <span className="text-xs text-muted-foreground block truncate">
                        {t(task.description)}
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
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Check className="h-4 w-4" />
                )}
            </Button>
        </div>
    )
}
