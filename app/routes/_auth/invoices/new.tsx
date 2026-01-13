import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { CreateInvoiceInput } from '~/features/invoices/server'
import { createInvoice } from '~/features/invoices/server'
import { getCustomers } from '~/features/customers/server'
import { getFarms } from '~/features/farms/server'
import { formatCurrency } from '~/features/settings/currency'

const fetchFormData = createServerFn({ method: 'GET' }).handler(async () => {
  const [customers, farms] = await Promise.all([getCustomers(), getFarms()])
  return { customers, farms }
})

const addInvoice = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateInvoiceInput) => data)
  .handler(async ({ data }) => {
    return createInvoice(data)
  })

export const Route = createFileRoute('/_auth/invoices/new')({
  component: NewInvoicePage,
  loader: () => fetchFormData(),
})

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

function NewInvoicePage() {
  const { customers, farms } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<Array<InvoiceItem>>([
    { description: '', quantity: 1, unitPrice: 0 },
  ])

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const dueDate = formData.get('dueDate') as string

    try {
      await addInvoice({
        data: {
          customerId: formData.get('customerId') as string,
          farmId: formData.get('farmId') as string,
          items: items.filter((item) => item.description && item.quantity > 0),
          dueDate: dueDate ? new Date(dueDate) : null,
          notes: (formData.get('notes') as string) || null,
        },
      })
      navigate({ to: '/invoices' })
    } catch (error) {
      console.error('Failed to create invoice:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate({ to: '/invoices' })}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Invoices
        </button>

        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8">
            Create Invoice
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="customerId" className="text-sm font-medium">
                  Customer *
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer: { id: string; name: string }) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="farmId" className="text-sm font-medium">
                  Farm *
                </label>
                <select
                  id="farmId"
                  name="farmId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select farm</option>
                  {farms.map((farm: { id: string; name: string }) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Invoice Items</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 md:grid-cols-12 items-end p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, 'description', e.target.value)
                        }
                        placeholder="Item description"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min="1"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Unit Price (₦)
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'unitPrice',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        min="0"
                        step="0.01"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end p-4 bg-muted rounded-lg">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Total: </span>
                  <span className="text-xl font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || items.every((i) => !i.description)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: '/invoices' })}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-10 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
