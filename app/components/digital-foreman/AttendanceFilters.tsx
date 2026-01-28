'use client'

import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { cn } from '~/lib/utils'

// Stub Calendar component - simple date input alternative
interface CalendarProps {
  mode: 'single'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  initialFocus?: boolean
}

function Calendar({ selected, onSelect }: CalendarProps) {
  return (
    <div className="p-3">
      <Input
        type="date"
        value={selected ? format(selected, 'yyyy-MM-dd') : ''}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : undefined
          onSelect?.(date)
        }}
      />
    </div>
  )
}

// Stub Popover components - simple dropdown alternative
interface PopoverProps {
  children: React.ReactNode
}

function Popover({ children }: PopoverProps) {
  return <div className="relative">{children}</div>
}

interface PopoverTriggerProps {
  children: React.ReactNode
}

function PopoverTrigger({ children }: PopoverTriggerProps) {
  return <div>{children}</div>
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: string
}

function PopoverContent({ children, className }: PopoverContentProps) {
  return <div className={cn('absolute top-full left-0 z-50 bg-white border rounded-md shadow-lg', className)}>{children}</div>
}

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

export function AttendanceFilters({ filters, onFiltersChange, workers }: AttendanceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <Popover>
        <PopoverTrigger>
          <Button
            variant="outline"
            className={cn('h-11 min-w-[180px] justify-start text-left font-normal')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(filters.date, 'PPP')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.date}
            onSelect={(date) => date && onFiltersChange({ ...filters, date })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.workerId || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, workerId: value === 'all' ? null : value })}
      >
        <SelectTrigger className="h-11 min-w-[160px]">
          <SelectValue placeholder="All Workers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Workers</SelectItem>
          {workers.map((worker) => (
            <SelectItem key={worker.id} value={worker.id}>
              {worker.userName || 'Unknown'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as AttendanceFiltersState['status'] })}
      >
        <SelectTrigger className="h-11 min-w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="flagged">Flagged</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
