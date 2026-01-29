import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { SalesReport } from '~/features/reports/server'
import { DataTable } from '~/components/ui/data-table'
import { useFormatCurrency, useFormatDate } from '~/features/settings'

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
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'livestockType',
        header: t('reports:sales.columns.type', {
          defaultValue: 'Type',
        }),
        cell: ({ row }) => (
          <span className="capitalize">
            {t(`common:livestock.${row.original.livestockType}`, {
              defaultValue: row.original.livestockType,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('reports:sales.columns.quantity', {
          defaultValue: 'Quantity',
        }),
        cell: ({ row }) => row.original.quantity,
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
        cell: ({ row }) => formatCurrency(row.original.totalAmount),
      },
      {
        accessorKey: 'customerName',
        header: t('reports:sales.columns.customer', {
          defaultValue: 'Customer',
        }),
        cell: ({ row }) => row.original.customerName || '-',
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:sales.summary.totalSales', {
              defaultValue: 'Total Sales',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalSales}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-success/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:sales.summary.totalRevenue', {
              defaultValue: 'Total Revenue',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-success">
            {formatCurrency(report.summary.totalRevenue)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:sales.summary.byType', {
              defaultValue: 'By Livestock Type',
            })}
          </div>
          <div className="text-xs sm:text-sm">
            {report.summary.byType.map((typeInfo) => (
              <div key={typeInfo.type} className="flex justify-between">
                <span className="capitalize">
                  {t(`common:livestock.${typeInfo.type}`, {
                    defaultValue: typeInfo.type,
                  })}
                  :
                </span>
                <span>
                  {typeInfo.quantity}{' '}
                  {t('common:units', {
                    defaultValue: 'units',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  )
}
