import { Search, X } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

interface SearchFilterProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchFilter({
  value,
  onValueChange,
  placeholder = 'Search...',
  className,
}: SearchFilterProps) {
  return (
    <div className={`relative ${className || ''}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="pl-9 pr-9 h-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          onClick={() => onValueChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
