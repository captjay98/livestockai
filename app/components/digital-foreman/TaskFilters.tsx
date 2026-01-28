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
  onClick?: () => void
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

export interface TaskFiltersState {
  workerId: string | null
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'pending_approval' | 'verified' | 'rejected'
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

export function TaskFilters({ filters, onFiltersChange, workers }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
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
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as TaskFiltersState['status'] })}
      >
        <SelectTrigger className="h-11 min-w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
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
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value as TaskFiltersState['priority'] })}
      >
        <SelectTrigger className="h-11 min-w-[130px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger>
          <Button
            variant="outline"
            className={cn('h-11 min-w-[140px] justify-start text-left font-normal', !filters.dueDateFrom && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dueDateFrom ? format(filters.dueDateFrom, 'MMM d') : 'From'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dueDateFrom || undefined}
            onSelect={(date) => onFiltersChange({ ...filters, dueDateFrom: date || null })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger>
          <Button
            variant="outline"
            className={cn('h-11 min-w-[140px] justify-start text-left font-normal', !filters.dueDateTo && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dueDateTo ? format(filters.dueDateTo, 'MMM d') : 'To'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dueDateTo || undefined}
            onSelect={(date) => onFiltersChange({ ...filters, dueDateTo: date || null })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {(filters.workerId || filters.status !== 'all' || filters.priority !== 'all' || filters.dueDateFrom || filters.dueDateTo) && (
        <Button
          variant="ghost"
          className="h-11"
          onClick={() => onFiltersChange({
            workerId: null,
            status: 'all',
            priority: 'all',
            dueDateFrom: null,
            dueDateTo: null,
          })}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
