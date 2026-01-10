import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  Banknote,
  Edit,
  Eye,
  Package,
  Pill,
  Plus,
  Settings,
  Trash2,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getExpenses,
  getExpensesSummary,
  createExpenseFn,
  updateExpenseFn,
  deleteExpenseFn,
  EXPENSE_CATEGORIES,
} from '~/lib/expenses/server'
import { getBatches } from '~/lib/batches/server'
import { getSuppliers } from '~/lib/suppliers/server'
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

interface Expense {
  id: string
  farmId: string
  category: string
  amount: string
  date: Date
  description: string
  supplierName: string | null
  batchSpecies: string | null
  batchType: string | null
  isRecurring: boolean
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface Supplier {
  id: string
  name: string
}

interface ExpensesSummary {
  byCategory: Record<string, { count: number; amount: number }>
  total: { count: number; amount: number }
}

interface ExpensesData {
  expenses: Array<Expense>
  summary: ExpensesSummary | null
  batches: Array<Batch>
  suppliers: Array<Supplier>
}

const getExpensesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string | null }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data?.farmId || undefined
      const [expenses, summary, batches, suppliers] = await Promise.all([
        getExpenses(session.user.id, farmId),
        getExpensesSummary(session.user.id, farmId),
        farmId ? getBatches(session.user.id, farmId) : Promise.resolve([]),
        getSuppliers(),
      ])
      return {
        expenses,
        summary,
        batches: batches.filter((b) => b.status === 'active'),
        suppliers,
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/expenses')({
  component: ExpensesPage,
})

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  feed: <Package className="h-4 w-4" />,
  medicine: <Pill className="h-4 w-4" />,
  equipment: <Wrench className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  labor: <Users className="h-4 w-4" />,
  transport: <Truck className="h-4 w-4" />,
  other: <Settings className="h-4 w-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  feed: 'text-orange-600 bg-orange-100',
  medicine: 'text-red-600 bg-red-100',
  equipment: 'text-blue-600 bg-blue-100',
  utilities: 'text-yellow-600 bg-yellow-100',
  labor: 'text-purple-600 bg-purple-100',
  transport: 'text-green-600 bg-green-100',
  other: 'text-gray-600 bg-gray-100',
}

function ExpensesPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<ExpensesData>({
    expenses: [],
    summary: null,
    batches: [],
    suppliers: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    category: 'feed' as string,
    batchId: '',
    supplierId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // View/Edit/Delete dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [editFormData, setEditFormData] = useState({
    category: '',
    amount: '',
    description: '',
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getExpensesDataForFarm({
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
      category: 'feed',
      batchId: '',
      supplierId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createExpenseFn({
        data: {
          expense: {
            farmId: selectedFarmId,
            batchId: formData.batchId || null,
            supplierId: formData.supplierId || null,
            category: formData.category as any,
            amount: parseFloat(formData.amount),
            description: formData.description,
            date: new Date(formData.date),
            isRecurring: formData.isRecurring,
          },
        },
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

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setViewDialogOpen(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setEditFormData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
    })
    setEditDialogOpen(true)
  }

  const handleDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExpense) return

    setIsSubmitting(true)
    try {
      await updateExpenseFn({
        data: {
          expenseId: selectedExpense.id,
          data: {
            category: editFormData.category,
            amount: parseFloat(editFormData.amount),
            description: editFormData.description,
          },
        },
      })
      setEditDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return

    setIsSubmitting(true)
    try {
      await deleteExpenseFn({ data: { expenseId: selectedExpense.id } })
      setDeleteDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { expenses, summary, batches, suppliers } = data

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || <Banknote className="h-4 w-4" />
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

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your farm expenses
          </p>
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
              <DialogDescription>Log a new expense</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    value &&
                    setFormData((prev) => ({
                      ...prev,
                      category: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          {getCategoryIcon(cat.value)}
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {batches.length > 0 && (
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
                          ? batches.find((b) => b.id === formData.batchId)
                            ?.species
                          : 'Select batch (optional)'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.species} ({batch.currentQuantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {suppliers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier (Optional)</Label>
                  <Select
                    value={formData.supplierId || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierId: value || '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.supplierId
                          ? suppliers.find((s) => s.id === formData.supplierId)
                            ?.name
                          : 'Select supplier'}
                      </SelectValue>
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

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What was this expense for?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isRecurring: e.target.checked,
                    }))
                  }
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
                    isSubmitting || !formData.amount || !formData.description
                  }
                >
                  {isSubmitting ? 'Recording...' : 'Record Expense'}
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
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Expenses
              </CardTitle>
              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-destructive">
                {formatNaira(summary.total.amount)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.total.count} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Feed
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.byCategory.feed?.amount || 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.byCategory.feed?.count || 0} purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Medicine
              </CardTitle>
              <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.byCategory.medicine?.amount || 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.byCategory.medicine?.count || 0} purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Labor
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.byCategory.labor?.amount || 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.byCategory.labor?.count || 0} payments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
            <p className="text-muted-foreground mb-4">
              Record your first expense
            </p>
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
            <CardDescription>Recent expense records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 ${CATEGORY_COLORS[expense.category] || 'bg-gray-100'}`}
                    >
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium capitalize truncate">
                        {expense.category}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {expense.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                    <div className="text-right">
                      <p className="font-medium text-destructive">
                        -{formatNaira(expense.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.supplierName || 'No supplier'}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 hidden sm:block">
                      {new Date(expense.date).toLocaleDateString()}
                    </Badge>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                        onClick={() => handleViewExpense(expense)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                        onClick={() => handleDeleteExpense(expense)}
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

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${CATEGORY_COLORS[selectedExpense.category] || 'bg-gray-100'}`}
                >
                  {getCategoryIcon(selectedExpense.category)}
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {selectedExpense.category}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedExpense.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg text-destructive">
                    -{formatNaira(selectedExpense.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-medium">
                    {selectedExpense.supplierName || 'None'}
                  </span>
                </div>
                {selectedExpense.batchSpecies && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Batch:</span>
                    <span>{selectedExpense.batchSpecies}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span>
                    {new Date(selectedExpense.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recurring:</span>
                  <span>{selectedExpense.isRecurring ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleEditExpense(selectedExpense)
                  }}
                >
                  Edit
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense information</DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) =>
                    value &&
                    setEditFormData((prev) => ({
                      ...prev,
                      category: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="edit-amount">Amount (₦)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.amount}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  required
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
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${CATEGORY_COLORS[selectedExpense.category] || 'bg-gray-100'}`}
                >
                  {getCategoryIcon(selectedExpense.category)}
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {selectedExpense.category}
                  </p>
                  <p className="text-sm text-destructive font-bold">
                    -{formatNaira(selectedExpense.amount)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
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

export default ExpensesPage
