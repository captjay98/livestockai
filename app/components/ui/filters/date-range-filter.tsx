import { CalendarIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

interface DateRangeFilterProps {
  startDate?: string
  endDate?: string
  onStartDateChange: (date: string | undefined) => void
  onEndDateChange: (date: string | undefined) => void
  label?: string
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
}: DateRangeFilterProps) {
  const hasDateRange = startDate || endDate

  return (
    <Popover>
      <PopoverTrigger className="h-10 justify-start text-left font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm flex items-center">
        <CalendarIcon className="mr-2 h-4 w-4" />
        {hasDateRange ? (
          <span>
            {startDate || 'Start'} - {endDate || 'End'}
          </span>
        ) : (
          label
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value || undefined)}
            />
          </div>
          {hasDateRange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onStartDateChange(undefined)
                onEndDateChange(undefined)
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
