import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Building2, Eye, Mail, MapPin, Phone, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type {
  PaginatedResult,
  SupplierRecord,
} from '~/features/suppliers/server'
import {
  createSupplierFn,
  getSuppliersPaginatedFn,
} from '~/features/suppliers/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { Button } from '~/components/ui/button'
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
import { Badge } from '~/components/ui/badge'
import { DataTable } from '~/components/ui/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useFormatCurrency } from '~/features/settings'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string | null
  location: string | null
  products: Array<string> | null
  supplierType: string | null
  totalSpent: number
}

interface SupplierSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  supplierType?: string
}

const SUPPLIER_TYPES = [
  { value: 'hatchery', label: 'Hatchery' },
  { value: 'feed_mill', label: 'Feed Mill' },
  { value: 'fingerlings', label: 'Fingerlings' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
]

const getSupplierData = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      supplierType?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      await requireAuth()
      const paginatedSuppliers = await getSuppliersPaginatedFn({
        data: {
          page: data.page,
          pageSize: data.pageSize,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          search: data.search,
          supplierType: data.supplierType,
        },
      })
      return { paginatedSuppliers }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/_auth/suppliers/')({
  component: SuppliersPage,
  validateSearch: (search: Record<string, unknown>): SupplierSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'totalSpent',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    supplierType:
      typeof search.supplierType === 'string' ? search.supplierType : undefined,
  }),
})

function SuppliersPage() {
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { format: formatCurrency } = useFormatCurrency()

  const [paginatedSuppliers, setPaginatedSuppliers] = useState<
    PaginatedResult<SupplierRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    products: '',
    supplierType: '' as
      | ''
      | 'hatchery'
      | 'feed_mill'
      | 'pharmacy'
      | 'equipment'
      | 'fingerlings'
      | 'other',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getSupplierData({
        data: {
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          supplierType: searchParams.supplierType,
        },
      })
      setPaginatedSuppliers(
        result.paginatedSuppliers as PaginatedResult<SupplierRecord>,
      )
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.supplierType,
  ])

  const updateSearch = (updates: Partial<SupplierSearchParams>) => {
    navigate({
      search: (prev: SupplierSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await createSupplierFn({
        data: {
          ...formData,
          products: formData.products
            ? formData.products.split(',').map((p) => p.trim())
            : [],
          email: formData.email || null,
          location: formData.location || null,
          supplierType: formData.supplierType || null,
        },
      })
      setDialogOpen(false)
      toast.success('Supplier added')
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        products: '',
        supplierType: '',
      })
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<Supplier>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground md:hidden">
              {row.original.phone}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Contact',
        cell: ({ row }) => (
          <div className="flex flex-col text-sm">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {row.original.phone}
            </div>
            {row.original.email && (
              <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                <Mail className="h-3 w-3" />
                {row.original.email}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) =>
          row.original.location ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {row.original.location}
            </div>
          ) : (
            '-'
          ),
      },
      {
        accessorKey: 'supplierType',
        header: 'Type',
        cell: ({ row }) =>
          row.original.supplierType ? (
            <Badge variant="outline" className="capitalize text-xs">
              {row.original.supplierType.replace('_', ' ')}
            </Badge>
          ) : (
            '-'
          ),
      },
      {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.products?.slice(0, 3).map((product, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] px-1 py-0 h-5"
              >
                {product}
              </Badge>
            ))}
            {row.original.products && row.original.products.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{row.original.products.length - 3}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'totalSpent',
        header: 'Total Spent',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.totalSpent)}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link
                to="/suppliers/$supplierId"
                params={{ supplierId: row.original.id }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your feed and livestock suppliers
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedSuppliers.data}
        total={paginatedSuppliers.total}
        page={paginatedSuppliers.page}
        pageSize={paginatedSuppliers.pageSize}
        totalPages={paginatedSuppliers.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder="Search suppliers..."
        isLoading={isLoading}
        filters={
          <Select
            value={searchParams.supplierType || 'all'}
            onValueChange={(value) => {
              updateSearch({
                supplierType:
                  value === 'all' || value === null ? undefined : value,
                page: 1,
              })
            }}
          >
            <SelectTrigger className="w-[150px] h-10">
              <SelectValue>All Types</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {SUPPLIER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(q) => {
          updateSearch({ q, page: 1 })
        }}
        emptyIcon={<Building2 className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No suppliers"
        emptyDescription="Add suppliers to track your purchases."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierType">Supplier Type</Label>
              <Select
                value={formData.supplierType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    supplierType: value as typeof formData.supplierType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>Select type</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hatchery">Hatchery</SelectItem>
                  <SelectItem value="feed_mill">Feed Mill</SelectItem>
                  <SelectItem value="fingerlings">Fingerlings</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="products">Products (comma separated)</Label>
              <Input
                id="products"
                value={formData.products}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    products: e.target.value,
                  }))
                }
                placeholder="e.g. Feed, Medicine"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.phone}
              >
                Add Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
