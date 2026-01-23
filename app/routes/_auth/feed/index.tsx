import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Wheat } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FeedRecord } from '~/components/feed/feed-columns'
import { validateFeedSearch } from '~/features/feed/validation'
import { useFeedPage } from '~/features/feed/use-feed-page'
import {
  useFormatCurrency,
  useFormatDate,
  useFormatWeight,
} from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import { FeedFormDialog, FeedSummary } from '~/components/feed'
import { DeleteFeedDialog } from '~/components/feed/delete-dialog'
import { getFeedColumns } from '~/components/feed/feed-columns'
import { FeedFilters } from '~/components/feed/feed-filters'

export const Route = createFileRoute('/_auth/feed/')({
  component: FeedPage,
  validateSearch: validateFeedSearch,
})

function FeedPage() {
  const { t } = useTranslation(['feed', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight } = useFormatWeight()
  const searchParams = Route.useSearch()

  const {
    paginatedRecords,
    batches,
    inventory,
    summary,
    isLoading,
    selectedRecord,
    setSelectedRecord,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useFeedPage({
    selectedFarmId,
    searchParams,
    routePath: Route.fullPath,
  })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleEdit = (record: FeedRecord) => {
    setSelectedRecord(record)
    setEditDialogOpen(true)
  }

  const handleDelete = (record: FeedRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const columns = useMemo(
    () =>
      getFeedColumns({
        t,
        formatDate,
        formatCurrency,
        formatWeight,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [t, formatDate, formatCurrency, formatWeight],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('feed:title')}
        description={t('feed:description')}
        icon={Wheat}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('feed:record')}
          </Button>
        }
      />

      {summary && (
        <FeedSummary summary={summary} inventoryCount={inventory.length} />
      )}

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
        searchPlaceholder={t('feed:placeholders.search')}
        isLoading={isLoading}
        filters={
          <FeedFilters
            feedType={searchParams.feedType}
            onFeedTypeChange={(feedType) => updateSearch({ feedType, page: 1 })}
          />
        }
        onPaginationChange={(page, pageSize) =>
          updateSearch({ page, pageSize })
        }
        onSortChange={(sortBy, sortOrder) =>
          updateSearch({ sortBy, sortOrder, page: 1 })
        }
        onSearchChange={(q) => updateSearch({ q, page: 1 })}
        emptyIcon={<Wheat className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('feed:empty.title')}
        emptyDescription={t('feed:empty.description')}
      />

      <FeedFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (data) => {
          await handleCreateSubmit(data)
          setDialogOpen(false)
        }}
        batches={batches}
        inventory={inventory}
        isSubmitting={isSubmitting}
        title={t('feed:dialog.addTitle')}
        description={t('feed:dialog.addDesc')}
      />

      <FeedFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={async (data) => {
          await handleEditSubmit(data)
          setEditDialogOpen(false)
        }}
        batches={batches}
        inventory={inventory}
        initialData={selectedRecord}
        isSubmitting={isSubmitting}
        title={t('feed:dialog.editTitle')}
      />

      <DeleteFeedDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          await handleDeleteConfirm()
          setDeleteDialogOpen(false)
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
