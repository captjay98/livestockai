import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSuppliers } from '~/lib/suppliers/server'
import { Header } from '~/components/navigation'
import { Building2, Plus, Phone, MapPin, Package } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string | null
  location: string | null
  products: string[] | null
}

const fetchSuppliers = createServerFn({ method: 'GET' }).handler(async () => {
  return getSuppliers()
})

export const Route = createFileRoute('/suppliers')({
  component: SuppliersPage,
  loader: () => fetchSuppliers(),
})

function SuppliersPage() {
  const suppliers = Route.useLoaderData() as Supplier[]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground mt-1">Manage your feed and livestock suppliers</p>
          </div>
          <Link
            to="/suppliers/new"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Link>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No suppliers yet</h3>
            <p className="text-muted-foreground mb-4">Add your first supplier to track purchases</p>
            <Link
              to="/suppliers/new"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <Link
                key={supplier.id}
                to={`/suppliers/${supplier.id}`}
                className="block p-6 bg-card rounded-lg border hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{supplier.name}</h3>
                    {supplier.location && (
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {supplier.location}
                      </p>
                    )}
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {supplier.phone}
                  </div>
                  {supplier.products && supplier.products.length > 0 && (
                    <div className="flex items-start text-muted-foreground">
                      <Package className="h-4 w-4 mr-2 mt-0.5" />
                      <span>{supplier.products.join(', ')}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}