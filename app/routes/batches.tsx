import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getBatchesForFarm, getInventorySummary, createBatch } from '~/lib/batches/server'
import { getSpeciesOptions } from '~/lib/batches/constants'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Plus, Users, TrendingUp, AlertTriangle, Fish, Bird, Eye, Edit, Trash2 } from 'lucide-react'
import { useFarm } from '~/components/farm-context'
import { useEffect, useState } from 'react'

interface Batch {
  id: string
  farmId: string
  livestockType: 'poultry' | 'fish'
  species: string
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: 'active' | 'depleted' | 'sold'
  createdAt: Date
  updatedAt: Date
}

interface InventorySummary {
  poultry: { batches: number; quantity: number; investment: number }
  fish: { batches: number; quantity: number; investment: number }
  overall: {
    totalBatches: number
    activeBatches: number
    depletedBatches: number
    totalQuantity: number
    totalInvestment: number
  }
}

interface BatchData {
  batches: Batch[]
  summary: InventorySummary | null
}

const getBatchesForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [batches, summary] = await Promise.all([
        getBatchesForFarm(session.user.id, data.farmId),
        getInventorySummary(session.user.id, data.farmId),
      ])
      return { batches, summary }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createBatchAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    livestockType: 'poultry' | 'fish'
    species: string
    initialQuantity: number
    acquisitionDate: string
    costPerUnit: number
  }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const batchId = await createBatch(session.user.id, {
        farmId: data.farmId,
        livestockType: data.livestockType,
        species: data.species,
        initialQuantity: data.initialQuantity,
        acquisitionDate: new Date(data.acquisitionDate),
        costPerUnit: data.costPerUnit,
      })
      return { success: true, batchId }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface BatchSearchParams {
  status?: 'active' | 'depleted' | 'sold'
  livestockType?: 'poultry' | 'fish'
}

export const Route = createFileRoute('/batches')({
  component: BatchesPage,
  validateSearch: (search: Record<string, unknown>): BatchSearchParams => ({
    status: typeof search.status === 'string' && ['active', 'depleted', 'sold'].includes(search.status)
      ? search.status as 'active' | 'depleted' | 'sold'
      : undefined,
    livestockType: typeof search.livestockType === 'string' && ['poultry', 'fish'].includes(search.livestockType)
      ? search.livestockType as 'poultry' | 'fish'
      : undefined,
  }),
})

function BatchesPage() {
  const { selectedFarmId } = useFarm()
  const search = Route.useSearch()
  const [data, setData] = useState<BatchData>({ batches: [], summary: null })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    livestockType: 'poultry' as 'poultry' | 'fish',
    species: '',
    initialQuantity: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    costPerUnit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // View/Edit/Delete dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [editFormData, setEditFormData] = useState({
    currentQuantity: '',
    status: 'active' as 'active' | 'depleted' | 'sold',
  })

  const speciesOptions = getSpeciesOptions(formData.livestockType)

  const loadData = async () => {
    if (!selectedFarmId) {
      setData({ batches: [], summary: null })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getBatchesForFarmFn({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load batches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedFarmId])

  const resetForm = () => {
    setFormData({
      livestockType: 'poultry',
      species: '',
      initialQuantity: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      costPerUnit: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createBatchAction({
        data: {
          farmId: selectedFarmId,
          livestockType: formData.livestockType,
          species: formData.species,
          initialQuantity: parseInt(formData.initialQuantity),
          acquisitionDate: formData.acquisitionDate,
          costPerUnit: parseFloat(formData.costPerUnit),
        }
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLivestockTypeChange = (type: string | null) => {
    if (type && (type === 'poultry' || type === 'fish')) {
      setFormData(prev => ({ ...prev, livestockType: type, species: '' }))
    }
  }

  const handleViewBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setViewDialogOpen(true)
  }

  const handleEditBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setEditFormData({
      currentQuantity: batch.currentQuantity.toString(),
      status: batch.status,
    })
    setEditDialogOpen(true)
  }

  const handleDeleteBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return

    // TODO: Implement update batch action
    console.log('Update batch:', selectedBatch.id, editFormData)
    setEditDialogOpen(false)
    loadData()
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return

    // TODO: Implement delete batch action
    console.log('Delete batch:', selectedBatch.id)
    setDeleteDialogOpen(false)
    loadData()
  }

  const { batches, summary } = data

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Livestock Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage your livestock batches and inventory</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">Select a farm from the sidebar to view inventory</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Livestock Inventory</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Livestock Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your livestock batches and inventory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>Add a new livestock batch to your inventory</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="livestockType">Livestock Type</Label>
                <Select value={formData.livestockType} onValueChange={handleLivestockTypeChange}>
                  <SelectTrigger>
                    <SelectValue>{formData.livestockType.charAt(0).toUpperCase() + formData.livestockType.slice(1)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Select
                  value={formData.species}
                  onValueChange={(value) => value && setFormData(prev => ({ ...prev, species: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>{formData.species || 'Select species'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((species) => (
                      <SelectItem key={species} value={species}>{species}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialQuantity">Initial Quantity</Label>
                <Input
                  id="initialQuantity"
                  type="number"
                  min="1"
                  value={formData.initialQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialQuantity: e.target.value }))}
                  placeholder="Enter initial quantity"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Cost per Unit (₦)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPerUnit: e.target.value }))}
                  placeholder="Enter cost per unit in Naira"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acquisitionDate">Acquisition Date</Label>
                <Input
                  id="acquisitionDate"
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                  required
                />
              </div>

              {formData.initialQuantity && formData.costPerUnit && (
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Cost Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{parseInt(formData.initialQuantity || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost per Unit:</span>
                      <span>₦{parseFloat(formData.costPerUnit || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total Cost:</span>
                      <span>₦{(parseInt(formData.initialQuantity || '0') * parseFloat(formData.costPerUnit || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.species || !formData.initialQuantity || !formData.costPerUnit}
                >
                  {isSubmitting ? 'Creating...' : 'Create Batch'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Livestock</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{summary.overall.totalQuantity.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{summary.overall.activeBatches} active batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Poultry</CardTitle>
              <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{summary.poultry.quantity.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{summary.poultry.batches} batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Fish</CardTitle>
              <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{summary.fish.quantity.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{summary.fish.batches} batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Investment</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{formatNaira(summary.overall.totalInvestment)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{summary.overall.depletedBatches} depleted batches</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select
          value={search.status || 'all'}
          onValueChange={(value) => {
            const params = new URLSearchParams()
            if (value && value !== 'all') params.set('status', value)
            if (search.livestockType) params.set('livestockType', search.livestockType)
            window.history.pushState({}, '', `/batches?${params.toString()}`)
            window.location.reload()
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue>{search.status ? search.status.charAt(0).toUpperCase() + search.status.slice(1) : 'All Status'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="depleted">Depleted</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={search.livestockType || 'all'}
          onValueChange={(value) => {
            const params = new URLSearchParams()
            if (search.status) params.set('status', search.status)
            if (value && value !== 'all') params.set('livestockType', value)
            window.history.pushState({}, '', `/batches?${params.toString()}`)
            window.location.reload()
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue>{search.livestockType ? search.livestockType.charAt(0).toUpperCase() + search.livestockType.slice(1) : 'All Types'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="poultry">Poultry</SelectItem>
            <SelectItem value="fish">Fish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batches List */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No batches found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first livestock batch</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg capitalize">{batch.species}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {batch.livestockType === 'poultry' ? <Bird className="h-4 w-4" /> : <Fish className="h-4 w-4" />}
                      {batch.livestockType}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={
                      batch.status === 'active' ? 'default' :
                        batch.status === 'depleted' ? 'destructive' : 'secondary'
                    }>
                      {batch.status}
                    </Badge>
                    {batch.currentQuantity <= batch.initialQuantity * 0.1 && batch.status === 'active' && (
                      <Badge variant="warning" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Quantity:</span>
                    <span className="font-medium">{batch.currentQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Initial Quantity:</span>
                    <span>{batch.initialQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost per Unit:</span>
                    <span>{formatNaira(batch.costPerUnit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Acquisition Date:</span>
                    <span>{new Date(batch.acquisitionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-h-[44px]"
                      onClick={() => handleViewBatch(batch)}
                    >
                      <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-h-[44px]"
                      onClick={() => handleEditBatch(batch)}
                    >
                      <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive min-h-[44px] px-3"
                      onClick={() => handleDeleteBatch(batch)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>


              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Batch Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedBatch.livestockType === 'poultry' ? <Bird className="h-5 w-5" /> : <Fish className="h-5 w-5" />}
                <div>
                  <p className="font-semibold text-lg capitalize">{selectedBatch.species}</p>
                  <p className="text-sm text-muted-foreground">{selectedBatch.livestockType}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={
                    selectedBatch.status === 'active' ? 'default' :
                    selectedBatch.status === 'depleted' ? 'destructive' : 'secondary'
                  }>
                    {selectedBatch.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Quantity:</span>
                  <span className="font-medium">{selectedBatch.currentQuantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Initial Quantity:</span>
                  <span>{selectedBatch.initialQuantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost per Unit:</span>
                  <span>{formatNaira(selectedBatch.costPerUnit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-medium">{formatNaira(selectedBatch.totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Acquisition Date:</span>
                  <span>{new Date(selectedBatch.acquisitionDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setViewDialogOpen(false)
                  handleEditBatch(selectedBatch)
                }}>
                  Edit Batch
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Batch Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>Update batch information</DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Species</Label>
                <Input value={selectedBatch.species} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-current-quantity">Current Quantity</Label>
                <Input
                  id="edit-current-quantity"
                  type="number"
                  min="0"
                  value={editFormData.currentQuantity}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, currentQuantity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => {
                    if (value === 'active' || value === 'depleted' || value === 'sold') {
                      setEditFormData(prev => ({ ...prev, status: value }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="depleted">Depleted</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium capitalize">{selectedBatch.species}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBatch.currentQuantity.toLocaleString()} units • {selectedBatch.livestockType}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Delete Batch
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
