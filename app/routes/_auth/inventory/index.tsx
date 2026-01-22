import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Edit,
  Package,
  Pill,
  Plus,
  Trash2,
  Warehouse,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FeedType, MedicationUnit } from '~/features/inventory/service'
import { useFormatDate, useFormatWeight } from '~/features/settings'

import {
  FEED_TYPES,
  createFeedInventoryFn,
  deleteFeedInventoryFn,
  getFeedInventory,
  updateFeedInventoryFn,
} from '~/features/inventory/feed-server'
import {
  MEDICATION_UNITS,
  createMedicationFn,
  deleteMedicationFn,
  getMedicationInventory,
  updateMedicationFn,
} from '~/features/inventory/medication-server'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'

interface FeedInventoryItem {
  id: string
  farmId: string
  feedType: string
  quantityKg: string
  minThresholdKg: string
  updatedAt: Date
  farmName?: string | null
}

interface MedicationItem {
  id: string
  farmId: string
  medicationName: string
  quantity: number
  unit: string
  expiryDate: Date | null
  minThreshold: number
  updatedAt: Date
  farmName?: string | null
}

const getInventoryData = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string | null }) => data)
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('~/features/auth/server-middleware')
      const session = await requireAuth()
      const farmId = data.farmId || undefined
      const [feedInventory, medicationInventory] = await Promise.all([
        getFeedInventory(session.user.id, farmId),
        getMedicationInventory(session.user.id, farmId),
      ])
      return { feedInventory, medicationInventory }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/inventory/')({
  component: InventoryPage,
})

type TabType = 'feed' | 'medication'

function InventoryPage() {
  const { t } = useTranslation(['inventory', 'common'])
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight } = useFormatWeight()
  const { selectedFarmId } = useFarm()
  const [activeTab, setActiveTab] = useState<TabType>('feed')
  const [feedInventory, setFeedInventory] = useState<Array<FeedInventoryItem>>(
    [],
  )
  const [medicationInventory, setMedicationInventory] = useState<
    Array<MedicationItem>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  // Feed dialog states
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  const [editFeedDialogOpen, setEditFeedDialogOpen] = useState(false)
  const [deleteFeedDialogOpen, setDeleteFeedDialogOpen] = useState(false)
  const [selectedFeed, setSelectedFeed] = useState<FeedInventoryItem | null>(
    null,
  )

  // Medication dialog states
  const [medDialogOpen, setMedDialogOpen] = useState(false)
  const [editMedDialogOpen, setEditMedDialogOpen] = useState(false)
  const [deleteMedDialogOpen, setDeleteMedDialogOpen] = useState(false)
  const [selectedMed, setSelectedMed] = useState<MedicationItem | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Feed form state
  const [feedForm, setFeedForm] = useState({
    feedType: 'starter' as FeedType,
    quantityKg: '',
    minThresholdKg: '10',
  })

  // Medication form state
  const [medForm, setMedForm] = useState({
    medicationName: '',
    quantity: '',
    unit: 'bottle' as MedicationUnit,
    expiryDate: '',
    minThreshold: '5',
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getInventoryData({
        data: { farmId: selectedFarmId },
      })
      setFeedInventory(result.feedInventory)
      setMedicationInventory(result.medicationInventory)
    } catch (err) {
      console.error(
        t('inventory:error.load', { defaultValue: 'Failed to load inventory' }),
        err,
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedFarmId])

  const resetFeedForm = () => {
    setFeedForm({ feedType: 'starter', quantityKg: '', minThresholdKg: '10' })
    setError('')
  }

  const resetMedForm = () => {
    setMedForm({
      medicationName: '',
      quantity: '',
      unit: 'bottle',
      expiryDate: '',
      minThreshold: '5',
    })
    setError('')
  }

  // Feed handlers
  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) {
      setError(
        t('common:selectFarm', {
          defaultValue: 'Please select a farm first',
        }),
      )
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await createFeedInventoryFn({
        data: {
          input: {
            farmId: selectedFarmId,
            feedType: feedForm.feedType,
            quantityKg: parseFloat(feedForm.quantityKg),
            minThresholdKg: parseFloat(feedForm.minThresholdKg),
          },
        },
      })
      setFeedDialogOpen(false)
      toast.success(
        t('inventory:feed.recorded', { defaultValue: 'Feed inventory added' }),
      )
      resetFeedForm()
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('inventory:feed.error.create', {
              defaultValue: 'Failed to create feed inventory',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeed) return
    setIsSubmitting(true)
    try {
      await updateFeedInventoryFn({
        data: {
          id: selectedFeed.id,
          input: {
            quantityKg: parseFloat(feedForm.quantityKg),
            minThresholdKg: parseFloat(feedForm.minThresholdKg),
          },
        },
      })
      setEditFeedDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFeed = async () => {
    if (!selectedFeed) return
    setIsSubmitting(true)
    try {
      await deleteFeedInventoryFn({ data: { id: selectedFeed.id } })
      setDeleteFeedDialogOpen(false)
      toast.success(
        t('inventory:feed.deleted', { defaultValue: 'Feed inventory deleted' }),
      )
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Medication handlers
  const handleCreateMed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) {
      setError('Please select a farm first')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await createMedicationFn({
        data: {
          input: {
            farmId: selectedFarmId,
            medicationName: medForm.medicationName,
            quantity: parseInt(medForm.quantity),
            unit: medForm.unit,
            expiryDate: medForm.expiryDate
              ? new Date(medForm.expiryDate)
              : null,
            minThreshold: parseInt(medForm.minThreshold),
          },
        },
      })
      setMedDialogOpen(false)
      toast.success(
        t('inventory:medication.recorded', {
          defaultValue: 'Medication added',
        }),
      )
      resetMedForm()
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('inventory:medication.error.create', {
              defaultValue: 'Failed to create medication',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMed) return
    setIsSubmitting(true)
    try {
      await updateMedicationFn({
        data: {
          id: selectedMed.id,
          input: {
            medicationName: medForm.medicationName,
            quantity: parseInt(medForm.quantity),
            unit: medForm.unit,
            expiryDate: medForm.expiryDate
              ? new Date(medForm.expiryDate)
              : null,
            minThreshold: parseInt(medForm.minThreshold),
          },
        },
      })
      setEditMedDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMed = async () => {
    if (!selectedMed) return
    setIsSubmitting(true)
    try {
      await deleteMedicationFn({ data: { id: selectedMed.id } })
      setDeleteMedDialogOpen(false)
      toast.success(
        t('inventory:medication.deleted', {
          defaultValue: 'Medication deleted',
        }),
      )
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditFeed = (item: FeedInventoryItem) => {
    setSelectedFeed(item)
    setFeedForm({
      feedType: item.feedType as FeedType,
      quantityKg: item.quantityKg,
      minThresholdKg: item.minThresholdKg,
    })
    setEditFeedDialogOpen(true)
  }

  const openEditMed = (item: MedicationItem) => {
    setSelectedMed(item)
    setMedForm({
      medicationName: item.medicationName,
      quantity: item.quantity.toString(),
      unit: item.unit as MedicationUnit,
      expiryDate: item.expiryDate
        ? new Date(item.expiryDate).toISOString().split('T')[0]
        : '',
      minThreshold: item.minThreshold.toString(),
    })
    setEditMedDialogOpen(true)
  }

  const isLowStock = (qty: number, threshold: number) => qty <= threshold
  const isExpiringSoon = (date: Date | null) => {
    if (!date) return false
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return new Date(date) <= thirtyDaysFromNow
  }
  const isExpired = (date: Date | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  // Count alerts
  const lowStockFeedCount = feedInventory.filter(
    (f) => parseFloat(f.quantityKg) <= parseFloat(f.minThresholdKg),
  ).length
  const lowStockMedCount = medicationInventory.filter(
    (m) => m.quantity <= m.minThreshold,
  ).length
  const expiringMedCount = medicationInventory.filter(
    (m) => isExpiringSoon(m.expiryDate) && !isExpired(m.expiryDate),
  ).length
  const expiredMedCount = medicationInventory.filter((m) =>
    isExpired(m.expiryDate),
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('inventory:title', { defaultValue: 'Inventory' })}
        description={t('inventory:subtitle', {
          defaultValue: 'Manage feed and medication stock levels',
        })}
        icon={Warehouse}
      />

      {/* Alert Summary */}
      {(lowStockFeedCount > 0 ||
        lowStockMedCount > 0 ||
        expiringMedCount > 0 ||
        expiredMedCount > 0) && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              {t('inventory:alerts.title', {
                defaultValue: 'Inventory Alerts',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {lowStockFeedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-warning border-warning"
                >
                  {lowStockFeedCount}{' '}
                  {t('inventory:alerts.feedLow', {
                    defaultValue: 'feed type(s) low stock',
                  })}
                </Badge>
              )}
              {lowStockMedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-warning border-warning"
                >
                  {lowStockMedCount}{' '}
                  {t('inventory:alerts.medLow', {
                    defaultValue: 'medication(s) low stock',
                  })}
                </Badge>
              )}
              {expiringMedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-500"
                >
                  {expiringMedCount}{' '}
                  {t('inventory:alerts.medExpiring', {
                    defaultValue: 'medication(s) expiring soon',
                  })}
                </Badge>
              )}
              {expiredMedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-destructive border-destructive"
                >
                  {expiredMedCount}{' '}
                  {t('inventory:alerts.medExpired', {
                    defaultValue: 'medication(s) expired',
                  })}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'feed' ? 'default' : 'outline'}
          onClick={() => setActiveTab('feed')}
          className="flex items-center gap-2"
        >
          <Package className="h-4 w-4" />
          {t('inventory:tabs.feed', { defaultValue: 'Feed Inventory' })}
          {lowStockFeedCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {lowStockFeedCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'medication' ? 'default' : 'outline'}
          onClick={() => setActiveTab('medication')}
          className="flex items-center gap-2"
        >
          <Pill className="h-4 w-4" />
          {t('inventory:tabs.medication', {
            defaultValue: 'Medication Inventory',
          })}
          {lowStockMedCount + expiredMedCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {lowStockMedCount + expiredMedCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Feed Inventory Tab */}
      {activeTab === 'feed' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {t('inventory:feed.title', { defaultValue: 'Feed Inventory' })}
              </CardTitle>
              <CardDescription>
                {t('inventory:feed.description', {
                  defaultValue: 'Track feed stock levels by type',
                })}
              </CardDescription>
            </div>
            <Dialog open={feedDialogOpen} onOpenChange={setFeedDialogOpen}>
              <DialogTrigger
                render={
                  <Button disabled={!selectedFarmId}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('inventory:feed.add', { defaultValue: 'Add Feed' })}
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t('inventory:dialog.addFeedTitle', {
                      defaultValue: 'Add Feed Inventory',
                    })}
                  </DialogTitle>
                  <DialogDescription>
                    {t('inventory:dialog.addFeedDesc', {
                      defaultValue: 'Add a new feed type to track',
                    })}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateFeed} className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      {t('inventory:feed.type', { defaultValue: 'Feed Type' })}
                    </Label>
                    <Select
                      value={feedForm.feedType}
                      onValueChange={(v) =>
                        v && setFeedForm((p) => ({ ...p, feedType: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FEED_TYPES.map((typeItem) => (
                          <SelectItem
                            key={typeItem.value}
                            value={typeItem.value}
                          >
                            {typeItem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {t('inventory:feed.quantity', {
                          defaultValue: 'Quantity (kg)',
                        })}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={feedForm.quantityKg}
                        onChange={(e) =>
                          setFeedForm((p) => ({
                            ...p,
                            quantityKg: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t('inventory:feed.threshold', {
                          defaultValue: 'Min Threshold (kg)',
                        })}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={feedForm.minThresholdKg}
                        onChange={(e) =>
                          setFeedForm((p) => ({
                            ...p,
                            minThresholdKg: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
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
                      onClick={() => setFeedDialogOpen(false)}
                    >
                      {t('common:cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? t('inventory:dialog.adding', {
                            defaultValue: 'Adding...',
                          })
                        : t('inventory:feed.add', { defaultValue: 'Add Feed' })}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common:loading', { defaultValue: 'Loading...' })}
              </div>
            ) : feedInventory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('inventory:feed.empty', {
                    defaultValue: 'No feed inventory records',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('inventory:feed.emptyDesc', {
                    defaultValue:
                      'Add feed types to start tracking stock levels',
                  })}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {feedInventory.map((item) => {
                  const qty = parseFloat(item.quantityKg)
                  const threshold = parseFloat(item.minThresholdKg)
                  const lowStock = isLowStock(qty, threshold)
                  return (
                    <Card
                      key={item.id}
                      className={lowStock ? 'border-warning/50' : ''}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg capitalize">
                            {item.feedType.replace('_', ' ')}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditFeed(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedFeed(item)
                                setDeleteFeedDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {item.farmName && (
                          <CardDescription>{item.farmName}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t('inventory:feed.stock', {
                                defaultValue: 'Stock',
                              })}
                              :
                            </span>
                            <span
                              className={`font-bold ${lowStock ? 'text-warning' : ''}`}
                            >
                              {formatWeight(qty)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t('inventory:feed.threshold', {
                                defaultValue: 'Min Threshold',
                              })}
                              :
                            </span>
                            <span>{formatWeight(threshold)}</span>
                          </div>
                          {lowStock && (
                            <Badge
                              variant="outline"
                              className="text-warning border-warning w-full justify-center"
                            >
                              {t('inventory:feed.lowStock', {
                                defaultValue: 'Low Stock',
                              })}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medication Inventory Tab */}
      {activeTab === 'medication' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {t('inventory:medication.title', {
                  defaultValue: 'Medication Inventory',
                })}
              </CardTitle>
              <CardDescription>
                {t('inventory:medication.description', {
                  defaultValue: 'Track medication stock and expiry dates',
                })}
              </CardDescription>
            </div>
            <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
              <DialogTrigger
                render={
                  <Button disabled={!selectedFarmId}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('inventory:medication.add', {
                      defaultValue: 'Add Medication',
                    })}
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t('inventory:dialog.addMedTitle', {
                      defaultValue: 'Add Medication',
                    })}
                  </DialogTitle>
                  <DialogDescription>
                    {t('inventory:dialog.addMedDesc', {
                      defaultValue: 'Add a new medication to inventory',
                    })}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMed} className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      {t('inventory:medication.name', {
                        defaultValue: 'Medication Name',
                      })}
                    </Label>
                    <Input
                      value={medForm.medicationName}
                      onChange={(e) =>
                        setMedForm((p) => ({
                          ...p,
                          medicationName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Ivermectin"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {t('inventory:medication.quantity', {
                          defaultValue: 'Quantity',
                        })}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={medForm.quantity}
                        onChange={(e) =>
                          setMedForm((p) => ({
                            ...p,
                            quantity: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t('inventory:medication.unit', {
                          defaultValue: 'Unit',
                        })}
                      </Label>
                      <Select
                        value={medForm.unit}
                        onValueChange={(v) =>
                          v &&
                          setMedForm((p) => ({
                            ...p,
                            unit: v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDICATION_UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {t('inventory:medication.expiry', {
                          defaultValue: 'Expiry Date',
                        })}{' '}
                        ({t('common:optional', { defaultValue: 'Optional' })})
                      </Label>
                      <Input
                        type="date"
                        value={medForm.expiryDate}
                        onChange={(e) =>
                          setMedForm((p) => ({
                            ...p,
                            expiryDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t('inventory:medication.threshold', {
                          defaultValue: 'Min Threshold',
                        })}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={medForm.minThreshold}
                        onChange={(e) =>
                          setMedForm((p) => ({
                            ...p,
                            minThreshold: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
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
                      onClick={() => setMedDialogOpen(false)}
                    >
                      {t('common:cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? t('inventory:dialog.adding', {
                            defaultValue: 'Adding...',
                          })
                        : t('inventory:medication.add', {
                            defaultValue: 'Add Medication',
                          })}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common:loading', { defaultValue: 'Loading...' })}
              </div>
            ) : medicationInventory.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('inventory:medication.empty', {
                    defaultValue: 'No medication inventory records',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('inventory:medication.emptyDesc', {
                    defaultValue:
                      'Add medications to start tracking stock and expiry',
                  })}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {medicationInventory.map((item) => {
                  const lowStock = isLowStock(item.quantity, item.minThreshold)
                  const expiring =
                    isExpiringSoon(item.expiryDate) &&
                    !isExpired(item.expiryDate)
                  const expired = isExpired(item.expiryDate)
                  return (
                    <Card
                      key={item.id}
                      className={
                        expired
                          ? 'border-red-500'
                          : expiring
                            ? 'border-orange-500'
                            : lowStock
                              ? 'border-yellow-500'
                              : ''
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {item.medicationName}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditMed(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedMed(item)
                                setDeleteMedDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {item.farmName && (
                          <CardDescription>{item.farmName}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t('inventory:medication.stock', {
                                defaultValue: 'Stock',
                              })}
                              :
                            </span>
                            <span
                              className={`font-bold ${lowStock ? 'text-yellow-600' : ''}`}
                            >
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t('inventory:medication.threshold', {
                                defaultValue: 'Min Threshold',
                              })}
                              :
                            </span>
                            <span>
                              {item.minThreshold} {item.unit}
                            </span>
                          </div>
                          {item.expiryDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {t('inventory:medication.expiry', {
                                  defaultValue: 'Expires',
                                })}
                                :
                              </span>
                              <span
                                className={
                                  expired
                                    ? 'text-red-600 font-bold'
                                    : expiring
                                      ? 'text-orange-600'
                                      : ''
                                }
                              >
                                {formatDate(item.expiryDate)}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lowStock && (
                              <Badge
                                variant="outline"
                                className="text-yellow-600 border-yellow-500"
                              >
                                {t('inventory:medication.lowStock', {
                                  defaultValue: 'Low Stock',
                                })}
                              </Badge>
                            )}
                            {expiring && (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-500"
                              >
                                {t('inventory:medication.expiringSoon', {
                                  defaultValue: 'Expiring Soon',
                                })}
                              </Badge>
                            )}
                            {expired && (
                              <Badge
                                variant="outline"
                                className="text-red-600 border-red-500"
                              >
                                {t('inventory:medication.expired', {
                                  defaultValue: 'Expired',
                                })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Feed Dialog */}
      <Dialog open={editFeedDialogOpen} onOpenChange={setEditFeedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('inventory:dialog.editFeedTitle', {
                defaultValue: 'Edit Feed Inventory',
              })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFeed} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('inventory.feed.quantity', {
                    defaultValue: 'Quantity (kg)',
                  })}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={feedForm.quantityKg}
                  onChange={(e) =>
                    setFeedForm((p) => ({ ...p, quantityKg: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('inventory.feed.threshold', {
                    defaultValue: 'Min Threshold (kg)',
                  })}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={feedForm.minThresholdKg}
                  onChange={(e) =>
                    setFeedForm((p) => ({
                      ...p,
                      minThresholdKg: e.target.value,
                    }))
                  }
                  required
                />
              </div>
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
                onClick={() => setEditFeedDialogOpen(false)}
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('common:save', { defaultValue: 'Save Changes' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Feed Dialog */}
      <Dialog
        open={deleteFeedDialogOpen}
        onOpenChange={setDeleteFeedDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('inventory:dialog.deleteFeedTitle', {
                defaultValue: 'Delete Feed Inventory',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('inventory:dialog.deleteFeedDesc', {
                defaultValue:
                  'Are you sure you want to delete this feed inventory record? This action cannot be undone.',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteFeedDialogOpen(false)}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFeed}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common:deleting', { defaultValue: 'Deleting...' })
                : t('common:delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Medication Dialog */}
      <Dialog open={editMedDialogOpen} onOpenChange={setEditMedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('inventory:dialog.editMedTitle', {
                defaultValue: 'Edit Medication',
              })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditMed} className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t('inventory.medication.name', {
                  defaultValue: 'Medication Name',
                })}
              </Label>
              <Input
                value={medForm.medicationName}
                onChange={(e) =>
                  setMedForm((p) => ({ ...p, medicationName: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('inventory.medication.quantity', {
                    defaultValue: 'Quantity',
                  })}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={medForm.quantity}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('inventory.medication.unit', { defaultValue: 'Unit' })}
                </Label>
                <Select
                  value={medForm.unit}
                  onValueChange={(v) =>
                    v && setMedForm((p) => ({ ...p, unit: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICATION_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('inventory.medication.expiry', {
                    defaultValue: 'Expiry Date',
                  })}
                </Label>
                <Input
                  type="date"
                  value={medForm.expiryDate}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('inventory.medication.threshold', {
                    defaultValue: 'Min Threshold',
                  })}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={medForm.minThreshold}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, minThreshold: e.target.value }))
                  }
                  required
                />
              </div>
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
                onClick={() => setEditMedDialogOpen(false)}
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('common:save', { defaultValue: 'Save Changes' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Medication Dialog */}
      <Dialog open={deleteMedDialogOpen} onOpenChange={setDeleteMedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('inventory:dialog.deleteMedTitle', {
                defaultValue: 'Delete Medication',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('inventory:dialog.deleteMedDesc', {
                defaultValue:
                  'Are you sure you want to delete this medication? This action cannot be undone.',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteMedDialogOpen(false)}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMed}
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
