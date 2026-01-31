import { useTranslation } from 'react-i18next'
import type { SaleRecord } from '~/features/batches/types'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { DataTable } from '~/components/ui/data-table'

interface SalesTabProps {
  records: Array<SaleRecord>
  isLoading: boolean
}

export function SalesTab({ records, isLoading }: SalesTabProps) {
  const { t } = useTranslation(['common', 'sales'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()

  const columns = [
    {
      accessorKey: 'date',
      header: t('common:date', { defaultValue: 'Date' }),
      cell: ({ row }: { row: { original: SaleRecord } }) =>
        formatDate(row.original.date),
    },
    {
      accessorKey: 'quantity',
      header: t('common:quantity', { defaultValue: 'Qty' }),
    },
    {
      accessorKey: 'unitType',
      header: t('common:unit', { defaultValue: 'Unit' }),
      cell: ({ row }: { row: { original: SaleRecord } }) => (
        <span className="capitalize">{row.original.unitType || '-'}</span>
      ),
    },
    {
      accessorKey: 'ageWeeks',
      header: t('common:age', { defaultValue: 'Age' }),
      cell: ({ row }: { row: { original: SaleRecord } }) =>
        row.original.ageWeeks ? `${row.original.ageWeeks} wks` : '-',
    },
    {
      accessorKey: 'totalAmount',
      header: t('common:amount', { defaultValue: 'Amount' }),
      cell: ({ row }: { row: { original: SaleRecord } }) =>
        formatCurrency(row.original.totalAmount),
    },
    {
      accessorKey: 'paymentStatus',
      header: t('common:status', { defaultValue: 'Status' }),
      cell: ({ row }: { row: { original: SaleRecord } }) => (
        <Badge
          variant={
            row.original.paymentStatus === 'paid'
              ? 'default'
              : row.original.paymentStatus === 'pending'
                ? 'secondary'
                : 'outline'
          }
        >
          {row.original.paymentStatus ||
            t('sales:status.paid', { defaultValue: 'paid' })}
        </Badge>
      ),
    },
    {
      accessorKey: 'customerName',
      header: t('sales.customer', { defaultValue: 'Customer' }),
    },
  ]

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative">
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-bold tracking-tight">
          {t('sales.history', { defaultValue: 'Sales History' })}
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
