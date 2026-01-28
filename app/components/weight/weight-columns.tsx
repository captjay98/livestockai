import { Edit, Scale, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { WeightSample } from '~/features/weight/types'
import { Button } from '~/components/ui/button'

interface GetWeightColumnsProps {
    t: TFunction
    formatDate: (date: Date | string) => string
    formatWeight: (weight: number) => string
    onEdit: (record: WeightSample) => void
    onDelete: (record: WeightSample) => void
}

export function getWeightColumns({
    t,
    formatDate,
    formatWeight,
    onEdit,
    onDelete,
}: GetWeightColumnsProps): Array<ColumnDef<WeightSample>> {
    return [
        {
            accessorKey: 'date',
            header: t('common:date', { defaultValue: 'Date' }),
            cell: ({ row }) => formatDate(row.original.date),
        },
        {
            accessorKey: 'batchSpecies',
            header: t('batches:batch', { defaultValue: 'Batch' }),
            cell: ({ row }) => (
                <span className="font-medium">{row.original.batchSpecies}</span>
            ),
        },
        {
            accessorKey: 'averageWeightKg',
            header: t('weight:avgWeight', { defaultValue: 'Avg Weight' }),
            cell: ({ row }) => (
                <div className="font-bold flex items-center">
                    <Scale className="h-3 w-3 mr-1 text-muted-foreground" />
                    {formatWeight(parseFloat(row.original.averageWeightKg))}
                </div>
            ),
        },
        {
            accessorKey: 'sampleSize',
            header: t('weight:sampleSize', { defaultValue: 'Sample Size' }),
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {t('weight:animalsCount', {
                        count: row.original.sampleSize,
                        defaultValue: '{{count}} animals',
                    })}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(row.original)}
                        title={t('common:edit', { defaultValue: 'Edit' })}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(row.original)}
                        title={t('common:delete', { defaultValue: 'Delete' })}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ]
}
