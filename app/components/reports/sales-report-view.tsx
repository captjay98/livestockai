import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, Layers, ShoppingBag } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { SalesReport } from '~/features/reports/server'
import { DataTable } from '~/components/ui/data-table'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { SummaryCard } from '~/components/ui/summary-card'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

export function SalesReportView({ report }: { report: SalesReport }) {
  const { t } = useTranslation(['reports', 'common'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'date',
        header: t('reports:sales.columns.date', {
          defaultValue: 'Date',
        }),
        cell: ({ row }) => (
          <span className="font-medium">{formatDate(row.original.date)}</span>
        ),
      },
      {
        accessorKey: 'livestockType',
        header: t('reports:sales.columns.type', {
          defaultValue: 'Type',
        }),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="capitalize bg-white/5 border-white/10"
          >
            {t(`common:livestock.${row.original.livestockType}`, {
              defaultValue: row.original.livestockType,
            })}
          </Badge>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('reports:sales.columns.quantity', {
          defaultValue: 'Quantity',
        }),
        cell: ({ row }) => row.original.quantity.toLocaleString(),
      },
      {
        accessorKey: 'unitPrice',
        header: t('reports:sales.columns.price', {
          defaultValue: 'Price',
        }),
        cell: ({ row }) => formatCurrency(row.original.unitPrice),
      },
      {
        accessorKey: 'totalAmount',
        header: t('reports:sales.columns.total', {
          defaultValue: 'Total',
        }),
        cell: ({ row }) => (
          <span className="font-bold text-emerald-500">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: t('reports:sales.columns.customer', {
          defaultValue: 'Customer',
        }),
        cell: ({ row }) =>
          row.original.customerName || (
            <span className="text-muted-foreground">-</span>
          ),
      },
    ],
    [t, formatDate, formatCurrency],
  )

  const data = useMemo(() => {
    const start = (page - 1) * pageSize
    return report.sales.slice(start, start + pageSize)
  }, [report.sales, page, pageSize])

  const total = report.sales.length
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title={t('reports:sales.summary.totalSales', {
            defaultValue: 'Total Sales',
          })}
          value={report.summary.totalSales.toLocaleString()}
          icon={ShoppingBag}
          iconClassName="bg-blue-500/20 text-blue-500"
          valueClassName="text-2xl font-bold text-blue-500"
        />
        <SummaryCard
          title={t('reports:sales.summary.totalRevenue', {
            defaultValue: 'Total Revenue',
          })}
          value={formatCurrency(report.summary.totalRevenue)}
          icon={DollarSign}
          iconClassName="bg-emerald-500/20 text-emerald-500"
          valueClassName="text-2xl font-bold text-emerald-500"
        />
        <SummaryCard
          title={t('reports:sales.summary.byType', {
            defaultValue: 'Sales by Livestock Type',
          })}
          value=""
          icon={Layers}
          iconClassName="bg-amber-500/20 text-amber-500"
          className="sm:col-span-2 lg:col-span-1"
          description={
            <div className="space-y-1 mt-1">
              {report.summary.byType.map((typeInfo) => (
                <div
                  key={typeInfo.type}
                  className="flex justify-between text-xs sm:text-sm"
                >
                  <span className="capitalize text-muted-foreground mr-2">
                    {t(`common:livestock.${typeInfo.type}`, {
                      defaultValue: typeInfo.type,
                    })}
                  </span>
                  <span className="font-bold">
                    {typeInfo.quantity} {t('common:units')}
                  </span>
                </div>
              ))}
            </div>
          }
        />
      </div>

      <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-white/10 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPaginationChange={(p, s) => {
              setPage(p)
              setPageSize(s)
            }}
            onSortChange={() => {}}
            isLoading={false}
            emptyTitle={t('reports:sales.empty.title', {
              defaultValue: 'No sales recorded',
            })}
            emptyDescription={t('reports:sales.empty.description', {
              defaultValue:
                'Sale records will appear here once you make your first sale.',
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
