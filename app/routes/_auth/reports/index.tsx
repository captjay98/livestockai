import { createFileRoute } from '@tanstack/react-router'
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
import type {
  EggReport,
  FeedReport,
  InventoryReport,
  ProfitLossReport,
  SalesReport,
} from '~/features/reports/server'
import { fetchReportData } from '~/features/reports/server'
import { useReportPage } from '~/features/reports/use-report-page'
import { PageHeader } from '~/components/page-header'
import {
  EggReportView,
  FeedReportView,
  InventoryReportView,
  ProfitLossReportView,
  ReportFilters,
  SalesReportView,
} from '~/components/reports'

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
    initialFarmId: search.farmId,
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
                  onClick={() => handleExport('xlsx')}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t('actions.excel')}
                </button>
                <button
                  onClick={() => handleExport('pdf')}
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
