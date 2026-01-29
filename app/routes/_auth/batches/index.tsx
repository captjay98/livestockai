import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Package, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Batch } from '~/components/batches/batch-columns'
import { validateBatchSearch } from '~/features/batches/validation'
import {
  deleteBatchFn,
  getBatchesForFarmFn,
  updateBatchFn,
} from '~/features/batches/server'
import { useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import { BatchDialog } from '~/components/dialogs/batch-dialog'
import { BatchSummaryCards } from '~/components/batches/batch-summary-cards'
import { BatchEditDialog } from '~/components/batches/batch-edit-dialog'
import { BatchDeleteDialog } from '~/components/batches/batch-delete-dialog'
import { getBatchColumns } from '~/components/batches/batch-columns'
import { BatchFilters } from '~/components/batches/batch-filters'
import { BatchesSkeleton } from '~/components/batches/batches-skeleton'

export const Route = createFileRoute('/_auth/batches/')({
  validateSearch: validateBatchSearch,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.q,
    status: search.status,
    livestockType: search.livestockType,
    breedId: search.breedId,
  }),
  loader: async ({ deps }) => {
    return getBatchesForFarmFn({ data: deps })
  },
  pendingComponent: BatchesSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading batches: {error.message}
    </div>
  ),
  component: BatchesPage,
})

function BatchesPage() {
  const router = useRouter()
  const { t } = useTranslation(['batches', 'common'])
  const { format: formatDate } = useFormatDate()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Get data from loader
  const { paginatedBatches, summary } = Route.useLoaderData()

  // Dialog states
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Navigation helper for search params
  const updateSearch = (updates: Partial<typeof searchParams>) => {
    navigate({
      search: { ...searchParams, ...updates },
    })
  }

  const handleBreedChange = (breedId: string | undefined) => {
    updateSearch({ breedId, page: 1 })
  }

  // Edit batch handler
  const handleEditSubmit = async (data: any) => {
    if (!selectedBatch) return

    setIsSubmitting(true)
    try {
      await updateBatchFn({ data: { id: selectedBatch.id, ...data } })
      toast.success(
        t('edit.success', {
          defaultValue: 'Batch updated successfully',
        }),
      )
      setEditDialogOpen(false)
      setSelectedBatch(null)
      // Invalidate and refetch
      await router.invalidate()
    } catch (error) {
      toast.error(t('edit.error', { defaultValue: 'Failed to update batch' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete batch handler
  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return

    setIsSubmitting(true)
    try {
      await deleteBatchFn({ data: { batchId: selectedBatch.id } })
      toast.success(
        t('delete.success', {
          defaultValue: 'Batch deleted successfully',
        }),
      )
      setDeleteDialogOpen(false)
      setSelectedBatch(null)
      // Invalidate and refetch
      await router.invalidate()
    } catch (error) {
      toast.error(t('delete.error', { defaultValue: 'Failed to delete batch' }))
    } finally {
      setIsSubmitting(false)
    }
  }

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
        searchPlaceholder={t('common:search', {
          defaultValue: 'Search...',
        })}
        filters={
          <BatchFilters
            livestockType={searchParams.livestockType}
            breedId={searchParams.breedId}
            onStatusChange={(status) => updateSearch({ status, page: 1 })}
            onLivestockTypeChange={(livestockType) =>
              updateSearch({
                livestockType,
                breedId: undefined,
                page: 1,
              })
            }
            onBreedChange={handleBreedChange}
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
