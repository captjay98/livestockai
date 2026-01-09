import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getExpensesForFarm, getExpensesSummary, createExpense } from '~/lib/expenses/server'
import { EXPENSE_CATEGORIES } from '~/lib/expenses/constants'
import { requireAuth } from '~/lib/auth/middleware'
import { getSuppliers } from '~/lib/suppliers/server'
import { getBatchesForFarm } from '~/lib/batches/server'
import { FEED_TYPES } from '~/lib/feed/constants'
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
import { Plus, Receipt, TrendingDown, Repeat } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFarm } from '~/components/farm-context'

interface Expense {
  id: string
  category: string
  amount: string
  date: Date
  description: string
  supplierName: string | null
  isRecurring: boolean
  batchId: string | null
  batchSpecies: string | null
  batchType: string | null
}

interface Supplier {
  id: string
  name: string
  phone: string
}

interface ExpensesSummary {
  byCategory: Record<string, { count: number; amount: number }>
  total: { count: number; amount: number }
}

interface ExpensesData {
  expenses: Expense[]
  summary: ExpensesSummary | null
  suppliers: Supplier[]
  batches: Array<{ id: string, species: string, livestockType: string, status: string }>
}

const getExpensesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [expenses, summary, suppliers, batches] = await Promise.all([
        getExpensesForFarm(session.user.id, data.farmId),
        getExpensesSummary(session.user.id, data.farmId),
        getSuppliers(),
        getBatchesForFarm(session.user.id, data.farmId),
      ])
      return { expenses, summary, suppliers, batches }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createExpenseAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    category: string
    amount: number
    date: string
    description: string
    batchId?: string
    supplierId?: string
    isRecurring?: boolean
    feedType?: string
    feedQuantityKg?: number
  }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createExpense(session.user.id, {
        farmId: data.farmId,
        category: data.category as any,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
        batchId: data.batchId || null,
        supplierId: data.supplierId || null,
        isRecurring: data.isRecurring || false,
        feedType: data.feedType as any,
        feedQuantityKg: data.feedQuantityKg,
      })
      return { success: true, id }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/expenses')({
  component: ExpensesPage,
})

function ExpensesPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<ExpensesData>({ expenses: [], summary: null, suppliers: [], batches: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    batchId: '',
    supplierId: '',
    isRecurring: false,
    feedType: '',
    feedQuantityKg: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!selectedFarmId) {
      setData({ expenses: [], summary: null, suppliers: [], batches: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getExpensesDataForFarm({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load expenses data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedFarmId])

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      batchId: '',
      supplierId: '',
      isRecurring: false,
      feedType: '',
      feedQuantityKg: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createExpenseAction({
        data: {
          farmId: selectedFarmId,
          category: formData.category,
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description,
          batchId: formData.batchId || undefined,
          supplierId: formData.supplierId || undefined,
          isRecurring: formData.isRecurring,
          feedType: formData.category === 'feed' ? formData.feedType : undefined,
          feedQuantityKg: formData.category === 'feed' ? parseFloat(formData.feedQuantityKg) : undefined,
        }
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { expenses, summary, suppliers, batches } = data

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-1">Track your business expenses</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">
              Select a farm from the sidebar to view expenses
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
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track your business expenses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Expense
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Log a new expense transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => value && setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>{formData.category ? EXPENSE_CATEGORIES.find(c => c.value === formData.category)?.label : 'Select category'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., 50 bags of starter feed"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchId">Batch (Optional)</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, batchId: value || '' }))}
                >
                  <SelectTrigger>
                    <SelectValue>{formData.batchId ? batches.find(b => b.id === formData.batchId)?.species : 'Select batch'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (General Farm Expense)</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.species} ({batch.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category === 'feed' && (
                <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="feedType">Feed Type</Label>
                    <Select
                      value={formData.feedType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, feedType: value || '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue>{formData.feedType ? FEED_TYPES.find(t => t.value === formData.feedType)?.label : 'Select feed'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {FEED_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedQuantityKg">Quantity (kg)</Label>
                    <Input
                      id="feedQuantityKg"
                      type="number"
                      step="0.1"
                      value={formData.feedQuantityKg}
                      onChange={(e) => setFormData(prev => ({ ...prev, feedQuantityKg: e.target.value }))}
                      placeholder="kg"
                      required={formData.category === 'feed'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount in Naira"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              {suppliers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier (Optional)</Label>
                  <Select
                    value={formData.supplierId || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value || '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue>{formData.supplierId ? suppliers.find(s => s.id === formData.supplierId)?.name : 'Select supplier'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isRecurring" className="text-sm font-normal">
                  This is a recurring expense
                </Label>
              </div>

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
                  disabled={isSubmitting || !formData.category || !formData.amount || !formData.description}
                >
                  {isSubmitting ? 'Recording...' : 'Record Expense'}
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
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</CardTitle>
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{formatNaira(summary.total.amount)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{summary.total.count} transactions</p>
            </CardContent>
          </Card>

          {Object.entries(summary.byCategory).slice(0, 3).map(([category, catData]) => (
            <Card key={category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{getCategoryLabel(category)}</CardTitle>
                <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold">{formatNaira(catData.amount)}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{catData.count} transactions</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
            <p className="text-muted-foreground mb-4">Record your first expense</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
            <CardDescription>Recent expense transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                        {getCategoryLabel(expense.category)}
                        {expense.batchSpecies && (
                          <>
                            <span className="text-muted-foreground/50 mx-1">•</span>
                            <Badge variant="secondary" className="px-1 py-0 h-4 text-[10px] bg-primary/10 text-primary border-primary/20">
                              {expense.batchSpecies}
                            </Badge>
                          </>
                        )}
                        {expense.supplierName && (
                          <>
                            <span className="text-muted-foreground/50 mx-1">•</span>
                            {expense.supplierName}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-destructive">{formatNaira(expense.amount)}</p>
                      {expense.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">
                      {new Date(expense.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
