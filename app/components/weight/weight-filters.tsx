import { useTranslation } from 'react-i18next'
import type { Batch } from '~/features/weight/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface WeightFiltersProps {
  batchId?: string
  onBatchChange: (batchId: string | undefined) => void
  batches: Array<Batch>
}

export function WeightFilters({
  batchId,
  onBatchChange,
  batches,
}: WeightFiltersProps) {
  const { t } = useTranslation(['weight', 'batches'])

  return (
    <div className="flex gap-4">
      <Select
        value={batchId || 'all'}
        onValueChange={(value) => {
          if (value === null) return
          onBatchChange(value === 'all' ? undefined : value)
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue
            placeholder={t('batches:selectBatch', {
              defaultValue: 'Select batch',
            })}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('weight:allBatches', { defaultValue: 'All batches' })}
          </SelectItem>
          {batches.map((batch) => (
            <SelectItem key={batch.id} value={batch.id}>
              {batch.species} ({batch.currentQuantity})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
