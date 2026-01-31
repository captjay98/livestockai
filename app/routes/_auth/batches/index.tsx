import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Package, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import type { Batch } from '~/components/batches/batch-columns'
import { validateBatchSearch } from '~/features/batches/validation'
import { getBatchesForFarmFn } from '~/features/batches/server'
import { useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import { BatchDialog } from '~/components/batches/batch-dialog'
import { BatchSummaryCards } from '~/components/batches/batch-summary-cards'
import { BatchEditDialog } from '~/components/batches/batch-edit-dialog'
import { BatchDeleteDialog } from '~/components/batches/batch-delete-dialog'
import { getBatchColumns } from '~/components/batches/batch-columns'
import { BatchFilters } from '~/components/batches/batch-filters'
import { BatchesSkeleton } from '~/components/batches/batches-skeleton'
import { useBatchMutations } from '~/features/batches/mutations'
import { ErrorPage } from '~/components/error-page'

type BatchSearchParams = z.infer<typeof validateBatchSearch>

export const Route = createFileRoute('/_auth/batches/')({
  validateSearch: validateBatchSearch,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId as string | undefined,
    page: search.page as number | undefined,
    pageSize: search.pageSize as number | undefined,
    sortBy: search.sortBy as string | undefined,
    sortOrder: search.sortOrder as 'asc' | 'desc' | undefined,
    search: search.q as string | undefined,
    status: search.status as string | undefined,
    livestockType: search.livestockType as string | undefined,
    breedId: search.breedId as string | undefined,
  }),
  loader: async ({ deps }) => {
    return getBatchesForFarmFn({ data: deps })
  },
  pendingComponent: BatchesSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: BatchesPage,
})

function BatchesPage() {
  const { t } = useTranslation(['batches', 'common'])
  const { format: formatDate } = useFormatDate()
  const searchParams: BatchSearchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Fetch data from loader
  const data = Route.useLoaderData()

  // Dialog states
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)

  const { updateBatch, deleteBatch } = useBatchMutations()
  const isSubmitting = updateBatch.isPending || deleteBatch.isPending

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
  const handleEditSubmit = async (formData: {
    currentQuantity: string
    status: 'active' | 'depleted' | 'sold'
    breedId: string | null
  }) => {
    if (!selectedBatch) return

    await updateBatch.mutateAsync({
      batchId: selectedBatch.id,
      batch: formData,
    })
    setEditDialogOpen(false)
    setSelectedBatch(null)
  }

  // Delete batch handler
  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return

    await deleteBatch.mutateAsync({ batchId: selectedBatch.id })
    setDeleteDialogOpen(false)
    setSelectedBatch(null)
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

  // Extract data (loader handles loading/error states)
  const { paginatedBatches, summary } = data

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
        sortBy={searchParams.sortBy as string | undefined}
        sortOrder={searchParams.sortOrder as 'asc' | 'desc' | undefined}
        searchValue={searchParams.q as string | undefined}
        searchPlaceholder={t('common:search', {
          defaultValue: 'Search...',
        })}
        containerClassName="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        filters={
          <BatchFilters
            livestockType={searchParams.livestockType as string | undefined}
            breedId={searchParams.breedId as string | undefined}
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
        emptyIcon={
          <div className="p-4 rounded-full bg-white/40 dark:bg-white/10 w-fit mx-auto mb-6 shadow-inner border border-white/20">
            <Users className="h-10 w-10 text-primary/40" />
          </div>
        }
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
