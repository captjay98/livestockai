import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { FeedReport } from '~/features/reports/server'
import { DataTable } from '~/components/ui/data-table'
import { useFormatCurrency, useFormatWeight } from '~/features/settings'

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
                    <span className="capitalize">
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
                    <span className="capitalize">
                        {row.original.feedType?.replace('_', ' ')}
                    </span>
                ),
            },
            {
                accessorKey: 'totalQuantityKg',
                header: `${t('reports:feed.columns.quantity', { defaultValue: 'Quantity' })} (${weightLabel})`,
                cell: ({ row }) => formatWeight(row.original.totalQuantityKg),
            },
            {
                accessorKey: 'totalCost',
                header: t('reports:feed.columns.cost', {
                    defaultValue: 'Total Cost',
                }),
                cell: ({ row }) => formatCurrency(row.original.totalCost),
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
        <div className="space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
                <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
                        {t('reports:feed.summary.totalFeed', {
                            defaultValue: 'Total Feed Consumed',
                        })}
                    </div>
                    <div className="text-lg sm:text-2xl font-bold">
                        {report.summary.totalFeedKg.toLocaleString()}{' '}
                        {t('health:details.kg', { defaultValue: 'kg' })}
                    </div>
                </div>
                <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
                        {t('reports:feed.summary.totalCost', {
                            defaultValue: 'Total Feed Cost',
                        })}
                    </div>
                    <div className="text-lg sm:text-2xl font-bold">
                        {formatCurrency(report.summary.totalCost)}
                    </div>
                </div>
                <div className="p-3 sm:p-4 bg-muted/50 rounded-lg col-span-2 sm:col-span-1">
                    <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
                        {t('reports:feed.summary.byType', {
                            defaultValue: 'By Feed Type',
                        })}
                    </div>
                    <div className="text-xs sm:text-sm">
                        {report.summary.byFeedType.map((typeInfo) => (
                            <div
                                key={typeInfo.type}
                                className="flex justify-between"
                            >
                                <span className="capitalize">
                                    {t(`reports:feed.types.${typeInfo.type}`, {
                                        defaultValue: typeInfo.type.replace(
                                            '_',
                                            ' ',
                                        ),
                                    })}
                                    :
                                </span>
                                <span>{formatWeight(typeInfo.quantityKg)}</span>
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
                emptyTitle={t('reports:feed.empty.title', {
                    defaultValue: 'No consumption data',
                })}
                emptyDescription={t('reports:feed.empty.description', {
                    defaultValue:
                        'Consumption records will appear here once registered.',
                })}
            />
        </div>
    )
}
