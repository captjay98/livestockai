import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { createSupplier, type CreateSupplierInput } from '~/lib/suppliers/server'
import { ArrowLeft, X } from 'lucide-react'

const addSupplier = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateSupplierInput) => data)
  .handler(async ({ data }) => {
    return createSupplier(data)
  })

export const Route = createFileRoute('/suppliers/new')({
  component: NewSupplierPage,
})

function NewSupplierPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<string[]>([])
  const [newProduct, setNewProduct] = useState('')

  const addProduct = () => {
    if (newProduct.trim() && !products.includes(newProduct.trim())) {
      setProducts([...products, newProduct.trim()])
      setNewProduct('')
    }
  }

  const removeProduct = (product: string) => {
    setProducts(products.filter(p => p !== product))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      await addSupplier({
        data: {
          name: formData.get('name') as string,
          phone: formData.get('phone') as string,
          email: formData.get('email') as string || null,
          location: formData.get('location') as string || null,
          products,
        }
      })
      navigate({ to: '/suppliers' })
    } catch (error) {
      console.error('Failed to create supplier:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate({ to: '/suppliers' })}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Suppliers
        </button>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Add Supplier</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Supplier Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter supplier name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="08012345678"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="supplier@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="City, State"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Products Supplied</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Feed, Day-old chicks"
                />
                <button
                  type="button"
                  onClick={addProduct}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-10 px-4"
                >
                  Add
                </button>
              </div>
              {products.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {products.map((product) => (
                    <span
                      key={product}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                    >
                      {product}
                      <button
                        type="button"
                        onClick={() => removeProduct(product)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Supplier'}
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: '/suppliers' })}
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