import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useTranslation } from 'react-i18next'
import type { ExportOptions } from '~/lib/export/server'
import { generateExportData } from '~/lib/export/server'
import { ReportsSkeleton } from '~/components/reports/reports-skeleton'
import { ErrorPage } from '~/components/error-page'

const exportReport = createServerFn({ method: 'GET' })
  .inputValidator((data: ExportOptions) => data)
  .handler(async ({ data }) => {
    return generateExportData(data)
  })

export const Route = createFileRoute('/_auth/reports/export')({
  component: ExportPage,
  validateSearch: (search: Record<string, unknown>): ExportOptions => ({
    reportType: typeof search.type === 'string' ? search.type : 'profit-loss',
    format:
      search.format === 'csv' ||
      search.format === 'xlsx' ||
      search.format === 'pdf'
        ? search.format
        : 'csv',
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
    startDate:
      typeof search.startDate === 'string'
        ? search.startDate
        : getDefaultStartDate(),
    endDate:
      typeof search.endDate === 'string' ? search.endDate : getDefaultEndDate(),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    return exportReport({ data: deps.search })
  },
  pendingComponent: ReportsSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
})

function getDefaultStartDate() {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0]
}

function ExportPage() {
  const data = Route.useLoaderData()
  const { t } = useTranslation()

  // Trigger download
  if (typeof window !== 'undefined') {
    const blob = new Blob([data.content], { type: data.mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = data.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Redirect back to reports
    window.location.href = '/reports'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">{t('reports.export.generating')}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {t('reports.export.autoDownload')}
        </p>
      </div>
    </div>
  )
}
