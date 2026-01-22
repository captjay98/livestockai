import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Edit,
  Home,
  MapPin,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  StructureStatus,
  StructureType,
} from '~/features/structures/server'
import { getFarmById, getFarmStats } from '~/features/farms/server'
import {
  STRUCTURE_STATUSES,
  STRUCTURE_TYPES,
  createStructureFn,
  deleteStructureFn,
  getStructuresWithCounts,
  updateStructureFn,
} from '~/features/structures/server'
import {
  useFormatArea,
  useFormatCurrency,
  useFormatDate,
} from '~/features/settings'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { SaleDialog } from '~/components/dialogs/sale-dialog'
import { ExpenseDialog } from '~/components/dialogs/expense-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { FarmDialog } from '~/components/dialogs/farm-dialog'

interface Structure {
  id: string
  farmId: string
  name: string
  type: string
  capacity: number | null
  areaSqm: string | null
  status: string
  notes: string | null
  createdAt: Date
  batchCount: number
  totalAnimals: number
}

interface FarmBatch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  acquisitionDate: Date
}

interface FarmSale {
  id: string
  customerName: string | null
  quantity: number
  batchSpecies: string | null
  livestockType: string
  totalAmount: string
  date: Date
}

interface FarmExpense {
  id: string
  category: string
  description: string
  amount: string
  date: Date
}

interface Farm {
  id: string
  name: string
  location: string
  type: string
  createdAt: Date
}

interface FarmStats {
  batches: {
    totalLivestock: number
    active: number
  }
  sales: {
    revenue: number
    count: number
  }
  expenses: {
    total: number
    count: number
  }
}

interface LoaderData {
  farm: Farm | null
  stats: FarmStats
  activeBatches: Array<FarmBatch>
  recentSales: Array<FarmSale>
  recentExpenses: Array<FarmExpense>
  structures: Array<Structure>
}

const getFarmDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('~/features/auth/server-middleware')
      const session = await requireAuth()

      // Dynamically import backend functions to avoid server-code leakage
      const { getBatches } = await import('~/features/batches/server')
      const { getSalesForFarm } = await import('~/features/sales/server')
      const { getExpensesForFarm } = await import('~/features/expenses/server')

      const [
        farm,
        stats,
        activeBatches,
        recentSales,
        recentExpenses,
        structures,
      ] = await Promise.all([
        getFarmById(data.farmId, session.user.id),
        getFarmStats(data.farmId, session.user.id),
        getBatches(session.user.id, data.farmId, { status: 'active' }),
        getSalesForFarm(session.user.id, data.farmId),
        getExpensesForFarm(session.user.id, data.farmId),
        getStructuresWithCounts(session.user.id, data.farmId),
      ])
      return {
        farm,
        stats,
        activeBatches,
        recentSales,
        recentExpenses,
        structures,
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/_auth/farms/$farmId/')({
  component: FarmDetailsPage,
  loader: ({ params }) => getFarmDetails({ data: { farmId: params.farmId } }),
})

function FarmDetailsPage() {
  const { t } = useTranslation(['farms', 'common', 'batches', 'expenses'])
  const loaderData = // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    Route.useLoaderData() as LoaderData
  const { farmId } = Route.useParams()
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const { label: areaLabel } = useFormatArea()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activityTab, setActivityTab] = useState<'sales' | 'expenses'>('sales')
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)

  // Structures state
  const [structures, setStructures] = useState<Array<Structure>>(
    loaderData.structures,
  )
  const [structureDialogOpen, setStructureDialogOpen] = useState(false)
  const [editStructureDialogOpen, setEditStructureDialogOpen] = useState(false)
  const [deleteStructureDialogOpen, setDeleteStructureDialogOpen] =
    useState(false)
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(
    null,
  )
  const [structureForm, setStructureForm] = useState({
    name: '',
    type: 'house' as StructureType,
    capacity: '',
    areaSqm: '',
    status: 'active' as StructureStatus,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { farm, stats, activeBatches, recentSales, recentExpenses } = loaderData

  useEffect(() => {
    setStructures(loaderData.structures)
  }, [loaderData.structures])

  const resetStructureForm = () => {
    setStructureForm({
      name: '',
      type: 'house',
      capacity: '',
      areaSqm: '',
      status: 'active',
      notes: '',
    })
    setError('')
  }

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await createStructureFn({
        data: {
          input: {
            farmId,
            name: structureForm.name,
            type: structureForm.type,
            capacity: structureForm.capacity
              ? parseInt(structureForm.capacity)
              : null,
            areaSqm: structureForm.areaSqm
              ? parseFloat(structureForm.areaSqm)
              : null,
            status: structureForm.status,
            notes: structureForm.notes || null,
          },
        },
      })
      setStructureDialogOpen(false)
      toast.success('Structure created')
      resetStructureForm()
      // Reload structures
      const newStructures = await loadStructuresWithCounts(farmId)
      setStructures(newStructures)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create structure',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStructure) return
    setIsSubmitting(true)
    try {
      await updateStructureFn({
        data: {
          id: selectedStructure.id,
          input: {
            name: structureForm.name,
            type: structureForm.type,
            capacity: structureForm.capacity
              ? parseInt(structureForm.capacity)
              : null,
            areaSqm: structureForm.areaSqm
              ? parseFloat(structureForm.areaSqm)
              : null,
            status: structureForm.status,
            notes: structureForm.notes || null,
          },
        },
      })
      setEditStructureDialogOpen(false)
      const newStructures = await loadStructuresWithCounts(farmId)
      setStructures(newStructures)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update structure',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStructure = async () => {
    if (!selectedStructure) return
    setIsSubmitting(true)
    try {
      await deleteStructureFn({ data: { id: selectedStructure.id } })
      setDeleteStructureDialogOpen(false)
      toast.success('Structure deleted')
      const newStructures = await loadStructuresWithCounts(farmId)
      setStructures(newStructures)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete structure',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditStructure = (structure: Structure) => {
    setSelectedStructure(structure)
    setStructureForm({
      name: structure.name,
      type: structure.type as StructureType,
      capacity: structure.capacity?.toString() || '',
      areaSqm: structure.areaSqm || '',
      status: structure.status as StructureStatus,
      notes: structure.notes || '',
    })
    setEditStructureDialogOpen(true)
  }

  const loadStructuresWithCounts = async (fId: string) => {
    const { getStructuresWithCountsFn } =
      await import('~/features/structures/server')
    return getStructuresWithCountsFn({ data: { farmId: fId } })
  }

  if (!farm) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {t('farms:detail.notFound')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t('farms:detail.notFoundDesc')}
          </p>
          <Link to="/farms">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('farms:detail.back')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/farms">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">{t('farms:detail.back')}</span>
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{farm.name}</h1>
            <Badge
              variant={
                farm.type === 'poultry'
                  ? 'default'
                  : farm.type === 'aquaculture'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {farm.type}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {farm.location}
          </p>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          {t('farms:detail.edit')}
        </Button>
      </div>

      <FarmDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        farm={{
          id: farm.id,
          name: farm.name,
          location: farm.location,
          type: farm.type as 'poultry' | 'aquaculture' | 'mixed',
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Info & Actions (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Batches */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{t('farms:activeBatches.title')}</CardTitle>
              <Link to="/batches">
                <Button variant="link" size="sm" className="h-8">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeBatches.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {t('farms:activeBatches.noBatches')}
                  <div className="mt-2">
                    <Link to="/batches">
                      <Button variant="outline" size="sm">
                        {t('farms:activeBatches.create')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div>
                        <div className="font-medium capitalize">
                          {batch.species}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(batch.acquisitionDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {batch.currentQuantity.toLocaleString()}
                        </div>
                        <Badge variant="outline" className="text-xs uppercase">
                          {t(`common:livestock.${batch.livestockType}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structures */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>{t('farms:structures.title')}</CardTitle>
                <CardDescription>
                  {t('farms:structures.description')}
                </CardDescription>
              </div>
              <Dialog
                open={structureDialogOpen}
                onOpenChange={setStructureDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('farms:structures.add')}
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {t('farms:structures.form.addTitle')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('farms:structures.form.addDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateStructure} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('farms:structures.form.name')}</Label>
                      <Input
                        value={structureForm.name}
                        onChange={(e) =>
                          setStructureForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        placeholder={t(
                          'farms:structures.form.placeholder.name',
                        )}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('farms:structures.form.type')}</Label>
                        <Select
                          value={structureForm.type}
                          onValueChange={(v) =>
                            v &&
                            setStructureForm((p) => ({
                              ...p,
                              type: v as StructureType,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STRUCTURE_TYPES.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {t(`farms:structures.types.${item.value}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('farms:structures.form.status')}</Label>
                        <Select
                          value={structureForm.status}
                          onValueChange={(v) =>
                            v &&
                            setStructureForm((p) => ({
                              ...p,
                              status: v as StructureStatus,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STRUCTURE_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {t(`farms:structures.statuses.${s.value}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('farms:structures.form.capacity')}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={structureForm.capacity}
                          onChange={(e) =>
                            setStructureForm((p) => ({
                              ...p,
                              capacity: e.target.value,
                            }))
                          }
                          placeholder={t(
                            'farms:structures.form.placeholder.capacity',
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t('farms:structures.form.area', { unit: areaLabel })}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={structureForm.areaSqm}
                          onChange={(e) =>
                            setStructureForm((p) => ({
                              ...p,
                              areaSqm: e.target.value,
                            }))
                          }
                          placeholder={t(
                            'farms:structures.form.placeholder.area',
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('farms:structures.form.notes')}</Label>
                      <Input
                        value={structureForm.notes}
                        onChange={(e) =>
                          setStructureForm((p) => ({
                            ...p,
                            notes: e.target.value,
                          }))
                        }
                        placeholder={t(
                          'farms:structures.form.placeholder.notes',
                        )}
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStructureDialogOpen(false)}
                      >
                        {t('farms:structures.form.cancel')}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? t('farms:structures.form.adding')
                          : t('farms:structures.form.add')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {structures.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {t('farms:structures.noStructures')}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {structures.map((structure) => (
                    <div
                      key={structure.id}
                      className="border rounded-lg p-3 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {structure.name}
                          <Badge
                            variant={
                              structure.status === 'active'
                                ? 'default'
                                : structure.status === 'maintenance'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="text-xs"
                          >
                            {t(`farms:structures.statuses.${structure.status}`)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {t(`farms:structures.types.${structure.type}`)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {structure.batchCount > 0
                            ? t('farms:structures.batchCount', {
                                count: structure.batchCount,
                                animals: structure.totalAnimals,
                              })
                            : t('farms:structures.noBatches')}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditStructure(structure)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => {
                            setSelectedStructure(structure)
                            setDeleteStructureDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('farms:recentActivity.title')}</CardTitle>
                <div className="flex bg-muted rounded-md p-1">
                  <button
                    onClick={() => setActivityTab('sales')}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                      activityTab === 'sales'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('farms:recentActivity.sales')}
                  </button>
                  <button
                    onClick={() => setActivityTab('expenses')}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                      activityTab === 'expenses'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('farms:recentActivity.expenses')}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityTab === 'sales' ? (
                recentSales.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    {t('farms:recentActivity.noSales')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                      >
                        <div>
                          <div className="font-medium">
                            {sale.customerName ||
                              t('farms:recentActivity.noCustomer', {
                                defaultValue: 'Unknown Customer',
                              })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {sale.quantity}{' '}
                            {sale.batchSpecies ||
                              t(`common:livestock.${sale.livestockType}`)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">
                            +{formatCurrency(Number(sale.totalAmount))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(sale.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 text-center">
                      <Link to="/sales">
                        <Button variant="ghost" size="sm" className="w-full">
                          {t('farms:recentActivity.viewAllSales')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              ) : recentExpenses.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">
                  {t('farms:recentActivity.noExpenses')}
                </p>
              ) : (
                <div className="space-y-4">
                  {recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div>
                        <div className="font-medium capitalize">
                          {t(`expenses:categories.${expense.category}`)}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {expense.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-destructive">
                          -{formatCurrency(Number(expense.amount))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(expense.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <Link to="/expenses">
                      <Button variant="ghost" size="sm" className="w-full">
                        {t('farms:recentActivity.viewAllExpenses')}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t('farms:quickActions.title')}</CardTitle>
              <CardDescription>
                {t('farms:quickActions.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/batches" className="w-full">
                  <Button
                    variant="outline"
                    className="h-auto p-4 w-full glass flex flex-col items-center justify-center gap-2 hover:bg-accent"
                  >
                    <Building2 className="h-6 w-6 text-primary" />
                    <div className="font-medium">
                      {t('farms:quickActions.manageBatches')}
                    </div>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="h-auto p-4 w-full glass text-emerald-600 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50"
                  onClick={() => setSaleDialogOpen(true)}
                >
                  <TrendingUp className="h-6 w-6" />
                  <div className="font-medium">
                    {t('farms:quickActions.recordSale')}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 w-full glass text-destructive flex flex-col items-center justify-center gap-2 hover:bg-red-50"
                  onClick={() => setExpenseDialogOpen(true)}
                >
                  <TrendingDown className="h-6 w-6" />
                  <div className="font-medium">
                    {t('farms:quickActions.recordExpense')}
                  </div>
                </Button>

                <Link
                  to="/reports"
                  search={{
                    reportType: 'profit-loss',
                    farmId: farmId,
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                  }}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="h-auto p-4 w-full glass text-blue-600 flex flex-col items-center justify-center gap-2 hover:bg-blue-50"
                  >
                    <Building2 className="h-6 w-6" />
                    <div className="font-medium">
                      {t('farms:quickActions.viewReports')}
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Farm Information */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t('farms:detail.info')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('farms:detail.name')}
                  </p>
                  <p className="text-sm border-b pb-1">{farm.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('farms:detail.type')}
                  </p>
                  <p className="text-sm capitalize border-b pb-1">
                    {farm.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('farms:detail.location')}
                  </p>
                  <p className="text-sm border-b pb-1">{farm.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('farms:detail.created')}
                  </p>
                  <p className="text-sm border-b pb-1">
                    {formatDate(farm.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('farms:dashboard.livestock')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.batches.totalLivestock.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('farms:dashboard.activeBatches', {
                  count: stats.batches.active,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('farms:dashboard.revenue')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.sales.revenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('farms:dashboard.salesTransactions', {
                  count: stats.sales.count,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('farms:dashboard.expenses')}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.expenses.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('farms:dashboard.expenseRecords', {
                  count: stats.expenses.count,
                })}
              </p>
            </CardContent>
          </Card>

          <div className="p-4 rounded-lg bg-muted/50 border border-muted text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground mb-1">
              {t('farms:quickActions.tip.title')}
            </h4>
            <p>{t('farms:quickActions.tip.text')}</p>
          </div>
        </div>
      </div>

      {/* Edit Structure Dialog */}
      <Dialog
        open={editStructureDialogOpen}
        onOpenChange={setEditStructureDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('farms:structures.form.editTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStructure} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('farms:structures.form.name')}</Label>
              <Input
                value={structureForm.name}
                onChange={(e) =>
                  setStructureForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('farms:structures.form.type')}</Label>
                <Select
                  value={structureForm.type}
                  onValueChange={(v) =>
                    v &&
                    setStructureForm((p) => ({
                      ...p,
                      type: v as StructureType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRUCTURE_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t(`farms:structures.types.${item.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('farms:structures.form.status')}</Label>
                <Select
                  value={structureForm.status}
                  onValueChange={(v) =>
                    v &&
                    setStructureForm((p) => ({
                      ...p,
                      status: v as StructureStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRUCTURE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {t(`farms:structures.statuses.${s.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('farms:structures.form.capacity')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={structureForm.capacity}
                  onChange={(e) =>
                    setStructureForm((p) => ({
                      ...p,
                      capacity: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('farms:structures.form.area', { unit: areaLabel })}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={structureForm.areaSqm}
                  onChange={(e) =>
                    setStructureForm((p) => ({ ...p, areaSqm: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('farms:structures.form.notes')}</Label>
              <Input
                value={structureForm.notes}
                onChange={(e) =>
                  setStructureForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStructureDialogOpen(false)}
              >
                {t('farms:structures.form.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('farms:structures.form.saving')
                  : t('farms:structures.form.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Structure Dialog */}
      <Dialog
        open={deleteStructureDialogOpen}
        onOpenChange={setDeleteStructureDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('farms:structures.form.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('farms:structures.form.deleteDesc', {
                name: selectedStructure?.name,
              })}
              {selectedStructure && selectedStructure.batchCount > 0 && (
                <span className="block mt-2 text-destructive">
                  {t('farms:structures.form.deleteWarning', {
                    count: selectedStructure.batchCount,
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteStructureDialogOpen(false)}
            >
              {t('farms:structures.form.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStructure}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('farms:structures.form.deleting')
                : t('farms:structures.form.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaleDialog
        farmId={farmId}
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
      />

      <ExpenseDialog
        farmId={farmId}
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
      />
    </div>
  )
}
