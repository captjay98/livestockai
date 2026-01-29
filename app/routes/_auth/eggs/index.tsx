import { createFileRoute } from '@tanstack/react-router'
import { Bird, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { validateEggSearch } from '~/features/eggs/validation'
import { getEggDataForFarm } from '~/features/eggs/server'
import { useEggPage } from '~/features/eggs/use-egg-page'
import { useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { DataTable } from '~/components/ui/data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import {
  EggDeleteDialog,
  EggFormDialog,
  EggSummaryCards,
  useEggColumns,
} from '~/components/eggs'
import { EggFilters } from '~/components/eggs/egg-filters'
import { EggsSkeleton } from '~/components/eggs/eggs-skeleton'

export const Route = createFileRoute('/_auth/eggs/')({
  validateSearch: validateEggSearch,
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.search,
  }),
  loader: async ({ deps }) => {
    return getEggDataForFarm({ data: deps })
  },
  pendingComponent: EggsSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading egg records: {error.message}
    </div>
  ),
  component: EggsPage,
})

function EggsPage() {
  const { t } = useTranslation(['eggs', 'common', 'batches'])
  const { format: formatDate } = useFormatDate()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()

  // Get data from loader
  const { paginatedRecords, batches, summary } = Route.useLoaderData()

  const {
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleAddSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useEggPage({
    selectedFarmId,
    routePath: Route.fullPath,
  })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleEdit = (record: any) => {
    setSelectedRecord(record)
    setEditDialogOpen(true)
  }

  const handleDelete = (record: any) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const columns = useEggColumns({
    t,
    formatDate,
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  const handleAddSuccess = async (data: any) => {
    const success = await handleAddSubmit(data)
    if (success) setDialogOpen(false)
  }

  const handleEditSuccess = async (data: any) => {
    const success = await handleEditSubmit(data)
    if (success) setEditDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', { defaultValue: 'Egg Production' })}
        description={t('subtitle', {
          defaultValue: 'Manage and track daily egg collection and sales',
        })}
        icon={Bird}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('record', { defaultValue: 'Record Production' })}
          </Button>
        }
      />

      <EggSummaryCards summary={summary} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {t('history', {
                  defaultValue: 'Production History',
                })}
              </CardTitle>
              <CardDescription>
                {t('history_desc', {
                  defaultValue: 'View and manage existing egg records',
                })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <EggFilters batches={batches} onBatchChange={() => {}} />
              <Input
                value={searchParams.search}
                onChange={(e) =>
                  updateSearch({
                    search: e.target.value,
                    page: 1,
                  })
                }
                placeholder={t('common:search', {
                  defaultValue: 'Search...',
                })}
                className="max-w-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paginatedRecords.data}
            total={paginatedRecords.total}
            page={paginatedRecords.page}
            pageSize={paginatedRecords.pageSize}
            totalPages={paginatedRecords.totalPages}
            sortBy={searchParams.sortBy}
            sortOrder={searchParams.sortOrder}
            onPaginationChange={(page, pageSize) =>
              updateSearch({ page, pageSize })
            }
            onSortChange={(sortBy, sortOrder) =>
              updateSearch({ sortBy, sortOrder, page: 1 })
            }
            emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
            emptyTitle={t('empty.title', {
              defaultValue: 'No records found',
            })}
            emptyDescription={t('empty.description', {
              defaultValue:
                'Get started by recording your first egg collection.',
            })}
          />
        </CardContent>
      </Card>

      <EggFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddSuccess}
        batches={batches}
        isSubmitting={isSubmitting}
      />

      <EggFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSuccess}
        batches={batches}
        isSubmitting={isSubmitting}
        initialData={
          selectedRecord
            ? {
                date: new Date(selectedRecord.date).toISOString().split('T')[0],
                batchId: selectedRecord.batchId,
                quantityCollected: selectedRecord.quantityCollected,
                quantityBroken: selectedRecord.quantityBroken,
                quantitySold: selectedRecord.quantitySold,
              }
            : undefined
        }
        isEdit
      />

      <EggDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        record={selectedRecord}
        onConfirm={async () => {
          await handleDeleteConfirm()
          return true
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
