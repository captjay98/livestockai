import { useTranslation } from 'react-i18next'
import type { MortalityRecord } from '~/features/batches/types'
import { useFormatDate } from '~/features/settings'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { DataTable } from '~/components/ui/data-table'

interface MortalityRecordsTabProps {
  records: Array<MortalityRecord>
  isLoading: boolean
}

export function MortalityRecordsTab({
  records,
  isLoading,
}: MortalityRecordsTabProps) {
  const { t } = useTranslation(['common', 'batches'])
  const { format: formatDate } = useFormatDate()

  const columns = [
    {
      accessorKey: 'date',
      header: t('common:date', { defaultValue: 'Date' }),
      cell: ({ row }: { row: { original: MortalityRecord } }) =>
        formatDate(row.original.date),
    },
    {
      accessorKey: 'quantity',
      header: t('common:quantity', { defaultValue: 'Quantity' }),
    },
    {
      accessorKey: 'cause',
      header: t('batches:mortality.cause', { defaultValue: 'Cause' }),
      cell: ({ row }: { row: { original: MortalityRecord } }) => (
        <span className="capitalize">{row.original.cause}</span>
      ),
    },
    {
      accessorKey: 'notes',
      header: t('common:notes', { defaultValue: 'Notes' }),
    },
  ]

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative">
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-bold tracking-tight">
          {t('mortality.records', {
            defaultValue: 'Mortality Records',
          })}
        </CardTitle>
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
