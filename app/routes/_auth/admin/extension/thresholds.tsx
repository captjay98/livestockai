import { createFileRoute } from '@tanstack/react-router'
import { getSpeciesThresholdsFn } from '~/features/extension/admin-server'
import { ThresholdTable } from '~/components/extension/admin/threshold-table'
import { PageHeader } from '~/components/page-header'

export const Route = createFileRoute('/_auth/admin/extension/thresholds')({
  loader: async () => {
    return getSpeciesThresholdsFn()
  },
  component: ThresholdsPage,
})

function ThresholdsPage() {
  const thresholds = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mortality Thresholds"
        description="Configure species-specific mortality thresholds for health status classification"
      />

      <ThresholdTable thresholds={thresholds} />
    </div>
  )
}
