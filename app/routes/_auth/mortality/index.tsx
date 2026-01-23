import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Skull, TrendingDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import { validateMortalitySearch } from '~/features/mortality/validation'
import { useMortalityPage } from '~/features/mortality/use-mortality-page'
import { useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import {
  BatchAlerts,
  MortalityFormDialog,
  MortalitySummary,
} from '~/components/mortality'
import { DeleteMortalityDialog } from '~/components/mortality/delete-dialog'
import { getMortalityColumns } from '~/components/mortality/mortality-columns'
import { MortalityFilters } from '~/components/mortality/mortality-filters'

export const Route = createFileRoute('/_auth/mortality/')({
  component: MortalityPage,
  validateSearch: validateMortalitySearch,
})

function MortalityPage() {
  const { t } = useTranslation(['mortality', 'common'])
  const { format: formatDate } = useFormatDate()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()

  const {
    paginatedRecords,
    batches,
    alerts,
    summary,
    isLoading,
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleRecordSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useMortalityPage({
    selectedFarmId,
    searchParams,
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

      {summary && <MortalitySummary summary={summary} />}

      <BatchAlerts alerts={alerts} />

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
        searchPlaceholder={t('common:searchPlaceholder')}
        isLoading={isLoading}
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
