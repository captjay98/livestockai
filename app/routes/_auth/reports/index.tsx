import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'
import {
  BarChart3,
  Egg,
  FileSpreadsheet,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  EggReport,
  FeedReport,
  InventoryReport,
  ProfitLossReport,
  SalesReport,
} from '~/features/reports/server'
import type { ColumnDef } from '@tanstack/react-table'
import { getFarms } from '~/features/farms/server'
import {
  getFiscalYearEnd,
  getFiscalYearLabel,
  getFiscalYearStart,
} from '~/features/reports/fiscal-year'
import { PageHeader } from '~/components/page-header'
import { Badge } from '~/components/ui/badge'
import { DataTable } from '~/components/ui/data-table'
import {
  getEggReport,
  getFeedReport,
  getInventoryReport,
  getProfitLossReport,
  getSalesReport,
} from '~/features/reports/server'
import {
  useBusinessSettings,
  useFormatCurrency,
  useFormatDate,
  useFormatWeight,
} from '~/features/settings'

const fetchReportData = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      reportType: string
      farmId?: string
      startDate: string
      endDate: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const farms = await getFarms()
    const dateRange = {
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    }

    let report:
      | ProfitLossReport
      | InventoryReport
      | SalesReport
      | FeedReport
      | EggReport
      | null = null

    switch (data.reportType) {
      case 'profit-loss':
        report = await getProfitLossReport(data.farmId, dateRange)
        break
      case 'inventory':
        report = await getInventoryReport(data.farmId)
        break
      case 'sales':
        report = await getSalesReport(data.farmId, dateRange)
        break
      case 'feed':
        report = await getFeedReport(data.farmId, dateRange)
        break
      case 'eggs':
        report = await getEggReport(data.farmId, dateRange)
        break
    }

    return { farms, report, reportType: data.reportType }
  })

export const Route = createFileRoute('/_auth/reports/')({
  component: ReportsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    reportType:
      typeof search.reportType === 'string' ? search.reportType : 'profit-loss',
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
    startDate:
      typeof search.startDate === 'string'
        ? search.startDate
        : getDefaultStartDate(),
    endDate:
      typeof search.endDate === 'string' ? search.endDate : getDefaultEndDate(),
  }),
  loaderDeps: ({ search }) => ({
    reportType: search.reportType,
    farmId: search.farmId,
    startDate: search.startDate,
    endDate: search.endDate,
  }),
  loader: async ({ deps }) =>
    fetchReportData({
      data: {
        reportType: deps.reportType,
        farmId: deps.farmId,
        startDate: deps.startDate,
        endDate: deps.endDate,
      },
    }),
})

function getDefaultStartDate() {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0]
}

const reportTypes = [
  { id: 'profit-loss', name: 'Profit & Loss', icon: TrendingUp },
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'sales', name: 'Sales', icon: ShoppingCart },
  { id: 'feed', name: 'Feed', icon: Wheat },
  { id: 'eggs', name: 'Egg Production', icon: Egg },
]

function ReportsPage() {
  const { t } = useTranslation(['reports', 'common'])
  const { farms, report, reportType } = Route.useLoaderData()
  const search = Route.useSearch()
  const { fiscalYearStartMonth } = useBusinessSettings()
  const [selectedReport, setSelectedReport] = useState(reportType)
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')
  const [startDate, setStartDate] = useState(search.startDate)
  const [endDate, setEndDate] = useState(search.endDate)
  const [useFiscalYear, setUseFiscalYear] = useState(false)

  // Update dates when fiscal year toggle changes
  const handleFiscalYearToggle = (checked: boolean) => {
    setUseFiscalYear(checked)
    if (checked) {
      const start = getFiscalYearStart(fiscalYearStartMonth)
      const end = getFiscalYearEnd(fiscalYearStartMonth)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  const handleGenerateReport = () => {
    const params = new URLSearchParams({
      reportType: selectedReport,
      startDate,
      endDate,
    })
    if (selectedFarm) params.set('farmId', selectedFarm)
    window.location.href = `/reports?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          icon={BarChart3}
        />

        {/* Report Selection */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-4">{t('generate')}</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
            {reportTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedReport === type.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mb-2 ${
                      selectedReport === type.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div className="font-medium text-sm">
                    {t(
                      `types.${type.id === 'profit-loss' ? 'profitLoss' : type.id}` as any,
                      { defaultValue: type.name },
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('labels.farm')}</label>
              <select
                value={selectedFarm}
                onChange={(e) => setSelectedFarm(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('labels.allFarms')}</option>
                {farms.map((farm: { id: string; name: string }) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedReport !== 'inventory' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useFiscalYear}
                      onChange={(e) => handleFiscalYearToggle(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {t('labels.useFiscalYear')}{' '}
                    {useFiscalYear &&
                      `(${getFiscalYearLabel(fiscalYearStartMonth)})`}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('labels.startDate')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={useFiscalYear}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('labels.endDate')}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={useFiscalYear}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                {t('generate')}
              </button>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {t(
                  `types.${reportType === 'profit-loss' ? 'profitLoss' : reportType}` as any,
                )}{' '}
                {t('labels.reportSuffix', { defaultValue: 'Report' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.location.href = `/reports/export?type=${reportType}&format=xlsx&farmId=${selectedFarm}&startDate=${startDate}&endDate=${endDate}`
                  }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t('actions.excel')}
                </button>
                <button
                  onClick={() => {
                    window.location.href = `/reports/export?type=${reportType}&format=pdf&farmId=${selectedFarm}&startDate=${startDate}&endDate=${endDate}`
                  }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t('actions.pdf')}
                </button>
              </div>
            </div>

            {reportType === 'profit-loss' && (
              <ProfitLossReportView report={report as ProfitLossReport} />
            )}
            {reportType === 'inventory' && (
              <InventoryReportView report={report as InventoryReport} />
            )}
            {reportType === 'sales' && (
              <SalesReportView report={report as SalesReport} />
            )}
            {reportType === 'feed' && (
              <FeedReportView report={report as FeedReport} />
            )}
            {reportType === 'eggs' && (
              <EggReportView report={report as EggReport} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ProfitLossReportView({ report }: { report: ProfitLossReport }) {
  const { format: formatCurrency } = useFormatCurrency()
  const { t } = useTranslation(['reports', 'common'])
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        <div className="p-3 sm:p-4 bg-success/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('profitLoss.totalRevenue')}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-success">
            {formatCurrency(report.revenue.total)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-destructive/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('profitLoss.totalExpenses')}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-destructive">
            {formatCurrency(report.expenses.total)}
          </div>
        </div>
        <div
          className={`p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-1 ${report.profit >= 0 ? 'bg-info/10' : 'bg-warning/10'}`}
        >
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('profitLoss.netProfit')}
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold ${report.profit >= 0 ? 'text-info' : 'text-warning'}`}
          >
            {formatCurrency(report.profit)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {report.profitMargin}% {t('profitLoss.margin')}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-medium mb-3">{t('profitLoss.revenueByType')}</h3>
          <div className="space-y-2">
            {report.revenue.byType.map((item) => (
              <div
                key={item.type}
                className="flex justify-between p-2 bg-muted/50 rounded"
              >
                <span className="capitalize">
                  {t(`common.livestock.${item.type}`, {
                    defaultValue: item.type,
                  })}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-3">
            {t('profitLoss.expensesByCategory')}
          </h3>
          <div className="space-y-2">
            {report.expenses.byCategory.map((item) => (
              <div
                key={item.category}
                className="flex justify-between p-2 bg-muted/50 rounded"
              >
                <span className="capitalize">
                  {t('expenses.categories.' + item.category, {
                    defaultValue: item.category,
                  })}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InventoryReportView({ report }: { report: InventoryReport }) {
  const { t } = useTranslation(['reports', 'common'])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'species',
        header: t('inventory.columns.species'),
        cell: ({ row }) => (
          <span className="capitalize">
            {t(`common.livestock.${row.original.species}`, {
              defaultValue: row.original.species,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'livestockType',
        header: t('inventory.columns.type'),
        cell: ({ row }) => (
          <span className="capitalize">
            {t(`common.livestock.${row.original.livestockType}`, {
              defaultValue: row.original.livestockType,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'initialQuantity',
        header: t('inventory.columns.initial'),
        cell: ({ row }) => row.original.initialQuantity.toLocaleString(),
      },
      {
        accessorKey: 'currentQuantity',
        header: t('inventory.columns.current'),
        cell: ({ row }) => row.original.currentQuantity.toLocaleString(),
      },
      {
        accessorKey: 'mortalityCount',
        header: t('inventory.columns.mortality'),
        cell: ({ row }) => row.original.mortalityCount.toLocaleString(),
      },
      {
        accessorKey: 'mortalityRate',
        header: t('inventory.columns.rate'),
        cell: ({ row }) => `${row.original.mortalityRate}%`,
      },
      {
        accessorKey: 'status',
        header: t('inventory.columns.status'),
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'active' ? 'default' : 'secondary'}
            className={
              row.original.status === 'active'
                ? 'bg-success/15 text-success hover:bg-success/25'
                : ''
            }
          >
            {t(`batches.statuses.${row.original.status}`, {
              defaultValue: row.original.status,
            })}
          </Badge>
        ),
      },
    ],
    [],
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
            {t('inventory.summary.totalPoultry')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalPoultry.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('inventory.summary.totalFish')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalFish.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('inventory.summary.totalMortality')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalMortality.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('inventory.summary.mortalityRate')}
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
        emptyTitle={t('inventory.empty.title')}
        emptyDescription={t('inventory.empty.description')}
      />
    </div>
  )
}

function SalesReportView({ report }: { report: SalesReport }) {
  const { t } = useTranslation(['reports', 'common'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'date',
        header: t('sales.columns.date'),
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'livestockType',
        header: t('sales.columns.type'),
        cell: ({ row }) => (
          <span className="capitalize">
            {t(`common.livestock.${row.original.livestockType}`, {
              defaultValue: row.original.livestockType,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('sales.columns.quantity'),
        cell: ({ row }) => row.original.quantity,
      },
      {
        accessorKey: 'unitPrice',
        header: t('sales.columns.price'),
        cell: ({ row }) => formatCurrency(row.original.unitPrice),
      },
      {
        accessorKey: 'totalAmount',
        header: t('sales.columns.total'),
        cell: ({ row }) => formatCurrency(row.original.totalAmount),
      },
      {
        accessorKey: 'customerName',
        header: t('sales.columns.customer'),
        cell: ({ row }) => row.original.customerName || '-',
      },
    ],
    [],
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
            {t('sales.summary.totalSales')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalSales}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-success/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('sales.summary.totalRevenue')}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-success">
            {formatCurrency(report.summary.totalRevenue)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('sales.summary.byType')}
          </div>
          <div className="text-xs sm:text-sm">
            {report.summary.byType.map((typeInfo) => (
              <div key={typeInfo.type} className="flex justify-between">
                <span className="capitalize">
                  {t(`common.livestock.${typeInfo.type}`, {
                    defaultValue: typeInfo.type,
                  })}
                  :
                </span>
                <span>
                  {typeInfo.quantity}{' '}
                  {t('common.units', { defaultValue: 'units' })}
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
        emptyTitle={t('sales.empty.title')}
        emptyDescription={t('sales.empty.description')}
      />
    </div>
  )
}

function FeedReportView({ report }: { report: FeedReport }) {
  const { t } = useTranslation(['reports', 'common'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatWeight, label: weightLabel } = useFormatWeight()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'species',
        header: t('feed.columns.species'),
        cell: ({ row }) => (
          <span className="capitalize">
            {t(`common.livestock.${row.original.species}`, {
              defaultValue: row.original.species,
            })}
          </span>
        ),
      },
      {
        accessorKey: 'feedType',
        header: t('feed.columns.type'),
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.feedType?.replace('_', ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'totalQuantityKg',
        header: `${t('feed.columns.quantity')} (${weightLabel})`,
        cell: ({ row }) => formatWeight(row.original.totalQuantityKg),
      },
      {
        accessorKey: 'totalCost',
        header: t('feed.columns.cost'),
        cell: ({ row }) => formatCurrency(row.original.totalCost),
      },
    ],
    [],
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
            {t('feed.summary.totalFeed')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalFeedKg.toLocaleString()}{' '}
            {t('health.details.kg', { defaultValue: 'kg' })}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('feed.summary.totalCost')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {formatCurrency(report.summary.totalCost)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('feed.summary.byType')}
          </div>
          <div className="text-xs sm:text-sm">
            {report.summary.byFeedType.map((typeInfo) => (
              <div key={typeInfo.type} className="flex justify-between">
                <span className="capitalize">
                  {t(`feed.types.${typeInfo.type}`, {
                    defaultValue: typeInfo.type.replace('_', ' '),
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
        emptyTitle={t('feed.empty.title')}
        emptyDescription={t('feed.empty.description')}
      />
    </div>
  )
}

function EggReportView({ report }: { report: EggReport }) {
  const { t } = useTranslation()
  const { format: formatDate } = useFormatDate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'date',
        header: t('eggs.columns.date'),
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'collected',
        header: t('eggs.columns.collected'),
        cell: ({ row }) => row.original.collected.toLocaleString(),
      },
      {
        accessorKey: 'broken',
        header: t('eggs.columns.broken'),
        cell: ({ row }) => row.original.broken.toLocaleString(),
      },
      {
        accessorKey: 'sold',
        header: t('eggs.columns.sold'),
        cell: ({ row }) => row.original.sold.toLocaleString(),
      },
      {
        accessorKey: 'inventory',
        header: t('eggs.columns.inventory'),
        cell: ({ row }) => row.original.inventory.toLocaleString(),
      },
    ],
    [],
  )

  const data = useMemo(() => {
    const start = (page - 1) * pageSize
    return report.records.slice(start, start + pageSize)
  }, [report.records, page, pageSize])

  const total = report.records.length
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('eggs.summary.totalCollected')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalCollected.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('eggs.summary.totalSold')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalSold.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('eggs.summary.totalBroken')}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalBroken.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('eggs.summary.currentInventory', {
              defaultValue: 'Current Inventory',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.currentInventory.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('eggs.summary.layingRate', { defaultValue: 'Laying %' })}
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.averageLayingPercentage}%
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
        emptyTitle="No egg production data"
        emptyDescription="Egg records will appear here."
      />
    </div>
  )
}
