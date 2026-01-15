import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  Activity,
  AlertTriangle,
  Calendar,
  Edit,
  Pill,
  Syringe,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/features/vaccinations/server'
import { useFormatDate } from '~/features/settings'
import {
  createTreatmentFn,
  createVaccinationFn,
  deleteTreatmentFn,
  deleteVaccinationFn,
  getHealthRecordsPaginated,
  getVaccinationAlerts,
  updateTreatmentFn,
  updateVaccinationFn,
} from '~/features/vaccinations/server'
import { getBatches } from '~/features/batches/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'

interface HealthRecord {
  id: string
  batchId: string
  type: 'vaccination' | 'treatment'
  name: string
  date: Date
  dosage: string
  notes?: string
  reason?: string
  withdrawalDays?: number
  nextDueDate?: Date
  species: string
  livestockType: string
  farmName?: string
}

interface VaccinationAlert {
  id: string
  batchId: string
  vaccineName: string
  species: string
  livestockType: string
  nextDueDate: Date | null
  farmName: string
}

interface Alert {
  upcoming: Array<VaccinationAlert>
  overdue: Array<VaccinationAlert>
  totalAlerts: number
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

// Search params
interface HealthSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  type?: 'all' | 'vaccination' | 'treatment'
}

const getHealthDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      type?: 'all' | 'vaccination' | 'treatment'
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedRecords, alerts, allBatches] = await Promise.all([
        getHealthRecordsPaginated(session.user.id, {
          farmId,
          page: data.page,
          pageSize: data.pageSize,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          search: data.search,
          type: data.type,
        }),
        getVaccinationAlerts(session.user.id, farmId),
        getBatches(session.user.id, farmId),
      ])

      const batches = allBatches.filter((b) => b.status === 'active')

      return {
        paginatedRecords,
        alerts,
        batches,
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/vaccinations/')({
  component: HealthPage,
  validateSearch: (search: Record<string, unknown>): HealthSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    type: search.type ? (search.type as any) : 'all',
  }),
})

function HealthPage() {
  const { format: formatDate } = useFormatDate()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<HealthRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [alerts, setAlerts] = useState<Alert | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false)
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(
    null,
  )

  // Forms
  const [vaccineForm, setVaccineForm] = useState({
    batchId: '',
    vaccineName: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    dosage: '',
    nextDueDate: '',
    notes: '',
  })

  const [treatmentForm, setTreatmentForm] = useState({
    batchId: '',
    medicationName: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    dosage: '',
    withdrawalDays: '0',
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getHealthDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          type: searchParams.type,
        },
      })
      setPaginatedRecords(
        result.paginatedRecords as PaginatedResult<HealthRecord>,
      )
      setBatches(result.batches)
      setAlerts(result.alerts)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    selectedFarmId,
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.type,
  ])

  const updateSearch = (updates: Partial<HealthSearchParams>) => {
    navigate({
      search: (prev: HealthSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleVaccineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createVaccinationFn({
        data: {
          farmId: selectedFarmId,
          data: {
            batchId: vaccineForm.batchId,
            vaccineName: vaccineForm.vaccineName,
            dateAdministered: new Date(vaccineForm.dateAdministered),
            dosage: vaccineForm.dosage,
            nextDueDate: vaccineForm.nextDueDate
              ? new Date(vaccineForm.nextDueDate)
              : undefined,
            notes: vaccineForm.notes,
          },
        },
      })
      setVaccinationDialogOpen(false)
      toast.success('Vaccination recorded')
      setVaccineForm({
        batchId: '',
        vaccineName: '',
        dateAdministered: new Date().toISOString().split('T')[0],
        dosage: '',
        nextDueDate: '',
        notes: '',
      })
      loadData()
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createTreatmentFn({
        data: {
          farmId: selectedFarmId,
          data: {
            batchId: treatmentForm.batchId,
            medicationName: treatmentForm.medicationName,
            reason: treatmentForm.reason,
            date: new Date(treatmentForm.date),
            dosage: treatmentForm.dosage,
            withdrawalDays: parseInt(treatmentForm.withdrawalDays),
            notes: treatmentForm.notes,
          },
        },
      })
      setTreatmentDialogOpen(false)
      toast.success('Treatment recorded')
      setTreatmentForm({
        batchId: '',
        medicationName: '',
        reason: '',
        date: new Date().toISOString().split('T')[0],
        dosage: '',
        withdrawalDays: '0',
        notes: '',
      })
      loadData()
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<HealthRecord>>>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.type === 'vaccination' ? 'default' : 'secondary'
            }
            className={
              row.original.type === 'treatment'
                ? 'bg-warning/15 text-warning-foreground hover:bg-warning/25'
                : ''
            }
          >
            {row.original.type === 'vaccination' ? (
              <>
                <Syringe className="h-3 w-3 mr-1" /> Prevention
              </>
            ) : (
              <>
                <Pill className="h-3 w-3 mr-1" /> Treatment
              </>
            )}
          </Badge>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: 'species',
        header: 'Batch',
        cell: ({ row }) => (
          <span className="font-medium text-muted-foreground">
            {row.original.species}
          </span>
        ),
      },
      {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => {
          if (row.original.type === 'vaccination' && row.original.nextDueDate) {
            return (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                Next: {formatDate(row.original.nextDueDate)}
              </div>
            )
          }
          if (row.original.type === 'treatment') {
            return (
              <div className="text-xs text-muted-foreground">
                {row.original.reason && <span>for {row.original.reason}</span>}
                {row.original.withdrawalDays
                  ? ` • ${row.original.withdrawalDays}d withdrawal`
                  : ''}
              </div>
            )
          }
          return null
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(row.original)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(row.original)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const handleEdit = (record: HealthRecord) => {
    setSelectedRecord(record)
    if (record.type === 'vaccination') {
      setVaccineForm({
        batchId: record.batchId,
        vaccineName: record.name,
        dateAdministered: new Date(record.date).toISOString().split('T')[0],
        dosage: record.dosage,
        nextDueDate: record.nextDueDate
          ? new Date(record.nextDueDate).toISOString().split('T')[0]
          : '',
        notes: record.notes || '',
      })
    } else {
      setTreatmentForm({
        batchId: record.batchId,
        medicationName: record.name,
        reason: record.reason || '',
        date: new Date(record.date).toISOString().split('T')[0],
        dosage: record.dosage,
        withdrawalDays: (record.withdrawalDays || 0).toString(),
        notes: record.notes || '',
      })
    }
    setEditDialogOpen(true)
  }

  const handleDelete = (record: HealthRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    setIsSubmitting(true)
    try {
      if (selectedRecord.type === 'vaccination') {
        await updateVaccinationFn({
          data: {
            vaccinationId: selectedRecord.id,
            vaccineName: vaccineForm.vaccineName,
            dosage: vaccineForm.dosage,
            nextDueDate: vaccineForm.nextDueDate
              ? new Date(vaccineForm.nextDueDate)
              : undefined,
            notes: vaccineForm.notes || undefined,
          },
        })
      } else {
        await updateTreatmentFn({
          data: {
            treatmentId: selectedRecord.id,
            medicationName: treatmentForm.medicationName,
            reason: treatmentForm.reason,
            dosage: treatmentForm.dosage,
            withdrawalDays: parseInt(treatmentForm.withdrawalDays),
            notes: treatmentForm.notes || undefined,
          },
        })
      }
      setEditDialogOpen(false)
      toast.success('Record updated')
      loadData()
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return

    setIsSubmitting(true)
    try {
      if (selectedRecord.type === 'vaccination') {
        await deleteVaccinationFn({
          data: { vaccinationId: selectedRecord.id },
        })
      } else {
        await deleteTreatmentFn({ data: { treatmentId: selectedRecord.id } })
      }
      setDeleteDialogOpen(false)
      toast.success('Record deleted')
      loadData()
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Records"
        description="Log vaccinations and treatments to maintain health schedules and compliance."
        icon={Syringe}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setVaccinationDialogOpen(true)}>
              <Syringe className="h-4 w-4 mr-2" />
              Vaccinate
            </Button>
            <Button
              variant="outline"
              onClick={() => setTreatmentDialogOpen(true)}
            >
              <Pill className="h-4 w-4 mr-2" />
              Treat
            </Button>
          </div>
        }
      />

      {alerts && (alerts.upcoming.length > 0 || alerts.overdue.length > 0) && (
        <div className="grid gap-4 mb-6 md:grid-cols-2">
          {alerts.overdue.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium text-destructive flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Overdue Vaccinations
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm space-y-2">
                {alerts.overdue.map((a) => (
                  <div key={a.id} className="flex justify-between items-center">
                    <span>
                      {a.vaccineName} ({a.species})
                    </span>
                    <span className="font-medium">
                      {a.nextDueDate ? formatDate(a.nextDueDate) : 'N/A'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {alerts.upcoming.length > 0 && (
            <Card className="border-info/50 bg-info/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium text-info flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Upcoming Vaccinations
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm space-y-2">
                {alerts.upcoming.map((a) => (
                  <div key={a.id} className="flex justify-between items-center">
                    <span>
                      {a.vaccineName} ({a.species})
                    </span>
                    <span className="font-medium">
                      {a.nextDueDate ? formatDate(a.nextDueDate) : 'N/A'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
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
        searchPlaceholder="Search by name, species..."
        isLoading={isLoading}
        filters={
          <div className="flex items-center space-x-2">
            <Tabs
              value={searchParams.type}
              onValueChange={(val) =>
                updateSearch({ type: val as any, page: 1 })
              }
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="vaccination">Vaccinations</TabsTrigger>
                <TabsTrigger value="treatment">Treatments</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
        emptyIcon={<Activity className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No health records"
        emptyDescription="Keep your livestock healthy by tracking vaccinations and treatments."
      />

      {/* Vaccination Dialog */}
      <Dialog
        open={vaccinationDialogOpen}
        onOpenChange={setVaccinationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Vaccination</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVaccineSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select
                value={vaccineForm.batchId}
                onValueChange={(val) =>
                  val && setVaccineForm((prev) => ({ ...prev, batchId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.species} ({b.currentQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vaccine Name</Label>
              <Input
                value={vaccineForm.vaccineName}
                onChange={(e) =>
                  setVaccineForm((prev) => ({
                    ...prev,
                    vaccineName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={vaccineForm.dateAdministered}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      dateAdministered: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  value={vaccineForm.dosage}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      dosage: e.target.value,
                    }))
                  }
                  required
                  placeholder="e.g. 10ml"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Next Due Date (Optional)</Label>
              <Input
                type="date"
                value={vaccineForm.nextDueDate}
                onChange={(e) =>
                  setVaccineForm((prev) => ({
                    ...prev,
                    nextDueDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={vaccineForm.notes}
                onChange={(e) =>
                  setVaccineForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVaccinationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !vaccineForm.batchId}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Treatment Dialog */}
      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Treatment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTreatmentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select
                value={treatmentForm.batchId}
                onValueChange={(val) =>
                  val && setTreatmentForm((prev) => ({ ...prev, batchId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.species} ({b.currentQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Medication Name</Label>
              <Input
                value={treatmentForm.medicationName}
                onChange={(e) =>
                  setTreatmentForm((prev) => ({
                    ...prev,
                    medicationName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={treatmentForm.reason}
                onChange={(e) =>
                  setTreatmentForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                required
                placeholder="e.g. Infection"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={treatmentForm.date}
                  onChange={(e) =>
                    setTreatmentForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  value={treatmentForm.dosage}
                  onChange={(e) =>
                    setTreatmentForm((prev) => ({
                      ...prev,
                      dosage: e.target.value,
                    }))
                  }
                  required
                  placeholder="e.g. 2 tabs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Withdrawal Period (Days)</Label>
              <Input
                type="number"
                min="0"
                value={treatmentForm.withdrawalDays}
                onChange={(e) =>
                  setTreatmentForm((prev) => ({
                    ...prev,
                    withdrawalDays: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={treatmentForm.notes}
                onChange={(e) =>
                  setTreatmentForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTreatmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !treatmentForm.batchId}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit{' '}
              {selectedRecord?.type === 'vaccination'
                ? 'Vaccination'
                : 'Treatment'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Input value={selectedRecord?.species || ''} disabled />
            </div>

            {selectedRecord?.type === 'vaccination' ? (
              <>
                <div className="space-y-2">
                  <Label>Vaccine Name</Label>
                  <Input
                    value={vaccineForm.vaccineName}
                    onChange={(e) =>
                      setVaccineForm((prev) => ({
                        ...prev,
                        vaccineName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input
                    value={vaccineForm.dosage}
                    onChange={(e) =>
                      setVaccineForm((prev) => ({
                        ...prev,
                        dosage: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Due Date</Label>
                  <Input
                    type="date"
                    value={vaccineForm.nextDueDate}
                    onChange={(e) =>
                      setVaccineForm((prev) => ({
                        ...prev,
                        nextDueDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Medication Name</Label>
                  <Input
                    value={treatmentForm.medicationName}
                    onChange={(e) =>
                      setTreatmentForm((prev) => ({
                        ...prev,
                        medicationName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    value={treatmentForm.reason}
                    onChange={(e) =>
                      setTreatmentForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      value={treatmentForm.dosage}
                      onChange={(e) =>
                        setTreatmentForm((prev) => ({
                          ...prev,
                          dosage: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Withdrawal Days</Label>
                    <Input
                      type="number"
                      min="0"
                      value={treatmentForm.withdrawalDays}
                      onChange={(e) =>
                        setTreatmentForm((prev) => ({
                          ...prev,
                          withdrawalDays: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete{' '}
              {selectedRecord?.type === 'vaccination'
                ? 'Vaccination'
                : 'Treatment'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this {selectedRecord?.type} record
            for {selectedRecord?.name}?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
