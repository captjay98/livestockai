import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import type {CreateExpenseInput} from '~/lib/expenses/server';
import {  EXPENSE_CATEGORIES, createExpenseFn } from '~/lib/expenses/server'
import { getSuppliersFn } from '~/lib/suppliers/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface ExpenseActionData {
  farmId: string
  category: CreateExpenseInput['category']
  amount: number
  date: string
  description: string
  supplierId?: string
  isRecurring?: boolean
}



const getFormData = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    await requireAuth()
    const suppliers = await getSuppliersFn()
    return { suppliers }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const createExpenseAction = createServerFn({ method: 'POST' })
  .inputValidator((data: ExpenseActionData) => data)
  .handler(async ({ data }) => {
    try {
      await createExpenseFn({
        data: {
          expense: {
            farmId: data.farmId,
            category: data.category,
            amount: data.amount,
            date: new Date(data.date),
            description: data.description,
            supplierId: data.supplierId || null,
            isRecurring: data.isRecurring || false,
          },
        },
      })
      return { success: true }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface NewExpenseSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/expenses/new')({
  component: NewExpensePage,
  validateSearch: (
    search: Record<string, unknown>,
  ): NewExpenseSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loader: () => getFormData(),
})

function NewExpensePage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { suppliers } = Route.useLoaderData()

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    supplierId: '',
    isRecurring: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.farmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createExpenseAction({
        data: {
          farmId: search.farmId,
          category: formData.category as CreateExpenseInput['category'],
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description,
          supplierId: formData.supplierId || undefined,
          isRecurring: formData.isRecurring,
        },
      })
      toast.success('Expense recorded successfully!')
      router.navigate({ to: '/expenses', search: { farmId: search.farmId } })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to record expense'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Expense</h1>
          <p className="text-muted-foreground mt-1">
            Log a new expense transaction
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Enter the expense information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  value && setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.category
                      ? EXPENSE_CATEGORIES.find(
                          (c) => c.value === formData.category,
                        )?.label
                      : 'Select category'}
                  </SelectValue>
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g., 50 bags of starter feed"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>

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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.history.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.category ||
                  !formData.amount ||
                  !formData.description
                }
              >
                {isSubmitting ? 'Recording...' : 'Record Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
