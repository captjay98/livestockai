import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  ArrowLeft,
  Edit,
  Mail,
  MapPin,
  Package,
  Phone,
  Trash2,
} from 'lucide-react'
import {
  deleteSupplier,
  getSupplierWithExpenses,
} from '~/features/suppliers/server'
import { formatCurrency } from '~/features/settings/currency'

interface SupplierExpense {
  id: string
  date: Date
  category: string
  description: string
  amount: string
}

interface SupplierWithExpenses {
  id: string
  name: string
  phone: string
  email: string | null
  location: string | null
  supplierType: string | null
  products: Array<string>
  expenses: Array<SupplierExpense>
  totalSpent: number
  expenseCount: number
}

const fetchSupplier = createServerFn({ method: 'GET' })
  .inputValidator((data: { supplierId: string }) => data)
  .handler(async ({ data }) => {
    return getSupplierWithExpenses(data.supplierId)
  })

const removeSupplier = createServerFn({ method: 'POST' })
  .inputValidator((data: { supplierId: string }) => data)
  .handler(async ({ data }) => {
    await deleteSupplier(data.supplierId)
  })

export const Route = createFileRoute('/_auth/suppliers/$supplierId')({
  component: SupplierDetailPage,
  loader: ({ params }) =>
    fetchSupplier({ data: { supplierId: params.supplierId } }),
})

function SupplierDetailPage() {
  const supplier = // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  Route.useLoaderData() as SupplierWithExpenses | null
  const navigate = useNavigate()

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <p>Supplier not found</p>
        </main>
      </div>
    )
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      await removeSupplier({ data: { supplierId: supplier.id } })
      navigate({ to: '/suppliers' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Link
          to="/suppliers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Suppliers
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {supplier.name}
            </h1>
            <p className="text-muted-foreground mt-1">Supplier Details</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-10 px-4 min-h-[44px]">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-10 px-4 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                {supplier.phone}
              </div>
              {supplier.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                  {supplier.email}
                </div>
              )}
              {supplier.location && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                  {supplier.location}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4">Products Supplied</h2>
            {supplier.products.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {supplier.products.map((product) => (
                  <span
                    key={product}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm"
                  >
                    <Package className="h-3 w-3" />
                    {product}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No products listed
              </p>
            )}
          </div>

          <div className="bg-card rounded-lg border p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Purchase Summary</h2>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(supplier.totalSpent)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {supplier.expenseCount} purchases recorded
            </p>
          </div>

          {supplier.expenses.length > 0 && (
            <div className="bg-card rounded-lg border p-6 md:col-span-2">
              <h2 className="font-semibold mb-4">Recent Purchases</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Date</th>
                      <th className="text-left py-2 font-medium">Category</th>
                      <th className="text-left py-2 font-medium">
                        Description
                      </th>
                      <th className="text-right py-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.expenses.slice(0, 10).map((expense) => (
                      <tr key={expense.id} className="border-b last:border-0">
                        <td className="py-2">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 capitalize">{expense.category}</td>
                        <td className="py-2">{expense.description}</td>
                        <td className="py-2 text-right">
                          {formatCurrency(parseFloat(expense.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
