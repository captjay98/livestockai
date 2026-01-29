import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface StatusOption {
  value: string
  label: string
}

interface StatusFilterProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  options: Array<StatusOption>
  placeholder?: string
  allLabel?: string
}

export function StatusFilter({
  value,
  onValueChange,
  options,
  placeholder = 'All Status',
  allLabel = 'All',
}: StatusFilterProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={(val: string | null) =>
        onValueChange(val === 'all' ? undefined : val || undefined)
      }
    >
      <SelectTrigger className="w-[150px] h-10">
        <SelectValue>
          {value
            ? options.find((opt) => opt.value === value)?.label || value
            : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
