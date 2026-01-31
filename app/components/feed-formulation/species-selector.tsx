import { useTranslation } from 'react-i18next'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface SpeciesSelectorProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}

export function SpeciesSelector({
  value,
  onChange,
  options,
  disabled,
}: SpeciesSelectorProps) {
  const { t } = useTranslation(['feedFormulation', 'common'])
  return (
    <div className="space-y-2">
      <Label>
        {t('feedFormulation:labels.species', { defaultValue: 'Species' })}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v || '')}
        disabled={disabled}
      >
        <SelectTrigger className="h-12">
          <SelectValue
            placeholder={t('feedFormulation:placeholders.selectSpecies', {
              defaultValue: 'Select species',
            })}
          />
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
  )
}
