import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import {
  Egg,
  FileSpreadsheet,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import type {EggReport, FeedReport, InventoryReport, ProfitLossReport, SalesReport} from '~/lib/reports/server';
import { getFarms } from '~/lib/farms/server'
import {
  
  
  
  
  
  getEggReport,
  getFeedReport,
  getInventoryReport,
  getProfitLossReport,
  getSalesReport
} from '~/lib/reports/server'
import { formatNaira } from '~/lib/currency'

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

export const Route = createFileRoute('/reports')({
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
        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Revenue
          </div>
          <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">
            {formatNaira(report.revenue.total)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Expenses
          </div>
          <div className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-400">
            {formatNaira(report.expenses.total)}
          </div>
        </div>
        <div
          className={`p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-1 ${report.profit >= 0 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-orange-50 dark:bg-orange-950/20'}`}
        >
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Net Profit
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold ${report.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 font-medium">Species</th>
              <th className="text-left py-3 font-medium">Type</th>
              <th className="text-right py-3 font-medium">Initial</th>
              <th className="text-right py-3 font-medium">Current</th>
              <th className="text-right py-3 font-medium">Mortality</th>
              <th className="text-right py-3 font-medium">Rate</th>
              <th className="text-left py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.batches.map((batch) => (
              <tr key={batch.id} className="border-b last:border-0">
                <td className="py-3 capitalize">{batch.species}</td>
                <td className="py-3 capitalize">{batch.livestockType}</td>
                <td className="py-3 text-right">
                  {batch.initialQuantity.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  {batch.currentQuantity.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  {batch.mortalityCount.toLocaleString()}
                </td>
                <td className="py-3 text-right">{batch.mortalityRate}%</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      batch.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : batch.status === 'depleted'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {batch.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SalesReportView({ report }: { report: SalesReport }) {
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
        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            Total Revenue
          </div>
          <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 font-medium">Date</th>
              <th className="text-left py-3 font-medium">Type</th>
              <th className="text-right py-3 font-medium">Quantity</th>
              <th className="text-right py-3 font-medium">Unit Price</th>
              <th className="text-right py-3 font-medium">Total</th>
              <th className="text-left py-3 font-medium">Customer</th>
            </tr>
          </thead>
          <tbody>
            {report.sales.slice(0, 20).map((sale) => (
              <tr key={sale.id} className="border-b last:border-0">
                <td className="py-3">
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                <td className="py-3 capitalize">{sale.livestockType}</td>
                <td className="py-3 text-right">{sale.quantity}</td>
                <td className="py-3 text-right">
                  {formatNaira(sale.unitPrice)}
                </td>
                <td className="py-3 text-right font-medium">
                  {formatNaira(sale.totalAmount)}
                </td>
                <td className="py-3">{sale.customerName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FeedReportView({ report }: { report: FeedReport }) {
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 font-medium">Species</th>
              <th className="text-left py-3 font-medium">Feed Type</th>
              <th className="text-right py-3 font-medium">Quantity (kg)</th>
              <th className="text-right py-3 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {report.records.map((record, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3 capitalize">{record.species}</td>
                <td className="py-3 capitalize">
                  {record.feedType.replace('_', ' ')}
                </td>
                <td className="py-3 text-right">
                  {record.totalQuantityKg.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  {formatNaira(record.totalCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EggReportView({ report }: { report: EggReport }) {
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 font-medium">Date</th>
              <th className="text-right py-3 font-medium">Collected</th>
              <th className="text-right py-3 font-medium">Broken</th>
              <th className="text-right py-3 font-medium">Sold</th>
              <th className="text-right py-3 font-medium">Inventory</th>
            </tr>
          </thead>
          <tbody>
            {report.records.slice(0, 30).map((record, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  {record.collected.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  {record.broken.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  {record.sold.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  {record.inventory.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
