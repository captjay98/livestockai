import { useTranslation } from 'react-i18next'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

interface EggFiltersProps {
    batchId?: string | null
    onBatchChange: (batchId: string | undefined) => void
    batches: Array<{ id: string; species: string }>
}

export function EggFilters({
    batchId,
    onBatchChange,
    batches,
}: EggFiltersProps) {
    const { t } = useTranslation(['eggs', 'batches'])

    return (
        <div className="flex gap-2">
            <Select
                value={batchId || 'all'}
                onValueChange={(value) =>
                    value && onBatchChange(value === 'all' ? undefined : value)
                }
            >
                <SelectTrigger className="w-48">
                    <SelectValue
                        placeholder={t('batches:select_batch', {
                            defaultValue: 'Select batch',
                        })}
                    />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        {t('eggs:all_batches', { defaultValue: 'All batches' })}
                    </SelectItem>
                    {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                            {batch.species}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
