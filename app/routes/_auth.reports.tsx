import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'
import {
  Egg,
  FileSpreadsheet,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type {
  EggReport,
  FeedReport,
  InventoryReport,
  ProfitLossReport,
  SalesReport,
} from '~/lib/reports/server'
import { getFarms } from '~/lib/farms/server'
import {
  getEggReport,
  getFeedReport,
  getInventoryReport,
  getProfitLossReport,
  getSalesReport,
} from '~/lib/reports/server'
import { formatNaira } from '~/lib/currency'
import { DataTable } from '~/components/ui/data-table'
import { Badge } from '~/components/ui/badge'

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

export const Route = createFileRoute('/_auth/reports')({
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
  const { farms, report, reportType } = Route.useLoaderData()
  const search = Route.useSearch()
  const [selectedReport, setSelectedReport] = useState(reportType)
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')
  const [startDate, setStartDate] = useState(search.startDate)
  const [endDate, setEndDate] = useState(search.endDate)

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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and export business reports
          </p>
        </div>

        {/* Report Selection */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-4">Generate Report</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
            {reportTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${selectedReport === type.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                    }`}
                >
                  <Icon
                    className={`h-5 w-5 mb-2 ${selectedReport === type.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                      }`}
                  />
                  <div className="font-medium text-sm">{type.name}</div>
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Farm</label>
              <select
                value={selectedFarm}
                onChange={(e) => setSelectedFarm(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Farms</option>
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
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {reportTypes.find((r) => r.id === reportType)?.name} Report
              </h2>
              <div className="flex gap-2">
                <Link
                  to={`/reports/export?type=${reportType}&format=xlsx&farmId=${selectedFarm}&startDate=${startDate}&endDate=${endDate}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Link>
                <Link
                  to={`/reports/export?type=${reportType}&format=pdf&farmId=${selectedFarm}&startDate=${startDate}&endDate=${endDate}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Link>
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
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        <div className="p-3 sm:p-4 bg-success/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Revenue
          </div>
          <div className="text-lg sm:text-2xl font-bold text-success">
            {formatNaira(report.revenue.total)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-destructive/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Expenses
          </div>
          <div className="text-lg sm:text-2xl font-bold text-destructive">
            {formatNaira(report.expenses.total)}
          </div>
        </div>
        <div
          className={`p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-1 ${report.profit >= 0 ? 'bg-info/10' : 'bg-warning/10'}`}
        >
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Net Profit
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold ${report.profit >= 0 ? 'text-info' : 'text-warning'}`}
          >
            {formatNaira(report.profit)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {report.profitMargin}% margin
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-medium mb-3">Revenue by Type</h3>
          <div className="space-y-2">
            {report.revenue.byType.map((item) => (
              <div
                key={item.type}
                className="flex justify-between p-2 bg-muted/50 rounded"
              >
                <span className="capitalize">{item.type}</span>
                <span className="font-medium">{formatNaira(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-3">Expenses by Category</h3>
          <div className="space-y-2">
            {report.expenses.byCategory.map((item) => (
              <div
                key={item.category}
                className="flex justify-between p-2 bg-muted/50 rounded"
              >
                <span className="capitalize">{item.category}</span>
                <span className="font-medium">{formatNaira(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InventoryReportView({ report }: { report: InventoryReport }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'species',
        header: 'Species',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.species}</span>
        ),
      },
      {
        accessorKey: 'livestockType',
        header: 'Type',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.livestockType}</span>
        ),
      },
      {
        accessorKey: 'initialQuantity',
        header: 'Initial',
        cell: ({ row }) => row.original.initialQuantity.toLocaleString(),
      },
      {
        accessorKey: 'currentQuantity',
        header: 'Current',
        cell: ({ row }) => row.original.currentQuantity.toLocaleString(),
      },
      {
        accessorKey: 'mortalityCount',
        header: 'Mortality',
        cell: ({ row }) => row.original.mortalityCount.toLocaleString(),
      },
      {
        accessorKey: 'mortalityRate',
        header: 'Rate',
        cell: ({ row }) => `${row.original.mortalityRate}%`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'active' ? 'default' : 'secondary'}
            className={
              row.original.status === 'active'
                ? 'bg-success/15 text-success hover:bg-success/25'
                : ''
            }
          >
            {row.original.status}
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
            Total Poultry
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalPoultry.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Fish
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalFish.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Mortality
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalMortality.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Mortality Rate
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
        onSortChange={() => { }}
        isLoading={false}
        emptyTitle="No inventory data"
        emptyDescription="Inventory data will appear here."
      />
    </div>
  )
}

function SalesReportView({ report }: { report: SalesReport }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      },
      {
        accessorKey: 'livestockType',
        header: 'Type',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.livestockType}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => row.original.quantity,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Price',
        cell: ({ row }) => formatNaira(row.original.unitPrice),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => formatNaira(row.original.totalAmount),
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
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
            Total Sales
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalSales}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-success/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Revenue
          </div>
          <div className="text-lg sm:text-2xl font-bold text-success">
            {formatNaira(report.summary.totalRevenue)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            By Type
          </div>
          <div className="text-xs sm:text-sm">
            {report.summary.byType.map((t) => (
              <div key={t.type} className="flex justify-between">
                <span className="capitalize">{t.type}:</span>
                <span>{t.quantity} units</span>
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
        onSortChange={() => { }}
        isLoading={false}
        emptyTitle="No sales data"
        emptyDescription="Sales records will appear here."
      />
    </div>
  )
}

function FeedReportView({ report }: { report: FeedReport }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'species',
        header: 'Species',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.species}</span>
        ),
      },
      {
        accessorKey: 'feedType',
        header: 'Feed Type',
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.feedType?.replace('_', ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'totalQuantityKg',
        header: 'Quantity (KG)',
        cell: ({ row }) => row.original.totalQuantityKg.toLocaleString(),
      },
      {
        accessorKey: 'totalCost',
        header: 'Cost',
        cell: ({ row }) => formatNaira(row.original.totalCost),
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
            Total Feed
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalFeedKg.toLocaleString()} kg
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Cost
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {formatNaira(report.summary.totalCost)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            By Feed Type
          </div>
          <div className="text-xs sm:text-sm">
            {report.summary.byFeedType.map((t) => (
              <div key={t.type} className="flex justify-between">
                <span className="capitalize">{t.type.replace('_', ' ')}:</span>
                <span>{t.quantityKg.toLocaleString()} kg</span>
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
        onSortChange={() => { }}
        isLoading={false}
        emptyTitle="No feed data"
        emptyDescription="Feed records will appear here."
      />
    </div>
  )
}

function EggReportView({ report }: { report: EggReport }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      },
      {
        accessorKey: 'collected',
        header: 'Collected',
        cell: ({ row }) => row.original.collected.toLocaleString(),
      },
      {
        accessorKey: 'broken',
        header: 'Broken',
        cell: ({ row }) => row.original.broken.toLocaleString(),
      },
      {
        accessorKey: 'sold',
        header: 'Sold',
        cell: ({ row }) => row.original.sold.toLocaleString(),
      },
      {
        accessorKey: 'inventory',
        header: 'Inventory',
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
            Total Collected
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalCollected.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Sold
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalSold.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Broken
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.totalBroken.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Current Inventory
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {report.summary.currentInventory.toLocaleString()}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Laying %
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
        onSortChange={() => { }}
        isLoading={false}
        emptyTitle="No egg production data"
        emptyDescription="Egg records will appear here."
      />
    </div>
  )
}
