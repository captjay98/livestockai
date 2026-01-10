import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  Bird,
  Edit,
  Egg,
  Eye,
  Fish,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createSale,
  getSales,
  getSalesSummary,
  updateSaleFn,
  deleteSaleFn,
} from '~/lib/sales/server'
import { getBatches } from '~/lib/batches/server'
import { getCustomers } from '~/lib/customers/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatNaira } from '~/lib/currency'
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
import { useFarm } from '~/components/farm-context'

interface Sale {
  id: string
  livestockType: string
  quantity: number
  unitPrice: string
  totalAmount: string
  date: Date
  customerName: string | null
  batchSpecies: string | null
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface SalesSummary {
  poultry: { count: number; quantity: number; revenue: number }
  fish: { count: number; quantity: number; revenue: number }
  eggs: { count: number; quantity: number; revenue: number }
  total: { count: number; quantity: number; revenue: number }
}

interface SalesData {
  sales: Array<Sale>
  summary: SalesSummary | null
  batches: Array<Batch>
  customers: Array<Customer>
}

const getSalesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string | null }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data?.farmId || undefined
      const [sales, summary, batches, customers] = await Promise.all([
        getSales(session.user.id, farmId),
        getSalesSummary(session.user.id, farmId),
        farmId ? getBatches(session.user.id, farmId) : Promise.resolve([]),
        getCustomers(),
      ])
      return {
        sales,
        summary,
        batches: batches.filter((b) => b.status === 'active'),
        customers,
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

const createSaleAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId?: string
      customerId?: string
      livestockType: string
      quantity: number
      unitPrice: number
      date: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createSale(session.user.id, {
        farmId: data.farmId,
        batchId: data.batchId || null,
        customerId: data.customerId || null,
        livestockType: data.livestockType as any,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        date: new Date(data.date),
      })
      return { success: true, id }
    } catch (err) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/sales')({
  component: SalesPage,
})

function SalesPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<SalesData>({
    sales: [],
    summary: null,
    batches: [],
    customers: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    livestockType: 'poultry' as 'poultry' | 'fish' | 'eggs',
    batchId: '',
    customerId: '',
    quantity: '',
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // View/Edit/Delete dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [editFormData, setEditFormData] = useState({
    quantity: '',
    unitPrice: '',
    customerId: '',
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getSalesDataForFarm({
        data: { farmId: selectedFarmId },
      })
      setData(result)
    } catch (err) {
      console.error('Failed:', err)
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
      batchId: '',
      customerId: '',
      quantity: '',
      unitPrice: '',
      date: new Date().toISOString().split('T')[0],
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createSaleAction({
        data: {
          farmId: selectedFarmId,
          batchId: formData.batchId || undefined,
          customerId: formData.customerId || undefined,
          livestockType: formData.livestockType,
          quantity: parseInt(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          date: formData.date,
        },
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setViewDialogOpen(true)
  }

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale)
    setEditFormData({
      quantity: sale.quantity.toString(),
      unitPrice: sale.unitPrice,
      customerId: '',
    })
    setEditDialogOpen(true)
  }

  const handleDeleteSale = (sale: Sale) => {
    setSelectedSale(sale)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSale) return

    setIsSubmitting(true)
    try {
      await updateSaleFn({
        data: {
          saleId: selectedSale.id,
          data: {
            quantity: parseInt(editFormData.quantity),
            unitPrice: parseFloat(editFormData.unitPrice),
            // We don't verify customer/date in this simplified edit for now
          },
        },
      })
      setEditDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSale) return

    setIsSubmitting(true)
    try {
      await deleteSaleFn({ data: { saleId: selectedSale.id } })
      setDeleteDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { sales, summary, batches, customers } = data

  const selectedBatch = batches.find((b) => b.id === formData.batchId)
  const filteredBatches = batches.filter(
    (b) =>
      formData.livestockType === 'eggs' ||
      b.livestockType === formData.livestockType,
  )
  const totalAmount =
    formData.quantity && formData.unitPrice
      ? parseInt(formData.quantity) * parseFloat(formData.unitPrice)
      : 0

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poultry':
        return <Bird className="h-4 w-4" />
      case 'fish':
        return <Fish className="h-4 w-4" />
      case 'eggs':
        return <Egg className="h-4 w-4" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
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
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground mt-1">
            Track your sales and revenue
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Sale
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
              <DialogDescription>Log a new sale transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="livestockType">Product Type</Label>
                <Select
                  value={formData.livestockType}
                  onValueChange={(value) =>
                    value &&
                    setFormData((prev) => ({
                      ...prev,
                      livestockType: value as any,
                      batchId: '',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="eggs">Eggs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.livestockType !== 'eggs' &&
                filteredBatches.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="batchId">Batch (Optional)</Label>
                    <Select
                      value={formData.batchId || undefined}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          batchId: value || '',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formData.batchId
                            ? filteredBatches.find(
                              (b) => b.id === formData.batchId,
                            )?.species
                            : 'Select batch to deduct from'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.species} ({batch.currentQuantity} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {customers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer (Optional)</Label>
                  <Select
                    value={formData.customerId || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerId: value || '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.customerId
                          ? customers.find((c) => c.id === formData.customerId)
                            ?.name
                          : 'Select customer'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedBatch?.currentQuantity}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  placeholder="Number of units sold"
                  required
                />
                {selectedBatch && (
                  <p className="text-xs text-muted-foreground">
                    Max: {selectedBatch.currentQuantity} available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (₦)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unitPrice: e.target.value,
                    }))
                  }
                  placeholder="Price per unit"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Sale Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              {totalAmount > 0 && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Total Amount:</span>
                    <span>{formatNaira(totalAmount)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !formData.quantity || !formData.unitPrice
                  }
                >
                  {isSubmitting ? 'Recording...' : 'Record Sale'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.total.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.total.count} sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Poultry Sales
              </CardTitle>
              <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.poultry.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.poultry.quantity} birds sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Fish Sales
              </CardTitle>
              <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.fish.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.fish.quantity} fish sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Egg Sales
              </CardTitle>
              <Egg className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.eggs.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.eggs.quantity} eggs sold
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {sales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
            <p className="text-muted-foreground mb-4">Record your first sale</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
            <CardDescription>Recent sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {getTypeIcon(sale.livestockType)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium capitalize truncate">
                        {sale.batchSpecies || sale.livestockType}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {sale.customerName || 'Walk-in customer'} •{' '}
                        {sale.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-medium">
                        {formatNaira(sale.totalAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(sale.unitPrice)}/unit
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 hidden sm:block"
                    >
                      {new Date(sale.date).toLocaleDateString()}
                    </Badge>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                        onClick={() => handleViewSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                        onClick={() => handleEditSale(sale)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                        onClick={() => handleDeleteSale(sale)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {getTypeIcon(selectedSale.livestockType)}
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {selectedSale.batchSpecies || selectedSale.livestockType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSale.livestockType}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">
                    {selectedSale.customerName || 'Walk-in'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">
                    {selectedSale.quantity.toLocaleString()} units
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price:</span>
                  <span>{formatNaira(selectedSale.unitPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-lg">
                    {formatNaira(selectedSale.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span>
                    {new Date(selectedSale.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleEditSale(selectedSale)
                  }}
                >
                  Edit Sale
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>Update sale information</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Input
                  value={
                    selectedSale.batchSpecies || selectedSale.livestockType
                  }
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={editFormData.quantity}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit-price">Unit Price (₦)</Label>
                <Input
                  id="edit-unit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.unitPrice}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      unitPrice: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              {customers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="edit-customer">Customer (Optional)</Label>
                  <Select
                    value={editFormData.customerId}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        customerId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {editFormData.customerId
                          ? customers.find(
                            (c) => c.id === editFormData.customerId,
                          )?.name
                          : 'Keep existing'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keep existing customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
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
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sale? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium capitalize">
                  {selectedSale.batchSpecies || selectedSale.livestockType}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedSale.quantity} units •{' '}
                  {formatNaira(selectedSale.totalAmount)}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Delete Sale
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
