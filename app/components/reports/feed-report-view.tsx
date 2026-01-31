import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, Scale, Wheat } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { FeedReport } from '~/features/reports/server'
import { DataTable } from '~/components/ui/data-table'
import { useFormatCurrency, useFormatWeight } from '~/features/settings'
import { SummaryCard } from '~/components/ui/summary-card'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

export function FeedReportView({ report }: { report: FeedReport }) {
  const { t } = useTranslation(['reports', 'common', 'health'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatWeight, label: weightLabel } = useFormatWeight()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'species',
        header: t('reports:feed.columns.species', {
          defaultValue: 'Batch',
        }),
        cell: ({ row }) => (
          <span className="capitalize font-medium">
            {t(`common:livestock.${row.original.species}`, {
              defaultValue: row.original.species,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'feedType',
        header: t('reports:feed.columns.type', {
          defaultValue: 'Feed Type',
        }),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="capitalize bg-white/5 border-white/10"
          >
            {row.original.feedType?.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'totalQuantityKg',
        header: `${t('reports:feed.columns.quantity', { defaultValue: 'Quantity' })} (${weightLabel})`,
        cell: ({ row }) => (
          <span className="font-mono">
            {formatWeight(row.original.totalQuantityKg)}
          </span>
        ),
      },
      {
        accessorKey: 'totalCost',
        header: t('reports:feed.columns.cost', {
          defaultValue: 'Total Cost',
        }),
        cell: ({ row }) => (
          <span className="font-bold text-emerald-500">
            {formatCurrency(row.original.totalCost)}
          </span>
        ),
      },
    ],
    [t, formatWeight, formatCurrency, weightLabel],
  )

  const data = useMemo(() => {
    const start = (page - 1) * pageSize
    return report.records.slice(start, start + pageSize)
  }, [report.records, page, pageSize])

  const total = report.records.length
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <SummaryCard
          title={t('reports:feed.summary.totalFeed', {
            defaultValue: 'Total Feed Consumed',
          })}
          value={`${report.summary.totalFeedKg.toLocaleString()} ${t('health:details.kg', { defaultValue: 'kg' })}`}
          icon={Wheat}
          iconClassName="bg-amber-500/20 text-amber-500"
          valueClassName="text-2xl font-bold text-amber-500"
        />
        <SummaryCard
          title={t('reports:feed.summary.totalCost', {
            defaultValue: 'Total Feed Cost',
          })}
          value={formatCurrency(report.summary.totalCost)}
          icon={DollarSign}
          iconClassName="bg-destructive/10 text-destructive"
          valueClassName="text-2xl font-bold text-destructive"
        />
        <SummaryCard
          title={t('reports:feed.summary.byType', {
            defaultValue: 'By Feed Type',
          })}
          value=""
          icon={Scale}
          iconClassName="bg-blue-500/20 text-blue-500"
          className="md:col-span-1"
          description={
            <div className="space-y-1 mt-1">
              {report.summary.byFeedType.map((typeInfo) => (
                <div
                  key={typeInfo.type}
                  className="flex justify-between text-xs sm:text-sm"
                >
                  <span className="capitalize text-muted-foreground mr-2">
                    {t(`reports:feed.types.${typeInfo.type}`, {
                      defaultValue: typeInfo.type.replace('_', ' '),
                    })}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatWeight(typeInfo.quantityKg)}
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
            emptyTitle={t('reports:feed.empty.title', {
              defaultValue: 'No consumption data',
            })}
            emptyDescription={t('reports:feed.empty.description', {
              defaultValue:
                'Consumption records will appear here once registered.',
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
