import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { InventoryReport } from '~/features/reports/server'
import { Badge } from '~/components/ui/badge'
import { DataTable } from '~/components/ui/data-table'

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
          <span className="capitalize">
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
          <span className="capitalize">
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
        cell: ({ row }) => row.original.initialQuantity.toLocaleString(),
      },
      {
        accessorKey: 'currentQuantity',
        header: t('reports:inventory.columns.current', {
          defaultValue: 'Current',
        }),
        cell: ({ row }) => row.original.currentQuantity.toLocaleString(),
      },
      {
        accessorKey: 'mortalityCount',
        header: t('reports:inventory.columns.mortality', {
          defaultValue: 'Losses',
        }),
        cell: ({ row }) => row.original.mortalityCount.toLocaleString(),
      },
      {
        accessorKey: 'mortalityRate',
        header: t('reports:inventory.columns.rate', {
          defaultValue: 'Rate',
        }),
        cell: ({ row }) => `${row.original.mortalityRate}%`,
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
                ? 'bg-success/15 text-success hover:bg-success/25'
                : ''
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:inventory.summary.totalPoultry', {
              defaultValue: 'Total Poultry',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalPoultry.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:inventory.summary.totalFish', {
              defaultValue: 'Total Fish',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalFish.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:inventory.summary.totalMortality', {
              defaultValue: 'Total Losses',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalMortality.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('reports:inventory.summary.mortalityRate', {
              defaultValue: 'Overall Loss Rate',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.overallMortalityRate}%
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
        emptyTitle={t('reports:inventory.empty.title', {
          defaultValue: 'No batch data',
        })}
        emptyDescription={t('reports:inventory.empty.description', {
          defaultValue: 'Start a batch to see inventory reports.',
        })}
      />
    </div>
  )
}
