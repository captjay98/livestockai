import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getRegionTreeFn } from '~/features/extension/admin-server'
import { RegionTree } from '~/components/extension/admin/region-tree'
import { PageHeader } from '~/components/page-header'
import { Button } from '~/components/ui/button'
import { CreateRegionDialog } from '~/components/extension/admin/create-region-dialog'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/admin/extension/regions')({
  loader: async () => {
    return getRegionTreeFn()
  },
  pendingComponent: () => <DataTableSkeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: RegionsPage,
})

function RegionsPage() {
  const { t } = useTranslation(['extension', 'common'])
  const tree = Route.useLoaderData()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('extension:regionManagement', {
          defaultValue: 'Region Management',
        })}
        description={t('extension:regionDescription', {
          defaultValue:
            'Manage countries, regions, and districts for extension services',
        })}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('extension:addRegion', { defaultValue: 'Add Region' })}
          </Button>
        }
      />

      <RegionTree tree={tree} />

      <CreateRegionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        countries={tree}
      />
    </div>
  )
}
