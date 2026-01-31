import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, CircleOff, Egg, Layers } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { EggReport } from '~/features/reports/server'
import { DataTable } from '~/components/ui/data-table'
import { useFormatDate } from '~/features/settings'
import { SummaryCard } from '~/components/ui/summary-card'
import { Card, CardContent } from '~/components/ui/card'

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
        cell: ({ row }) => (
          <span className="font-medium">{formatDate(row.original.date)}</span>
        ),
      },
      {
        accessorKey: 'species',
        header: t('reports:eggs.columns.species', {
          defaultValue: 'Flock',
        }),
        cell: ({ row }) => (
          <span className="capitalize text-muted-foreground">
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
        cell: ({ row }) => (
          <span className="font-bold">
            {row.original.quantity.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'cracked',
        header: t('reports:eggs.columns.cracked', {
          defaultValue: 'Cracked',
        }),
        cell: ({ row }) => (
          <span
            className={
              row.original.cracked > 0
                ? 'text-destructive font-medium'
                : 'text-muted-foreground'
            }
          >
            {row.original.cracked.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'usable',
        header: t('reports:eggs.columns.usable', {
          defaultValue: 'Usable',
        }),
        cell: ({ row }) => (
          <span className="text-emerald-500 font-medium">
            {row.original.usable.toLocaleString()}
          </span>
        ),
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
    <div className="space-y-8">
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title={t('reports:eggs.summary.totalEggs', {
            defaultValue: 'Total Eggs',
          })}
          value={report.summary.totalCollected.toLocaleString()}
          icon={Egg}
          iconClassName="bg-amber-500/20 text-amber-500"
          valueClassName="text-2xl font-bold text-amber-500"
        />
        <SummaryCard
          title={t('reports:eggs.summary.totalUsable', {
            defaultValue: 'Total Usable',
          })}
          value={(
            report.summary.totalCollected - report.summary.totalBroken
          ).toLocaleString()}
          icon={Layers}
          iconClassName="bg-emerald-500/20 text-emerald-500"
          valueClassName="text-2xl font-bold text-emerald-500"
        />
        <SummaryCard
          title={t('reports:eggs.summary.totalCracked', {
            defaultValue: 'Total Cracked',
          })}
          value={report.summary.totalBroken.toLocaleString()}
          icon={CircleOff}
          iconClassName="bg-destructive/10 text-destructive"
          valueClassName="text-2xl font-bold text-destructive"
        />
        <SummaryCard
          title={t('reports:eggs.summary.averageDaily', {
            defaultValue: 'Laying %',
          })}
          value={`${Math.round(report.summary.averageLayingPercentage)}%`}
          icon={Activity}
          iconClassName="bg-blue-500/20 text-blue-500"
          valueClassName="text-2xl font-bold text-blue-500"
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
            emptyTitle={t('reports:eggs.empty.title', {
              defaultValue: 'No production data',
            })}
            emptyDescription={t('reports:eggs.empty.description', {
              defaultValue:
                'Production records will appear here once registered.',
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
