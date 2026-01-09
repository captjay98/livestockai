import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Building2, Mail, MapPin, Package, Phone, Plus } from 'lucide-react'
import { useState } from 'react'
import { createSupplier, getSuppliers } from '~/lib/suppliers/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string | null
  location: string | null
  products: Array<string> | null
}

const fetchSuppliers = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    await requireAuth()
    return getSuppliers()
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const createSupplierAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      name: string
      phone: string
      email?: string
      location?: string
      products?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      await requireAuth()
      await createSupplier({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        location: data.location || null,
        products: data.products
          ? data.products.split(',').map((p) => p.trim())
          : [],
      })
      return { success: true }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/suppliers')({
  component: SuppliersPage,
  loader: () => fetchSuppliers(),
})

function SuppliersPage() {
  const router = useRouter()
  const suppliers = Route.useLoaderData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    products: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      location: '',
      products: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createSupplierAction({ data: formData })
      setDialogOpen(false)
      resetForm()
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your feed and livestock suppliers
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
              <DialogDescription>Add a new supplier profile</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Business or contact name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="e.g., 08012345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="supplier@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Based in..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="products">Products Provided (Optional)</Label>
                <Input
                  id="products"
                  value={formData.products}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      products: e.target.value,
                    }))
                  }
                  placeholder="e.g., Feed, Chicks, Medicine (comma separated)"
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
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.phone}
                >
                  {isSubmitting ? 'Adding...' : 'Add Supplier'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg glass">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No suppliers yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first supplier to track purchases
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              to={`/suppliers/${supplier.id}`}
              className="block p-4 sm:p-6 glass rounded-xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg group shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {supplier.name}
                  </h3>
                  {supplier.location && (
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {supplier.location}
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {supplier.phone}
                </div>
                {supplier.email && (
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {supplier.email}
                  </div>
                )}
                {supplier.products && supplier.products.length > 0 && (
                  <div className="flex items-start text-muted-foreground pt-2 border-t mt-3">
                    <Package className="h-4 w-4 mr-2 mt-0.5" />
                    <span>{supplier.products.join(', ')}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
