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
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative">
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-bold tracking-tight">
          {t('feed.history', { defaultValue: 'Feeding History' })}
        </CardTitle>
        <CardDescription className="text-muted-foreground/80 font-medium">
          {t('feed.recent', { defaultValue: 'Recent records' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 p-0 sm:p-6 sm:pt-0">
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
