import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export interface TaskFiltersState {
  workerId: string | null
  status:
    | 'all'
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'pending_approval'
    | 'verified'
    | 'rejected'
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent'
  dueDateFrom: Date | null
  dueDateTo: Date | null
}

interface Worker {
  id: string
  userName: string | null
}

interface TaskFiltersProps {
  filters: TaskFiltersState
  onFiltersChange: (filters: TaskFiltersState) => void
  workers: Array<Worker>
}

export function TaskFilters({
  filters,
  onFiltersChange,
  workers,
}: TaskFiltersProps) {
  const { t } = useTranslation(['digitalForeman', 'common'])
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <Select
        value={filters.workerId || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            workerId: value === 'all' ? null : value,
          })
        }
      >
        <SelectTrigger className="h-11 min-w-[160px]">
          <SelectValue
            placeholder={t('digitalForeman:placeholders.allWorkers', {
              defaultValue: 'All Workers',
            })}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('digitalForeman:placeholders.allWorkers', {
              defaultValue: 'All Workers',
            })}
          </SelectItem>
          {workers.map((worker) => (
            <SelectItem key={worker.id} value={worker.id}>
              {worker.userName || 'Unknown'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value as TaskFiltersState['status'],
          })
        }
      >
        <SelectTrigger className="h-11 min-w-[150px]">
          <SelectValue
            placeholder={t('common:status', { defaultValue: 'Status' })}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('common:allStatus', { defaultValue: 'All Status' })}
          </SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending_approval">Pending Approval</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            priority: value as TaskFiltersState['priority'],
          })
        }
      >
        <SelectTrigger className="h-11 min-w-[130px]">
          <SelectValue
            placeholder={t('common:priority', { defaultValue: 'Priority' })}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('common:allPriority', { defaultValue: 'All Priority' })}
          </SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        className={cn(
          'h-11 min-w-[140px] justify-start text-left font-normal',
          !filters.dueDateFrom && 'text-muted-foreground',
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {filters.dueDateFrom
          ? format(filters.dueDateFrom, 'MMM d')
          : t('common:from', { defaultValue: 'From' })}
      </Button>

      <Button
        variant="outline"
        className={cn(
          'h-11 min-w-[140px] justify-start text-left font-normal',
          !filters.dueDateTo && 'text-muted-foreground',
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {filters.dueDateTo
          ? format(filters.dueDateTo, 'MMM d')
          : t('common:to', { defaultValue: 'To' })}
      </Button>

      {(filters.workerId ||
        filters.status !== 'all' ||
        filters.priority !== 'all' ||
        filters.dueDateFrom ||
        filters.dueDateTo) && (
        <Button
          variant="ghost"
          className="h-11"
          onClick={() =>
            onFiltersChange({
              workerId: null,
              status: 'all',
              priority: 'all',
              dueDateFrom: null,
              dueDateTo: null,
            })
          }
        >
          {t('common:clear', { defaultValue: 'Clear' })}
        </Button>
      )}
    </div>
  )
}
