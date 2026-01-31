import { useTranslation } from 'react-i18next'
import type { ExpenseRecord } from '~/features/batches/types'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { DataTable } from '~/components/ui/data-table'

interface ExpensesTabProps {
  records: Array<ExpenseRecord>
  isLoading: boolean
}

export function ExpensesTab({ records, isLoading }: ExpensesTabProps) {
  const { t } = useTranslation(['common'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()

  const columns = [
    {
      accessorKey: 'date',
      header: t('common:date', { defaultValue: 'Date' }),
      cell: ({ row }: { row: { original: ExpenseRecord } }) =>
        formatDate(row.original.date),
    },
    {
      accessorKey: 'category',
      header: t('common:category', { defaultValue: 'Category' }),
      cell: ({ row }: { row: { original: ExpenseRecord } }) => (
        <span className="capitalize">
          {row.original.category.replace('_', ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: t('common:amount', { defaultValue: 'Amount' }),
      cell: ({ row }: { row: { original: ExpenseRecord } }) =>
        formatCurrency(row.original.amount),
    },
    {
      accessorKey: 'description',
      header: t('common:description', { defaultValue: 'Description' }),
    },
  ]

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative">
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-bold tracking-tight">
          {t('common:expenses', { defaultValue: 'Expenses' })}
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
