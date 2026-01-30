import { useTranslation } from 'react-i18next'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface ListingFilters {
  livestockType: string
  species: string
  minPrice: string
  maxPrice: string
  distanceRadius: string
}

interface ListingFiltersProps {
  filters: ListingFilters
  onFiltersChange: (filters: ListingFilters) => void
}

const LIVESTOCK_TYPES = [
  'poultry',
  'fish',
  'cattle',
  'goats',
  'sheep',
  'bees',
] as const

const DISTANCE_OPTIONS = [
  { value: '25', label: '25km' },
  { value: '50', label: '50km' },
  { value: '100', label: '100km' },
  { value: '200', label: '200km' },
] as const

export function ListingFilters({
  filters,
  onFiltersChange,
}: ListingFiltersProps) {
  const { t } = useTranslation('marketplace')

  const updateFilter = (key: keyof ListingFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="space-y-2">
        <Label>
          {t('filters.livestockType', {
            defaultValue: 'Livestock Type',
          })}
        </Label>
        <Select
          value={filters.livestockType}
          onValueChange={(value) => updateFilter('livestockType', value || '')}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={t('filters.allTypes', {
                defaultValue: 'All types',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {t('filters.allTypes', {
                defaultValue: 'All types',
              })}
            </SelectItem>
            {LIVESTOCK_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="capitalize">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('filters.species', { defaultValue: 'Species' })}</Label>
        <Input
          placeholder={t('filters.speciesPlaceholder', {
            defaultValue: 'e.g. broiler, catfish',
          })}
          value={filters.species}
          onChange={(e) => updateFilter('species', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('filters.minPrice', { defaultValue: 'Min Price' })}</Label>
        <Input
          type="number"
          placeholder={t('filters.minPricePlaceholder', {
            defaultValue: '0',
          })}
          value={filters.minPrice}
          onChange={(e) => updateFilter('minPrice', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('filters.maxPrice', { defaultValue: 'Max Price' })}</Label>
        <Input
          type="number"
          placeholder={t('filters.maxPricePlaceholder', {
            defaultValue: '10000',
          })}
          value={filters.maxPrice}
          onChange={(e) => updateFilter('maxPrice', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('filters.distance', { defaultValue: 'Distance' })}</Label>
        <Select
          value={filters.distanceRadius}
          onValueChange={(value) => updateFilter('distanceRadius', value || '')}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={t('filters.anyDistance', {
                defaultValue: 'Any distance',
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {t('filters.anyDistance', {
                defaultValue: 'Any distance',
              })}
            </SelectItem>
            {DISTANCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
