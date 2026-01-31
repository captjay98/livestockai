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
        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer',
        task.completed
          ? 'bg-muted/30 border-muted opacity-70'
          : 'bg-card hover:bg-accent/30 border-border hover:border-primary/40 hover:shadow-md active:scale-[0.98]',
      )}
      onClick={() => onToggle(task)}
    >
      <Button
        variant={task.completed ? 'ghost' : 'outline'}
        size="icon"
        className={cn(
          'h-9 w-9 rounded-full shrink-0 border-2 transition-all',
          task.completed
            ? 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400'
            : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/10',
        )}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : task.completed ? (
          <Check className="h-5 w-5 stroke-[3]" />
        ) : (
          <div className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'font-medium block text-base',
            task.completed && 'line-through text-muted-foreground',
          )}
        >
          {t(task.title)}
        </span>
        {task.description && (
          <span className="text-sm text-muted-foreground/80 block mt-0.5">
            {t(task.description)}
          </span>
        )}
      </div>
    </div>
  )
}
