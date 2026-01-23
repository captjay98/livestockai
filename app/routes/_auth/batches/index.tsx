import { createFileRoute } from '@tanstack/react-router'
import { Package, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Batch } from '~/components/batches/batch-columns'
import { validateBatchSearch } from '~/features/batches/validation'
import { useBatchPage } from '~/features/batches/use-batch-page'
import { useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import { BatchDialog } from '~/components/dialogs/batch-dialog'
import { BatchSummaryCards } from '~/components/batches/batch-summary-cards'
import { BatchEditDialog } from '~/components/batches/batch-edit-dialog'
import { BatchDeleteDialog } from '~/components/batches/batch-delete-dialog'
import { getBatchColumns } from '~/components/batches/batch-columns'
import { BatchFilters } from '~/components/batches/batch-filters'

export const Route = createFileRoute('/_auth/batches/')({
  component: BatchesPage,
  validateSearch: validateBatchSearch,
})

function BatchesPage() {
  const { t } = useTranslation(['batches', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatDate } = useFormatDate()
  const searchParams = Route.useSearch()

  const {
    paginatedBatches,
    summary,
    isLoading,
    selectedBatch,
    setSelectedBatch,
    isSubmitting,
    updateSearch,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useBatchPage({
    selectedFarmId,
    searchParams,
    routePath: Route.fullPath,
  })

  // Dialog states
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleEditBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setEditDialogOpen(true)
  }

  const handleDeleteBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setDeleteDialogOpen(true)
  }

  const columns = useMemo(
    () =>
      getBatchColumns({
        t,
        formatDate,
        onEdit: handleEditBatch,
        onDelete: handleDeleteBatch,
      }),
    [t, formatDate],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', { defaultValue: 'Livestock Batches' })}
        description={t('description', {
          defaultValue:
            'Track groups of animals from acquisition to sale. Each batch represents a cohort you manage together.',
        })}
        icon={Package}
        actions={
          <Button onClick={() => setBatchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('create', { defaultValue: 'Add Batch' })}
          </Button>
        }
      />

      <BatchSummaryCards summary={summary} />

      <DataTable
        columns={columns}
        data={paginatedBatches.data}
        total={paginatedBatches.total}
        page={paginatedBatches.page}
        pageSize={paginatedBatches.pageSize}
        totalPages={paginatedBatches.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder={t('common:search', { defaultValue: 'Search...' })}
        isLoading={isLoading}
        filters={
          <BatchFilters
            status={searchParams.status}
            livestockType={searchParams.livestockType}
            onStatusChange={(status) => updateSearch({ status, page: 1 })}
            onLivestockTypeChange={(livestockType) =>
              updateSearch({ livestockType, page: 1 })
            }
          />
        }
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(q) => {
          updateSearch({ q, page: 1 })
        }}
        emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('empty.title', {
          defaultValue: 'No batches found',
        })}
        emptyDescription={t('empty.description', {
          defaultValue: 'Get started by creating your first livestock batch.',
        })}
      />

      <BatchDialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen} />

      <BatchEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        batch={selectedBatch}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />

      <BatchDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        batch={selectedBatch}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
