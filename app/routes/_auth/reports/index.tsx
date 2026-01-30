import { createFileRoute } from '@tanstack/react-router'
import {
  BarChart3,
  Egg,
  FileDown,
  FileSpreadsheet,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import type {
  EggReport,
  FeedReport,
  InventoryReport,
  ProfitLossReport,
  SalesReport,
} from '~/features/reports/server'
import { fetchReportData } from '~/features/reports/server'
import { useReportPage } from '~/features/reports/use-report-page'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import { Button } from '~/components/ui/button'
import { ErrorPage } from '~/components/error-page'
import {
  EggReportView,
  FeedReportView,
  InventoryReportView,
  ProfitLossReportView,
  ReportFilters,
  SalesReportView,
} from '~/components/reports'
import { ReportsSkeleton } from '~/components/reports/reports-skeleton'

function getDefaultStartDate() {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0]
}

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
  pendingComponent: ReportsSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
})

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
  const { selectedFarmId } = useFarm()

  const {
    selectedReport,
    setSelectedReport,
    selectedFarm,
    setSelectedFarm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    useFiscalYear,
    fiscalYearStartMonth,
    handleFiscalYearToggle,
    handleGenerateReport,
    handleExport,
    t,
  } = useReportPage({
    initialReportType: reportType,
    // Initialize from global farm selector, fallback to URL or "all"
    initialFarmId: search.farmId || selectedFarmId || 'all',
    initialStartDate: search.startDate,
    initialEndDate: search.endDate,
  })

  return (
    <div className="min-h-screen bg-background">
      <main className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          icon={BarChart3}
        />

        {/* Info about farm selection */}
        {selectedFarmId && selectedFarm === 'all' && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Reports default to your selected farm (
              {farms.find((f) => f.id === selectedFarmId)?.name}), but you can
              choose "All Farms" below to compare across all your farms.
            </p>
          </div>
        )}

        <ReportFilters
          reportTypes={reportTypes}
          selectedReport={selectedReport}
          setSelectedReport={setSelectedReport}
          farms={farms}
          selectedFarm={selectedFarm}
          setSelectedFarm={setSelectedFarm}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          useFiscalYear={useFiscalYear}
          onFiscalYearToggle={handleFiscalYearToggle}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onGenerate={handleGenerateReport}
        />

        {report && (
          <div className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden border p-6 relative">
            {/* Decorative Orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <h2 className="text-2xl font-black tracking-tight">
                {t(
                  `types.${reportType === 'profit-loss' ? 'profitLoss' : reportType}` as any,
                )}{' '}
                <span className="text-muted-foreground/60">
                  {t('labels.reportSuffix', {
                    defaultValue: 'Report',
                  })}
                </span>
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/70 shadow-sm"
                >
                  <FileDown className="h-4 w-4 mr-2 text-blue-600" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('xlsx')}
                  className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/70 shadow-sm"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                  {t('actions.excel')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/70 shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2 text-red-600" />
                  {t('actions.pdf')}
                </Button>
              </div>
            </div>

            <div className="relative z-10">
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
          </div>
        )}
      </main>
    </div>
  )
}
