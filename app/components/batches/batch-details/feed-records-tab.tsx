import { useTranslation } from 'react-i18next'
import type { FeedRecord } from '~/features/batches/types'
import {
    useFormatCurrency,
    useFormatDate,
    useFormatWeight,
} from '~/features/settings'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/components/ui/card'
import { DataTable } from '~/components/ui/data-table'

interface FeedRecordsTabProps {
    records: Array<FeedRecord>
    isLoading: boolean
}

export function FeedRecordsTab({ records, isLoading }: FeedRecordsTabProps) {
    const { t } = useTranslation(['common', 'feed'])
    const { format: formatCurrency } = useFormatCurrency()
    const { format: formatDate } = useFormatDate()
    const { format: formatWeight, label: weightLabel } = useFormatWeight()

    const columns = [
        {
            accessorKey: 'date',
            header: t('common:date', { defaultValue: 'Date' }),
            cell: ({ row }: { row: { original: FeedRecord } }) =>
                formatDate(row.original.date),
        },
        {
            accessorKey: 'feedType',
            header: t('common:type', { defaultValue: 'Type' }),
            cell: ({ row }: { row: { original: FeedRecord } }) => (
                <span className="capitalize">
                    {row.original.feedType.replace('_', ' ')}
                </span>
            ),
        },
        {
            accessorKey: 'brandName',
            header: t('feed:brand', { defaultValue: 'Brand' }),
            cell: ({ row }: { row: { original: FeedRecord } }) =>
                row.original.brandName || '-',
        },
        {
            accessorKey: 'quantityKg',
            header: `${t('common:quantity', { defaultValue: 'Qty' })} (${weightLabel})`,
            cell: ({ row }: { row: { original: FeedRecord } }) =>
                formatWeight(parseFloat(row.original.quantityKg)),
        },
        {
            accessorKey: 'cost',
            header: t('common:price', { defaultValue: 'Cost' }),
            cell: ({ row }: { row: { original: FeedRecord } }) =>
                formatCurrency(row.original.cost),
        },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {t('feed.history', { defaultValue: 'Feeding History' })}
                </CardTitle>
                <CardDescription>
                    {t('feed.recent', { defaultValue: 'Recent records' })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={records}
                    total={records.length}
                    page={1}
                    pageSize={20}
                    totalPages={1}
                    filters={null}
                    isLoading={isLoading}
                    onPaginationChange={() => {}}
                    onSortChange={() => {}}
                />
            </CardContent>
        </Card>
    )
}
