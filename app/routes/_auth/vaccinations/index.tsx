import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { PaginatedQuery } from '~/features/vaccinations/types'
import { getHealthDataForFarmFn } from '~/features/vaccinations/server'
import { useFormatDate } from '~/features/settings'
import { useTreatmentMode } from '~/features/vaccinations/use-treatment-mode'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import { HealthAlerts, HealthFormDialog } from '~/components/vaccinations'
import { DeleteHealthDialog } from '~/components/vaccinations/delete-dialog'
import { VaccinationTabs } from '~/components/vaccinations/vaccination-tabs'
import { HealthDataTable } from '~/components/vaccinations/health-data-table'
import { VaccinationsSkeleton } from '~/components/vaccinations/vaccinations-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/vaccinations/')({
  validateSearch: (search: Record<string, unknown>): PaginatedQuery => {
    const validSortBy = [
      'dateAdministered',
      'vaccineName',
      'nextDueDate',
      'createdAt',
      'date',
      'medicationName',
    ] as const
    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 10,
      sortBy:
        typeof search.sortBy === 'string' &&
        (validSortBy as ReadonlyArray<string>).includes(search.sortBy)
          ? search.sortBy
          : 'date',
      sortOrder:
        search.sortOrder === 'asc' || search.sortOrder === 'desc'
          ? search.sortOrder
          : 'desc',
      search: typeof search.search === 'string' ? search.search : '',
      type: search.type ? (search.type as any) : 'all',
    }
  },
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.search,
    type: search.type,
  }),
  loader: async ({ deps }) => {
    return getHealthDataForFarmFn({
      data: {
        farmId: undefined,
        page: deps.page,
        pageSize: deps.pageSize,
        sortBy: deps.sortBy,
        sortOrder: deps.sortOrder,
        search: deps.search,
        type: deps.type,
      },
    })
  },
  pendingComponent: VaccinationsSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: VaccinationsPage,
})

function VaccinationsPage() {
  const router = useRouter()
  const { t } = useTranslation(['vaccinations'])
  const { format: formatDate } = useFormatDate()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Fetch data from loader
  const data = Route.useLoaderData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const {
    dialogType,
    selectedRecord,
    isSubmitting,
    setSelectedRecord,
    handleFormSubmit,
    handleDeleteConfirm,
    openVaccinationDialog,
    openTreatmentDialog,
    openEditDialog,
  } = useTreatmentMode()

  const updateSearch = (updates: Partial<PaginatedQuery>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates }) })
  }

  const handleSuccess = async () => {
    setDialogOpen(false)
    setDeleteOpen(false)
    await router.invalidate()
  }

  // Extract data (loader handles loading/error states)
  const { paginatedRecords, batches, alerts } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Syringe}
        actions={
          <VaccinationTabs
            onVaccinate={() => {
              openVaccinationDialog()
              setDialogOpen(true)
            }}
            onTreat={() => {
              openTreatmentDialog()
              setDialogOpen(true)
            }}
          />
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <HealthAlerts alerts={alerts} formatDate={formatDate} />
      </div>

      <HealthDataTable
        paginatedRecords={paginatedRecords}
        searchParams={searchParams}
        isLoading={false}
        onEdit={(record) => {
          openEditDialog(record)
          setDialogOpen(true)
        }}
        onDelete={(record) => {
          setSelectedRecord(record)
          setDeleteOpen(true)
        }}
        onPaginationChange={(page, pageSize) =>
          updateSearch({ page, pageSize })
        }
        onSortChange={(sortBy, sortOrder) =>
          updateSearch({ sortBy, sortOrder, page: 1 })
        }
        onSearchChange={(search) => updateSearch({ search, page: 1 })}
        onTypeChange={(type) =>
          updateSearch({
            type: type as 'all' | 'vaccination' | 'treatment',
            page: 1,
          })
        }
      />

      <HealthFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(formData) =>
          handleFormSubmit(formData, selectedFarmId || '', handleSuccess)
        }
        batches={batches}
        type={dialogType}
        isSubmitting={isSubmitting}
        initialData={selectedRecord}
      />

      <DeleteHealthDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => handleDeleteConfirm(handleSuccess)}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
