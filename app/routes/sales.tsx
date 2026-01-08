import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSalesForFarm, getSalesSummary, createSale } from '~/lib/sales/server'
import { getBatchesForFarm } from '~/lib/batches/server'
import { getCustomers } from '~/lib/customers/server'
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
import { Plus, ShoppingCart, TrendingUp, Bird, Fish, Egg } from 'lucide-react'
import { useState, useEffect } from 'react'
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
  sales: Sale[]
  summary: SalesSummary | null
  batches: Batch[]
  customers: Customer[]
}

const getSalesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [sales, summary, batches, customers] = await Promise.all([
        getSalesForFarm(session.user.id, data.farmId),
        getSalesSummary(session.user.id, data.farmId),
        getBatchesForFarm(session.user.id, data.farmId),
        getCustomers(),
      ])
      return { 
        sales, 
        summary, 
        batches: batches.filter(b => b.status === 'active'),
        customers 
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createSaleAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    batchId?: string
    customerId?: string
    livestockType: string
    quantity: number
    unitPrice: number
    date: string
  }) => data)
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
    } catch (error) {
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
  const [data, setData] = useState<SalesData>({ sales: [], summary: null, batches: [], customers: [] })
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

  const loadData = async () => {
    if (!selectedFarmId) {
      setData({ sales: [], summary: null, batches: [], customers: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getSalesDataForFarm({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load sales data:', error)
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
        }
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

  const { sales, summary, batches, customers } = data

  const selectedBatch = batches.find(b => b.id === formData.batchId)
  const filteredBatches = batches.filter(b => 
    formData.livestockType === 'eggs' || b.livestockType === formData.livestockType
  )
  const totalAmount = formData.quantity && formData.unitPrice 
    ? parseInt(formData.quantity) * parseFloat(formData.unitPrice)
    : 0

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poultry': return <Bird className="h-4 w-4" />
      case 'fish': return <Fish className="h-4 w-4" />
      case 'eggs': return <Egg className="h-4 w-4" />
      default: return <ShoppingCart className="h-4 w-4" />
    }
  }

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-muted-foreground mt-1">Track your sales and revenue</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">
              Select a farm from the sidebar to view sales
            </p>
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
          <p className="text-muted-foreground mt-1">Track your sales and revenue</p>
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
                  onValueChange={(value) => value && setFormData(prev => ({ 
                    ...prev, 
                    livestockType: value as any,
                    batchId: '' 
                  }))}
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

              {formData.livestockType !== 'eggs' && filteredBatches.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch (Optional)</Label>
                  <Select
                    value={formData.batchId || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, batchId: value || '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue>{formData.batchId ? filteredBatches.find(b => b.id === formData.batchId)?.species : 'Select batch to deduct from'}</SelectValue>
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value || '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue>{formData.customerId ? customers.find(c => c.id === formData.customerId)?.name : 'Select customer'}</SelectValue>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.quantity || !formData.unitPrice}
                >
                  {isSubmitting ? 'Recording...' : 'Record Sale'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.total.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.total.count} sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Poultry Sales</CardTitle>
              <Bird className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.poultry.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.poultry.quantity} birds sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fish Sales</CardTitle>
              <Fish className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.fish.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.fish.quantity} fish sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egg Sales</CardTitle>
              <Egg className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.eggs.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.eggs.quantity} eggs sold</p>
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
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {getTypeIcon(sale.livestockType)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {sale.batchSpecies || sale.livestockType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sale.customerName || 'Walk-in customer'} • {sale.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNaira(sale.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNaira(sale.unitPrice)}/unit
                    </p>
                  </div>
                  <Badge variant="outline">
                    {new Date(sale.date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
