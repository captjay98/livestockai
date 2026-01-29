import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { getRegionTreeFn } from '~/features/extension/admin-server'
import { RegionTree } from '~/components/extension/admin/region-tree'
import { PageHeader } from '~/components/page-header'
import { Button } from '~/components/ui/button'
import { CreateRegionDialog } from '~/components/extension/admin/create-region-dialog'

export const Route = createFileRoute('/_auth/admin/extension/regions')({
  loader: async () => {
    return getRegionTreeFn()
  },
  component: RegionsPage,
})

function RegionsPage() {
  const tree = Route.useLoaderData()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Region Management"
        description="Manage countries, regions, and districts for extension services"
      >
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Region
        </Button>
      </PageHeader>

      <RegionTree tree={tree} />

      <CreateRegionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        countries={tree}
      />
    </div>
  )
}
