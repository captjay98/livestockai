import { Bird, Edit, Fish, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export interface FeedRecord {
    id: string
    batchId: string
    feedType: string
    brandName: string | null
    bagSizeKg: number | null
    numberOfBags: number | null
    quantityKg: string
    cost: string
    date: Date
    species: string
    batchName: string | null
    livestockType: string
    farmId: string
    farmName?: string
    supplierId: string | null
    supplierName: string | null
    notes: string | null
}

interface GetFeedColumnsProps {
    t: (key: string, options?: any) => string
    formatDate: (date: Date) => string
    formatCurrency: (amount: string | number) => string
    formatWeight: (weight: number) => string
    onEdit: (record: FeedRecord) => void
    onDelete: (record: FeedRecord) => void
}

export const getFeedColumns = ({
    t,
    formatDate,
    formatCurrency,
    formatWeight,
    onEdit,
    onDelete,
}: GetFeedColumnsProps): Array<ColumnDef<FeedRecord>> => [
    {
        accessorKey: 'date',
        header: t('feed:labels.date'),
        cell: ({ row }) => formatDate(row.original.date),
    },
    {
        accessorKey: 'species',
        header: t('feed:labels.batch'),
        cell: ({ row }) => (
            <div className="flex flex-col">
                <div className="flex items-center gap-1 font-medium capitalize">
                    {row.original.livestockType === 'poultry' ? (
                        <Bird className="h-3 w-3 text-orange-600" />
                    ) : (
                        <Fish className="h-3 w-3 text-blue-600" />
                    )}
                    {row.original.batchName || row.original.species}
                </div>
                {row.original.batchName && (
                    <span className="text-xs text-muted-foreground capitalize">
                        {row.original.species}
                    </span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'brandName',
        header: t('feed:labels.brand'),
        cell: ({ row }) => {
            const feedTypeLabel = row.original.feedType
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            return (
                <div className="flex flex-col">
                    {row.original.brandName ? (
                        <>
                            <span className="font-medium">
                                {row.original.brandName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {feedTypeLabel}
                            </span>
                        </>
                    ) : (
                        <Badge variant="secondary">{feedTypeLabel}</Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: 'quantityKg',
        header: t('feed:labels.quantity'),
        cell: ({ row }) => {
            const qty = parseFloat(row.original.quantityKg)
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{formatWeight(qty)}</span>
                    {row.original.numberOfBags && row.original.bagSizeKg && (
                        <span className="text-xs text-muted-foreground">
                            {t('feed:bagDetails', {
                                count: row.original.numberOfBags,
                                size: row.original.bagSizeKg,
                                defaultValue: '{{count}} × {{size}}kg bags',
                            })}
                        </span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: 'supplierName',
        header: t('feed:labels.supplier'),
        cell: ({ row }) =>
            row.original.supplierName || (
                <span className="text-muted-foreground">—</span>
            ),
    },
    {
        accessorKey: 'cost',
        header: t('feed:labels.cost'),
        cell: ({ row }) => formatCurrency(row.original.cost),
    },
    {
        id: 'actions',
        cell: ({ row }) => (
            <div className="flex justify-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(row.original)}
                    title={t('common:edit')}
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(row.original)}
                    title={t('common:delete')}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
]
