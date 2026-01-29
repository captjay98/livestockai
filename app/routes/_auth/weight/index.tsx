import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Scale } from 'lucide-react'
import { useMemo, useState } from 'react'

import { validateWeightSearch } from '~/features/weight/validation'
import { useWeightPage } from '~/features/weight/use-weight-page'
import { useFormatDate, useFormatWeight } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import { GrowthAlerts } from '~/components/weight/growth-alerts'
import { WeightFormDialog } from '~/components/weight/weight-form-dialog'
import { WeightDeleteDialog } from '~/components/weight/weight-delete-dialog'
import { WeightFilters } from '~/components/weight/weight-filters'
import { getWeightColumns } from '~/components/weight/weight-columns'
import { WeightSkeleton } from '~/components/weight/weight-skeleton'
import { getWeightDataForFarm } from '~/features/weight/server'

export const Route = createFileRoute('/_auth/weight/')({
  validateSearch: validateWeightSearch,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId || undefined,
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.q,
  }),
  loader: async ({ deps }) => {
    return getWeightDataForFarm({
      data: {
        farmId: deps.farmId,
        page: deps.page,
        pageSize: deps.pageSize,
        sortBy: deps.sortBy,
        sortOrder: deps.sortOrder,
        search: deps.search,
      },
    })
  },
  pendingComponent: WeightSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading weight data: {error.message}
    </div>
  ),
  component: WeightPage,
})

function WeightPage() {
  const { t } = useTranslation(['weight', 'common', 'batches'])
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight } = useFormatWeight()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const { paginatedRecords, batches, alerts } = Route.useLoaderData()

  const {
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleFormSubmit,
    handleDeleteConfirm,
  } = useWeightPage({ selectedFarmId, routePath: Route.fullPath })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const columns = useMemo(
    () =>
      getWeightColumns({
        t,
        formatDate,
        formatWeight,
        onEdit: (record) => {
          setDialogMode('edit')
          setSelectedRecord(record)
          setDialogOpen(true)
        },
        onDelete: (record) => {
          setSelectedRecord(record)
          setDeleteDialogOpen(true)
        },
      }),
    [t, formatDate, formatWeight],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('weight:title', { defaultValue: 'Weight Samples' })}
        description={t('weight:description', {
          defaultValue:
            'Track growth by recording periodic weight samples. Compare against industry standards.',
        })}
        icon={Scale}
        actions={
          <Button
            onClick={() => {
              setDialogMode('create')
              setSelectedRecord(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('weight:addSample', { defaultValue: 'Add Sample' })}
          </Button>
        }
      />

      <GrowthAlerts alerts={alerts} />

      <DataTable
        columns={columns}
        data={paginatedRecords.data}
        total={paginatedRecords.total}
        page={paginatedRecords.page}
        pageSize={paginatedRecords.pageSize}
        totalPages={paginatedRecords.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder={t('batches:searchPlaceholder', {
          defaultValue: 'Search batches...',
        })}
        isLoading={false}
        filters={
          <WeightFilters
            batchId={searchParams.batchId}
            onBatchChange={(batchId) => updateSearch({ batchId, page: 1 })}
            batches={batches}
          />
        }
        onPaginationChange={(page, pageSize) =>
          updateSearch({ page, pageSize })
        }
        onSortChange={(sortBy, sortOrder) =>
          updateSearch({ sortBy, sortOrder, page: 1 })
        }
        onSearchChange={(q) => updateSearch({ q, page: 1 })}
        emptyIcon={<Scale className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('weight:emptyTitle', {
          defaultValue: 'No weight samples',
        })}
        emptyDescription={t('weight:emptyDescription', {
          defaultValue: 'Track the weight of your livestock regularly.',
        })}
      />

      <WeightFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={
          selectedRecord
            ? {
                batchId: selectedRecord.batchId,
                date: new Date(selectedRecord.date).toISOString().split('T')[0],
                sampleSize: selectedRecord.sampleSize.toString(),
                averageWeightKg: selectedRecord.averageWeightKg,
              }
            : null
        }
        batchSpecies={selectedRecord?.batchSpecies}
        batches={batches}
        onSubmit={(data) => handleFormSubmit(data, dialogMode)}
        isSubmitting={isSubmitting}
      />

      <WeightDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
