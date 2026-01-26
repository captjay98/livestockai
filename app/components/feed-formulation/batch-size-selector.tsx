import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface BatchSizeSelectorProps {
  value: string
  onChange: (value: string) => void
  customValue: string
  onCustomChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

export function BatchSizeSelector({
  value,
  onChange,
  customValue,
  onCustomChange,
  options,
}: BatchSizeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Batch Size</Label>
        <Select value={value} onValueChange={(v) => onChange(v || '100')}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value === 'custom' && (
        <div className="space-y-2">
          <Label>Custom Size (kg)</Label>
          <Input
            type="number"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Enter size"
            className="h-12"
          />
        </div>
      )}
    </div>
  )
}
