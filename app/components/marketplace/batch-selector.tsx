import { useTranslation } from 'react-i18next'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

interface Batch {
    id: string
    batchName: string
    species: string
    currentQuantity: number
    livestockType: string
}

interface BatchSelectorProps {
    batches: Array<Batch>
    onSelect: (batchId: string) => void
}

export function BatchSelector({ batches, onSelect }: BatchSelectorProps) {
    const { t } = useTranslation('marketplace')

    const handleSelect = (batchId: string) => {
        onSelect(batchId)
    }

    return (
        <Select onValueChange={(value) => value && handleSelect(value as string)}>
            <SelectTrigger>
                <SelectValue
                    placeholder={t('selectBatch', {
                        defaultValue: 'Select a batch to pre-fill',
                    })}
                />
            </SelectTrigger>
            <SelectContent>
                {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                        <div className="flex flex-col">
                            <span className="font-medium">
                                {batch.batchName || `${batch.species} Batch`}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {batch.species} • {batch.currentQuantity}{' '}
                                available
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
