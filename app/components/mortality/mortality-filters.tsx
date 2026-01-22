import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const MORTALITY_CAUSES = [
  { value: 'disease', label: 'Disease' },
  { value: 'predator', label: 'Predator' },
  { value: 'weather', label: 'Weather' },
  { value: 'starvation', label: 'Starvation' },
  { value: 'injury', label: 'Injury' },
  { value: 'poisoning', label: 'Poisoning' },
  { value: 'suffocation', label: 'Suffocation' },
  { value: 'culling', label: 'Culling' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'other', label: 'Other' },
] as const

interface MortalityFiltersProps {
  cause?: string
  onCauseChange: (cause?: string) => void
}

export function MortalityFilters({
  cause,
  onCauseChange,
}: MortalityFiltersProps) {
  const { t } = useTranslation(['mortality', 'common'])

  return (
    <div className="flex gap-2">
      <Select
        value={cause || 'all'}
        onValueChange={(value) => {
          if (value === null) return
          onCauseChange(value === 'all' ? undefined : value)
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('filters.cause')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common:all')}</SelectItem>
          {MORTALITY_CAUSES.map((causeOption) => (
            <SelectItem key={causeOption.value} value={causeOption.value}>
              {causeOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
