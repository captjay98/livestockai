import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getSpeciesThresholdsFn } from '~/features/extension/admin-server'
import { ThresholdTable } from '~/components/extension/admin/threshold-table'
import { PageHeader } from '~/components/page-header'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/admin/extension/thresholds')({
  loader: async () => {
    return getSpeciesThresholdsFn()
  },
  pendingComponent: () => <DataTableSkeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: ThresholdsPage,
})

function ThresholdsPage() {
  const { t } = useTranslation(['extension', 'common'])
  const thresholds = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('extension:mortalityThresholds', {
          defaultValue: 'Mortality Thresholds',
        })}
        description={t('extension:thresholdsDescription', {
          defaultValue:
            'Configure species-specific mortality thresholds for health status classification',
        })}
      />

      <ThresholdTable thresholds={thresholds} />
    </div>
  )
}
