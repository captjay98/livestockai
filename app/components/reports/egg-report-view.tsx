import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { EggReport } from '~/features/reports/server'
import { DataTable } from '~/components/ui/data-table'
import { useFormatDate } from '~/features/settings'

export function EggReportView({ report }: { report: EggReport }) {
  const { t } = useTranslation(['reports', 'common'])
  const { format: formatDate } = useFormatDate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'date',
        header: t('reports:eggs.columns.date', {
          defaultValue: 'Date',
        }),
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'species',
        header: t('reports:eggs.columns.species', {
          defaultValue: 'Flock',
        }),
        cell: ({ row }) => (
          <span className="capitalize">
            {t(`common:livestock.${row.original.species}`, {
              defaultValue: row.original.species,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('reports:eggs.columns.quantity', {
          defaultValue: 'Quantity',
        }),
        cell: ({ row }) => row.original.quantity.toLocaleString(),
      },
      {
        accessorKey: 'cracked',
        header: t('reports:eggs.columns.cracked', {
          defaultValue: 'Cracked',
        }),
        cell: ({ row }) => row.original.cracked.toLocaleString(),
      },
      {
        accessorKey: 'usable',
        header: t('reports:eggs.columns.usable', {
          defaultValue: 'Usable',
        }),
        cell: ({ row }) => row.original.usable.toLocaleString(),
      },
    ],
    [t, formatDate],
  )

  const data = useMemo(() => {
    const start = (page - 1) * pageSize
    return report.records.slice(start, start + pageSize)
  }, [report.records, page, pageSize])

  const total = report.records.length
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:eggs.summary.totalEggs', {
              defaultValue: 'Total Eggs',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalCollected.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:eggs.summary.totalUsable', {
              defaultValue: 'Total Usable',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-success">
            {(
              report.summary.totalCollected - report.summary.totalBroken
            ).toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:eggs.summary.totalCracked', {
              defaultValue: 'Total Cracked',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-destructive">
            {report.summary.totalBroken.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:eggs.summary.averageDaily', {
              defaultValue: 'Laying %',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {Math.round(report.summary.averageLayingPercentage)}%
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
        emptyTitle={t('reports:eggs.empty.title', {
          defaultValue: 'No production data',
        })}
        emptyDescription={t('reports:eggs.empty.description', {
          defaultValue: 'Production records will appear here once registered.',
        })}
      />
    </div>
  )
}
