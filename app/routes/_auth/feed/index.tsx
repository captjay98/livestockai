import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Wheat } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FeedRecord } from '~/components/feed/feed-columns'
import { validateFeedSearch } from '~/features/feed/validation'
import {
  createFeedRecordFn,
  deleteFeedRecordFn,
  getFeedDataForFarm,
  updateFeedRecordFn,
} from '~/features/feed/server'
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
import { FeedSkeleton } from '~/components/feed/feed-skeleton'

export const Route = createFileRoute('/_auth/feed/')({
  validateSearch: validateFeedSearch,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId || undefined,
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.q,
    feedType: search.feedType,
  }),
  loader: async ({ deps }) => {
    return getFeedDataForFarm({ data: deps })
  },
  pendingComponent: FeedSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading feed records: {error.message}
    </div>
  ),
  component: FeedPage,
})

function FeedPage() {
  const router = useRouter()
  const { t } = useTranslation(['feed', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight } = useFormatWeight()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Get data from loader
  const { paginatedRecords, batches, inventory, summary } =
    Route.useLoaderData()

  // Dialog states
  const [selectedRecord, setSelectedRecord] = useState<FeedRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Navigation helper for search params
  const updateSearch = (updates: Partial<typeof searchParams>) => {
    navigate({
      search: { ...searchParams, ...updates },
    })
  }

  const handleEdit = (record: FeedRecord) => {
    setSelectedRecord(record)
    setEditDialogOpen(true)
  }

  const handleDelete = (record: FeedRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const handleCreateSubmit = async (data: any) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          record: {
            ...data,
            quantityKg: parseFloat(data.quantityKg),
            cost: parseFloat(data.cost),
          },
        },
      })
      toast.success(t('feed:messages.recorded'))
      await router.invalidate()
    } catch (err) {
      toast.error(t('common:error.save'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedRecord || !selectedFarmId) return
    setIsSubmitting(true)
    try {
      await updateFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
          data: {
            ...data,
            quantityKg: parseFloat(data.quantityKg),
            cost: parseFloat(data.cost),
            date: new Date(data.date),
          },
        },
      })
      toast.success(t('feed:messages.updated'))
      await router.invalidate()
    } catch (err) {
      toast.error(t('common:error.update'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord || !selectedFarmId) return
    setIsSubmitting(true)
    try {
      await deleteFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
        },
      })
      toast.success(t('feed:messages.deleted'))
      await router.invalidate()
    } catch (err) {
      toast.error(t('common:error.delete'))
    } finally {
      setIsSubmitting(false)
    }
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

      <FeedSummary summary={summary} inventoryCount={inventory.length} />

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
