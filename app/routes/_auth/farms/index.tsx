import { createFileRoute, redirect } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getFarmsWithStats } from '~/features/farms/farm-stats'
import { useFarmsPage } from '~/features/farms/use-farms-page'
import { Button } from '~/components/ui/button'
import { FarmDialog } from '~/components/dialogs/farm-dialog'
import { PageHeader } from '~/components/page-header'
import { FarmList } from '~/components/farms/farm-list'
import { FarmEmptyState } from '~/components/farms/farm-empty-state'

export const Route = createFileRoute('/_auth/farms/')({
  component: FarmsIndexPage,
  loader: async () => {
    try {
      const farms = await getFarmsWithStats()
      return { farms }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  },
})

function FarmsIndexPage() {
  const { t } = useTranslation(['farms'])
  const loaderData = Route.useLoaderData()
  const farms = loaderData.farms

  const { dialogOpen, setDialogOpen, selectedFarm, handleCreate, handleEdit } =
    useFarmsPage(farms)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('farms:title')}
        description={t('farms:description')}
        icon={Building2}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('farms:add')}
          </Button>
        }
      />

      <FarmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        farm={selectedFarm}
      />

      {farms.length === 0 ? (
        <FarmEmptyState onCreate={handleCreate} />
      ) : (
        <FarmList farms={farms} onEdit={handleEdit} />
      )}
    </div>
  )
}
