import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export interface AttendanceFiltersState {
  date: Date
  workerId: string | null
  status: 'all' | 'verified' | 'flagged' | 'pending'
}

interface Worker {
  id: string
  userName: string | null
}

interface AttendanceFiltersProps {
  filters: AttendanceFiltersState
  onFiltersChange: (filters: AttendanceFiltersState) => void
  workers: Array<Worker>
}

export function AttendanceFilters({
  filters,
  onFiltersChange,
  workers,
}: AttendanceFiltersProps) {
  const { t } = useTranslation(['digitalForeman', 'common'])
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <Button
        variant="outline"
        className={cn('h-11 min-w-[180px] justify-start text-left font-normal')}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {format(filters.date, 'PPP')}
      </Button>

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
            status: value as AttendanceFiltersState['status'],
          })
        }
      >
        <SelectTrigger className="h-11 min-w-[140px]">
          <SelectValue
            placeholder={t('common:status', { defaultValue: 'Status' })}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('common:allStatus', { defaultValue: 'All Status' })}
          </SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="flagged">Flagged</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
