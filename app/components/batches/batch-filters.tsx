import { Bird, Fish } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface BatchFiltersProps {
  status?: string
  livestockType?: string
  onStatusChange: (status: 'active' | 'depleted' | 'sold' | undefined) => void
  onLivestockTypeChange: (type: 'poultry' | 'fish' | undefined) => void
}

export function BatchFilters({
  status,
  livestockType,
  onStatusChange,
  onLivestockTypeChange,
}: BatchFiltersProps) {
  const { t } = useTranslation(['batches', 'common'])

  return (
    <>
      <Select
        value={status || 'all'}
        onValueChange={(value) => {
          if (value) {
            onStatusChange(
              value === 'all'
                ? undefined
                : (value as 'active' | 'depleted' | 'sold'),
            )
          }
        }}
      >
        <SelectTrigger className="w-[150px] h-10">
          <SelectValue>
            {status
              ? t(`statuses.${status}`, {
                  defaultValue:
                    status.charAt(0).toUpperCase() + status.slice(1),
                })
              : t('filters.allStatus', {
                  defaultValue: 'All Status',
                })}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('allStatus', { defaultValue: 'All Status' })}
          </SelectItem>
          <SelectItem value="active">
            {t('active', { defaultValue: 'Active' })}
          </SelectItem>
          <SelectItem value="depleted">
            {t('depleted', { defaultValue: 'Depleted' })}
          </SelectItem>
          <SelectItem value="sold">
            {t('sold', { defaultValue: 'Sold' })}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={livestockType || 'all'}
        onValueChange={(value) => {
          if (value) {
            onLivestockTypeChange(
              value === 'all' ? undefined : (value as 'poultry' | 'fish'),
            )
          }
        }}
      >
        <SelectTrigger className="w-[150px] h-10">
          <SelectValue>
            {livestockType
              ? t(`livestockTypes.${livestockType}`, {
                  defaultValue:
                    livestockType.charAt(0).toUpperCase() +
                    livestockType.slice(1),
                })
              : t('filters.allTypes', {
                  defaultValue: 'All Types',
                })}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('filters.allTypes', { defaultValue: 'All Types' })}
          </SelectItem>
          <SelectItem value="poultry">
            <div className="flex items-center gap-2">
              <Bird className="h-4 w-4" />
              {t('livestockTypes.poultry', {
                defaultValue: 'Poultry',
              })}
            </div>
          </SelectItem>
          <SelectItem value="fish">
            <div className="flex items-center gap-2">
              <Fish className="h-4 w-4" />
              {t('livestockTypes.fish', { defaultValue: 'Fish' })}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
