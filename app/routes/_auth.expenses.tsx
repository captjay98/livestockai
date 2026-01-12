import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  Banknote,
  Bird,
  Edit,
  Eye,
  Fish,
  Hammer,
  Megaphone,
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
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/lib/expenses/server'
import {
  EXPENSE_CATEGORIES,
  createExpenseFn,
  deleteExpenseFn,
  getExpensesPaginated,
  getExpensesSummary,
  updateExpenseFn,
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
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/components/farm-context'

interface Expense {
  id: string
  farmId: string
  farmName: string | null
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

// Search params type
interface ExpenseSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  category?: string
}

const getExpensesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      category?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedExpenses, summary, batches, suppliers] =
        await Promise.all([
          getExpensesPaginated(session.user.id, {
            farmId,
            page: data.page || 1,
            pageSize: data.pageSize || 25,
            sortBy: data.sortBy || 'date',
            sortOrder: data.sortOrder || 'desc',
            search: data.search,
            category: data.category,
          }),
          getExpensesSummary(session.user.id, farmId),
          farmId ? getBatches(session.user.id, farmId) : Promise.resolve([]),
          getSuppliers(),
        ])
      return {
        paginatedExpenses,
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

export const Route = createFileRoute('/_auth/expenses')({
  validateSearch: (search: Record<string, unknown>): ExpenseSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: typeof search.sortBy === 'string' ? search.sortBy : 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
        (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    category: typeof search.category === 'string' ? search.category : undefined,
  }),
  component: ExpensesPage,
})

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  feed: <Package className="h-4 w-4" />,
  medicine: <Pill className="h-4 w-4" />,
  equipment: <Wrench className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  labor: <Users className="h-4 w-4" />,
  transport: <Truck className="h-4 w-4" />,
  livestock: <Bird className="h-4 w-4" />,
  livestock_chicken: <Bird className="h-4 w-4" />,
  livestock_fish: <Fish className="h-4 w-4" />,
  maintenance: <Hammer className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  other: <Settings className="h-4 w-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  feed: 'text-primary bg-primary/10',
  medicine: 'text-destructive bg-destructive/10',
  equipment: 'text-info bg-info/10',
  utilities: 'text-warning bg-warning/10',
  labor: 'text-purple bg-purple/10',
  transport: 'text-success bg-success/10',
  livestock: 'text-warning bg-warning/10',
  livestock_chicken: 'text-primary bg-primary/10',
  livestock_fish: 'text-info bg-info/10',
  maintenance: 'text-slate bg-slate/10',
  marketing: 'text-purple bg-purple/10',
  other: 'text-muted-foreground bg-muted',
}

function ExpensesPage() {
  const { selectedFarmId } = useFarm()
  const navigate = useNavigate({ from: '/expenses' })
  const searchParams = Route.useSearch()

  const [paginatedExpenses, setPaginatedExpenses] = useState<
    PaginatedResult<Expense>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    batches: [], // Add missing property or ignore if not strict
  })
  /* ... context omitted ... */
  // Table columns
  const columns: Array<ColumnDef<Expense>> = [
    {
      accessorKey: 'category',
      header: 'Category',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${CATEGORY_COLORS[row.original.category] || 'bg-muted'}`}
          >
            {getCategoryIcon(row.original.category)}
          </div>
          <span className="capitalize font-medium">
            {row.original.category}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-destructive">
          -{formatNaira(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline">
          {new Date(row.original.date).toLocaleDateString()}
        </Badge>
      ),
    },
    {
      accessorKey: 'supplierName',
      header: 'Supplier',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.supplierName || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewExpense(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditExpense(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteExpense(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

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
                          : 'Select supplier (optional)'}
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

              <div className="grid grid-cols-2 gap-4">
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
                    placeholder="0.00"
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
                      setFormData((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
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
                  placeholder="Brief description"
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
                  className="h-4 w-4"
                />
                <Label htmlFor="isRecurring" className="text-sm">
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
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Expenses
              </CardTitle>
              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-destructive">
                {formatNaira(summary.total.amount)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {summary.total.count} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Feed
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(
                  'feed' in summary.byCategory
                    ? summary.byCategory.feed.amount
                    : 0,
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {'feed' in summary.byCategory
                  ? summary.byCategory.feed.count
                  : 0}{' '}
                purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Livestock
              </CardTitle>
              <div className="flex -space-x-1">
                <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(
                  ('livestock_chicken' in summary.byCategory
                    ? summary.byCategory.livestock_chicken.amount
                    : 0) +
                  ('livestock_fish' in summary.byCategory
                    ? summary.byCategory.livestock_fish.amount
                    : 0),
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {('livestock_chicken' in summary.byCategory
                  ? summary.byCategory.livestock_chicken.count
                  : 0) +
                  ('livestock_fish' in summary.byCategory
                    ? summary.byCategory.livestock_fish.count
                    : 0)}{' '}
                purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Labor
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(
                  'labor' in summary.byCategory
                    ? summary.byCategory.labor.amount
                    : 0,
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {'labor' in summary.byCategory
                  ? summary.byCategory.labor.count
                  : 0}{' '}
                payments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedExpenses.data}
        total={paginatedExpenses.total}
        page={paginatedExpenses.page}
        pageSize={paginatedExpenses.pageSize}
        totalPages={paginatedExpenses.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder="Search expenses..."
        isLoading={isLoading}
        filters={
          <Select
            value={searchParams.category || 'all'}
            onValueChange={(value) => {
              updateSearch({
                category: value === 'all' ? undefined : value,
                page: 1,
              })
            }}
          >
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(CATEGORY_ICONS).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <div className="flex items-center gap-2 capitalize">
                    {CATEGORY_ICONS[cat]}
                    {cat}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyIcon={<Banknote className="h-12 w-12" />}
        emptyTitle="No expenses yet"
        emptyDescription="Record your first expense to get started."
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(q) => {
          updateSearch({ q, page: 1 })
        }}
      />

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
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${CATEGORY_COLORS[selectedExpense.category] || 'bg-muted'}`}
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
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleDeleteExpense(selectedExpense)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
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
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCategory">Category</Label>
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
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(cat.value)}
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAmount">Amount (₦)</Label>
              <Input
                id="editAmount"
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
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
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
                  <p className="text-sm text-muted-foreground">
                    {formatNaira(selectedExpense.amount)} -{' '}
                    {selectedExpense.description}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
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
