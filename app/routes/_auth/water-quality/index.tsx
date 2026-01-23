import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Droplets, Plus } from 'lucide-react'
import { useState } from 'react'
import { validateWaterQualitySearch } from '~/features/water-quality/validation'
import { useWaterQualityPage } from '~/features/water-quality/use-water-quality-page'
import { useWaterQualityColumns } from '~/components/water-quality/water-quality-columns'
import { useFormatTemperature } from '~/features/settings'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import {
  WaterQualityFormDialog,
} from '~/components/water-quality'
import { WaterQualityFilters } from '~/components/water-quality/water-quality-filters'

export const Route = createFileRoute('/_auth/water-quality/')({
  component: WaterQualityPage,
  validateSearch: validateWaterQualitySearch,
})

function WaterQualityPage() {
  const { t } = useTranslation(['waterQuality', 'common'])
  const { selectedFarmId } = useFarm()
  const { label: tempLabel } = useFormatTemperature()
  const searchParams = Route.useSearch()

  const {
    paginatedRecords,
    batches,
    selectedRecord,
    setSelectedRecord,
    isLoading,
    isSubmitting,
    updateSearch,
    handleAddSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useWaterQualityPage({
    selectedFarmId,
    searchParams,
    routePath: Route.fullPath,
  })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const columns = useWaterQualityColumns({
    onEdit: (record) => {
      setSelectedRecord(record)
      setEditDialogOpen(true)
    },
    onDelete: (record) => {
      setSelectedRecord(record)
      setDeleteDialogOpen(true)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('waterQuality:title', { defaultValue: 'Water Quality' })}
        description={t('waterQuality:description', {
          defaultValue:
            'Monitor pond conditions (pH, temperature, oxygen) to ensure optimal fish health.',
        })}
        icon={Droplets}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('waterQuality:addRecord', { defaultValue: 'Add Record' })}
          </Button>
        }
      />


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
        searchPlaceholder={t('common:search', { defaultValue: 'Search...' })}
        isLoading={isLoading}
        filters={<WaterQualityFilters />}
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(q) => {
          updateSearch({ q, page: 1 })
        }}
        emptyIcon={<Droplets className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('waterQuality:emptyTitle', {
          defaultValue: 'No water quality records',
        })}
        emptyDescription={t('waterQuality:emptyDescription', {
          defaultValue: 'Monitor your water parameters regularly.',
        })}
      />

      <WaterQualityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (data) => {
          await handleAddSubmit(data)
          setDialogOpen(false)
        }}
        batches={batches}
        isSubmitting={isSubmitting}
        title={t('waterQuality:addRecordTitle', {
          defaultValue: 'Record Water Quality',
        })}
        tempLabel={tempLabel}
      />

      <WaterQualityFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={async (data) => {
          await handleEditSubmit(data)
          setEditDialogOpen(false)
        }}
        batches={batches}
        isSubmitting={isSubmitting}
        initialData={selectedRecord}
        title={t('waterQuality:editRecordTitle', {
          defaultValue: 'Edit Water Quality Record',
        })}
        tempLabel={tempLabel}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('waterQuality:deleteRecordTitle', {
                defaultValue: 'Delete Water Quality Record',
              })}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('waterQuality:deleteConfirmation', {
              defaultValue:
                'Are you sure you want to delete this water quality record?',
            })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await handleDeleteConfirm()
                setDeleteDialogOpen(false)
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common:deleting', { defaultValue: 'Deleting...' })
                : t('common:delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
