import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft, Edit, Mail, MapPin, Phone, Trash2 } from 'lucide-react'
import {
  deleteCustomer,
  getCustomerWithSales,
  updateCustomer,
} from '~/lib/customers/server'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface Sale {
  id: string
  date: string
  livestockType: string
  quantity: number
  unitPrice: string
  totalAmount: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  location: string | null
  customerType: 'individual' | 'restaurant' | 'retailer' | 'wholesaler' | null
  totalSpent: number
  salesCount: number
  sales: Array<Sale>
}

const fetchCustomer = createServerFn({ method: 'GET' })
  .inputValidator((data: { customerId: string }) => data)
  .handler(async ({ data }) => {
    return getCustomerWithSales(data.customerId)
  })

const removeCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: { customerId: string }) => data)
  .handler(async ({ data }) => {
    await deleteCustomer(data.customerId)
  })

const updateCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { customerId: string; data: any }) => data)
  .handler(async ({ data }) => {
    await updateCustomer(data.customerId, data.data)
  })

export const Route = createFileRoute('/_auth/customers/$customerId')({
  component: CustomerDetailPage,
  loader: ({ params }) =>
    fetchCustomer({ data: { customerId: params.customerId } }),
})

function CustomerDetailPage() {
  const customer = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    location: customer?.location || '',
    customerType: customer?.customerType || '',
  })

  if (!customer) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-2">
                Customer Not Found
              </h2>
              <p className="text-muted-foreground mb-6">
                The customer you're looking for doesn't exist or may have been
                deleted.
              </p>
              <Button onClick={() => navigate({ to: '/customers' })}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await removeCustomer({ data: { customerId: customer.id } })
      navigate({ to: '/customers' })
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateCustomerFn({
        data: {
          customerId: customer.id,
          data: {
            name: editFormData.name,
            phone: editFormData.phone,
            email: editFormData.email || null,
            location: editFormData.location || null,
            customerType: editFormData.customerType || null,
          },
        },
      })
      setEditDialogOpen(false)
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Link
          to="/customers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
                {customer.name}
              </h1>
              {customer.customerType && (
                <Badge variant="outline" className="capitalize">
                  {customer.customerType}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">Customer Details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                {customer.phone}
              </div>
              {customer.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                  {customer.email}
                </div>
              )}
              {customer.location && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                  {customer.location}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Purchase Summary</h2>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNaira(customer.totalSpent)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.salesCount} purchases recorded
            </p>
          </div>

          {customer.sales && customer.sales.length > 0 && (
            <div className="bg-card rounded-lg border p-6 md:col-span-2">
              <h2 className="font-semibold mb-4">Recent Purchases</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Date</th>
                      <th className="text-left py-2 font-medium">Type</th>
                      <th className="text-right py-2 font-medium">Quantity</th>
                      <th className="text-right py-2 font-medium">
                        Unit Price
                      </th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.sales.slice(0, 10).map((sale) => (
                      <tr key={sale.id} className="border-b last:border-0">
                        <td className="py-2">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 capitalize">
                          {sale.livestockType}
                        </td>
                        <td className="py-2 text-right">{sale.quantity}</td>
                        <td className="py-2 text-right">
                          {formatNaira(parseFloat(sale.unitPrice))}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {formatNaira(parseFloat(sale.totalAmount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-customerType">Customer Type</Label>
                <Select
                  value={editFormData.customerType}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      customerType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !editFormData.name || !editFormData.phone
                  }
                >
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
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {customer.name}? This action
                cannot be undone.
                {customer.salesCount > 0 && (
                  <span className="block mt-2 text-destructive">
                    Warning: This customer has {customer.salesCount} sales
                    records.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
