import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface InvoiceFiltersProps {
  status?: 'paid' | 'partial' | 'unpaid'
  onStatusChange: (status?: 'paid' | 'partial' | 'unpaid') => void
}

export function InvoiceFilters({
  status,
  onStatusChange,
}: InvoiceFiltersProps) {
  const { t } = useTranslation(['invoices', 'common'])

  return (
    <Select
      value={status || 'all'}
      onValueChange={(value) =>
        onStatusChange(
          value === 'all' || value === null
            ? undefined
            : (value as 'paid' | 'partial' | 'unpaid'),
        )
      }
    >
      <SelectTrigger className="w-[180px] h-10">
        <SelectValue>
          {status
            ? t('status.' + status, { defaultValue: status })
            : t('labels.filterStatus')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('status.all')}</SelectItem>
        <SelectItem value="paid">{t('status.paid')}</SelectItem>
        <SelectItem value="partial">{t('status.partial')}</SelectItem>
        <SelectItem value="unpaid">{t('status.unpaid')}</SelectItem>
      </SelectContent>
    </Select>
  )
}
