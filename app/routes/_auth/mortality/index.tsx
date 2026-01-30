import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Skull, TrendingDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { MortalityRecord } from '~/components/mortality/mortality-columns'
import { validateMortalitySearch } from '~/features/mortality/validation'
import { getMortalityDataForFarmFn } from '~/features/mortality/server'
import { useMortalityPage } from '~/features/mortality/use-mortality-page'
import { useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import {
  BatchAlerts,
  MortalityFormDialog,
  MortalitySummary,
} from '~/components/mortality'
import { DeleteMortalityDialog } from '~/components/mortality/delete-dialog'
import { getMortalityColumns } from '~/components/mortality/mortality-columns'
import { MortalityFilters } from '~/components/mortality/mortality-filters'
import { MortalitySkeleton } from '~/components/mortality/mortality-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/mortality/')({
  validateSearch: validateMortalitySearch,
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.q,
    cause: search.cause,
  }),
  loader: async ({ deps }) => {
    return getMortalityDataForFarmFn({ data: deps })
  },
  pendingComponent: MortalitySkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: MortalityPage,
})

function MortalityPage() {
  const { t } = useTranslation(['mortality', 'common'])
  const { format: formatDate } = useFormatDate()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Get data from loader
  const { paginatedRecords, batches, alerts, summary } = Route.useLoaderData()

  // Use mortality page hook for handlers
  const {
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    handleRecordSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useMortalityPage({
    selectedFarmId: undefined, // Mortality route doesn't filter by farm
    routePath: Route.fullPath,
  })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Navigation helper for search params
  const updateSearch = (updates: Partial<typeof searchParams>) => {
    navigate({
      search: { ...searchParams, ...updates },
    })
  }

  const handleEdit = (record: any) => {
    setSelectedRecord(record)
    setEditDialogOpen(true)
  }

  const handleDelete = (record: any) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const columns = useMemo(
    () =>
      getMortalityColumns({
        t,
        formatDate,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [t, formatDate],
  )

  const handleRecordSubmitWrapper = async (data: any) => {
    await handleRecordSubmit(data)
    setDialogOpen(false)
  }

  const handleEditSubmitWrapper = async (data: any) => {
    await handleEditSubmit(data)
    setEditDialogOpen(false)
  }

  const handleDeleteConfirmWrapper = async () => {
    await handleDeleteConfirm()
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('mortality:title')}
        description={t('mortality:description')}
        icon={TrendingDown}
        actions={
          <Button onClick={() => setDialogOpen(true)} variant="destructive">
            <Plus className="h-4 w-4 mr-2" />
            {t('mortality:recordLoss')}
          </Button>
        }
      />

      <MortalitySummary summary={summary} />

      <BatchAlerts alerts={alerts} />

      <DataTable
        columns={columns}
        data={paginatedRecords.data as Array<MortalityRecord>}
        total={paginatedRecords.total}
        page={paginatedRecords.page}
        pageSize={paginatedRecords.pageSize}
        totalPages={paginatedRecords.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder={t('common:searchPlaceholder')}
        filters={
          <MortalityFilters
            cause={searchParams.cause}
            onCauseChange={(cause) => updateSearch({ cause, page: 1 })}
          />
        }
        onPaginationChange={(page, pageSize) =>
          updateSearch({ page, pageSize })
        }
        onSortChange={(sortBy, sortOrder) =>
          updateSearch({ sortBy, sortOrder, page: 1 })
        }
        onSearchChange={(q) => updateSearch({ q, page: 1 })}
        emptyIcon={<Skull className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('mortality:emptyTitle')}
        emptyDescription={t('mortality:emptyDescription')}
      />

      <MortalityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleRecordSubmitWrapper}
        batches={batches}
        isSubmitting={isSubmitting}
        title={t('mortality:recordLossTitle')}
      />

      <MortalityFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmitWrapper}
        batches={batches}
        initialData={selectedRecord}
        isSubmitting={isSubmitting}
        title={t('mortality:editRecord')}
      />

      <DeleteMortalityDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirmWrapper}
        isSubmitting={isSubmitting}
        quantity={selectedRecord?.quantity}
      />
    </div>
  )
}
