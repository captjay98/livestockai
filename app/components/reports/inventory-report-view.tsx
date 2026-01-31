import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Bird, Fish, Skull } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { InventoryReport } from '~/features/reports/server'
import { Badge } from '~/components/ui/badge'
import { DataTable } from '~/components/ui/data-table'
import { SummaryCard } from '~/components/ui/summary-card'
import { Card, CardContent } from '~/components/ui/card'

export function InventoryReportView({ report }: { report: InventoryReport }) {
  const { t } = useTranslation(['reports', 'common', 'batches'])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'species',
        header: t('reports:inventory.columns.species', {
          defaultValue: 'Species',
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
        accessorKey: 'livestockType',
        header: t('reports:inventory.columns.type', {
          defaultValue: 'Type',
        }),
        cell: ({ row }) => (
          <span className="capitalize text-muted-foreground">
            {t(`common:livestock.${row.original.livestockType}`, {
              defaultValue: row.original.livestockType,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'initialQuantity',
        header: t('reports:inventory.columns.initial', {
          defaultValue: 'Initial',
        }),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.initialQuantity.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'currentQuantity',
        header: t('reports:inventory.columns.current', {
          defaultValue: 'Current',
        }),
        cell: ({ row }) => (
          <span className="font-bold">
            {row.original.currentQuantity.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'mortalityCount',
        header: t('reports:inventory.columns.mortality', {
          defaultValue: 'Losses',
        }),
        cell: ({ row }) => (
          <span
            className={
              row.original.mortalityCount > 0
                ? 'text-destructive font-medium'
                : 'text-muted-foreground'
            }
          >
            {row.original.mortalityCount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'mortalityRate',
        header: t('reports:inventory.columns.rate', {
          defaultValue: 'Rate',
        }),
        cell: ({ row }) => (
          <Badge
            variant={row.original.mortalityRate > 5 ? 'destructive' : 'outline'}
            className="font-mono"
          >
            {row.original.mortalityRate}%
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: t('reports:inventory.columns.status', {
          defaultValue: 'Status',
        }),
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'active' ? 'default' : 'secondary'}
            className={
              row.original.status === 'active'
                ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20'
                : 'bg-white/10'
            }
          >
            {t(`batches:statuses.${row.original.status}`, {
              defaultValue: row.original.status,
            })}
          </Badge>
        ),
      },
    ],
    [t],
  )

  const data = useMemo(() => {
    const start = (page - 1) * pageSize
    return report.batches.slice(start, start + pageSize)
  }, [report.batches, page, pageSize])

  const total = report.batches.length
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title={t('reports:inventory.summary.totalPoultry', {
            defaultValue: 'Total Poultry',
          })}
          value={report.summary.totalPoultry.toLocaleString()}
          icon={Bird}
          iconClassName="bg-blue-500/20 text-blue-500"
          valueClassName="text-2xl font-bold text-blue-500"
        />
        <SummaryCard
          title={t('reports:inventory.summary.totalFish', {
            defaultValue: 'Total Fish',
          })}
          value={report.summary.totalFish.toLocaleString()}
          icon={Fish}
          iconClassName="bg-cyan-500/20 text-cyan-500"
          valueClassName="text-2xl font-bold text-cyan-500"
        />
        <SummaryCard
          title={t('reports:inventory.summary.totalMortality', {
            defaultValue: 'Total Losses',
          })}
          value={report.summary.totalMortality.toLocaleString()}
          icon={Skull}
          iconClassName="bg-destructive/10 text-destructive"
          valueClassName="text-2xl font-bold text-destructive"
        />
        <SummaryCard
          title={t('reports:inventory.summary.mortalityRate', {
            defaultValue: 'Overall Loss Rate',
          })}
          value={`${report.summary.overallMortalityRate}%`}
          icon={AlertCircle}
          iconClassName={
            report.summary.overallMortalityRate > 5
              ? 'bg-destructive/10 text-destructive'
              : 'bg-emerald-500/20 text-emerald-500'
          }
          valueClassName={
            report.summary.overallMortalityRate > 5
              ? 'text-destructive'
              : 'text-emerald-500'
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
            emptyTitle={t('reports:inventory.empty.title', {
              defaultValue: 'No batch data',
            })}
            emptyDescription={t('reports:inventory.empty.description', {
              defaultValue: 'Start a batch to see inventory reports.',
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
