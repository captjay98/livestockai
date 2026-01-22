import { useTranslation } from 'react-i18next'
import { getSupplierTypes } from './supplier-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface SupplierFiltersProps {
  supplierType?: string
  onSupplierTypeChange: (type?: string) => void
}

export function SupplierFilters({
  supplierType,
  onSupplierTypeChange,
}: SupplierFiltersProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const supplierTypes = getSupplierTypes(t)

  return (
    <Select
      value={supplierType || 'all'}
      onValueChange={(value) =>
        onSupplierTypeChange(
          value === 'all' || value === null ? undefined : value,
        )
      }
    >
      <SelectTrigger className="w-[150px] h-10">
        <SelectValue>
          {supplierType ? t(`types.${supplierType}`) : t('types.all')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('types.all')}</SelectItem>
        {supplierTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
