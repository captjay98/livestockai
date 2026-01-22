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
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type {
  PaginatedResult,
  SupplierRecord,
} from '~/features/suppliers/server'
import {
  createSupplierFn,
  getSuppliersPaginatedFn,
} from '~/features/suppliers/server'

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
import { PageHeader } from '~/components/page-header'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string | null
  location: string | null
  products: Array<string> | null
  supplierType: string | null
  totalSpent?: number
}

interface SupplierSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  supplierType?: string
  q?: string
}

const get_supplier_types = (t: any) => [
  {
    value: 'hatchery',
    label: t('suppliers:types.hatchery', { defaultValue: 'Hatchery' }),
  },
  {
    value: 'feed_mill',
    label: t('suppliers:types.feed_mill', { defaultValue: 'Feed Mill' }),
  },
  {
    value: 'fingerlings',
    label: t('suppliers:types.fingerlings', { defaultValue: 'Fingerlings' }),
  },
  {
    value: 'pharmacy',
    label: t('suppliers:types.pharmacy', { defaultValue: 'Pharmacy' }),
  },
  {
    value: 'equipment',
    label: t('suppliers:types.equipment', { defaultValue: 'Equipment' }),
  },
  {
    value: 'other',
    label: t('suppliers:types.other', { defaultValue: 'Other' }),
  },
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
      const { requireAuth } = await import('~/features/auth/server-middleware')
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
  const { t } = useTranslation(['suppliers', 'common'])
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { format: formatCurrency } = useFormatCurrency()
  const supplier_types = get_supplier_types(t)

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
      setPaginatedSuppliers(result.paginatedSuppliers)
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
      toast.success(
        t('suppliers:form.addSuccess', { defaultValue: 'Supplier added' }),
      )
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
      setError(
        err instanceof Error
          ? err.message
          : t('suppliers:error.create', {
              defaultValue: 'Failed to create supplier',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<Supplier>>>(
    () => [
      {
        accessorKey: 'name',
        header: t('suppliers:table.name'),
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
        header: t('suppliers:table.contact'),
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
        header: t('suppliers:table.location'),
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
        header: t('suppliers:table.type'),
        cell: ({ row }) =>
          row.original.supplierType ? (
            <Badge variant="outline" className="capitalize text-xs">
              {t(`suppliers:types.${row.original.supplierType}`)}
            </Badge>
          ) : (
            '-'
          ),
      },
      {
        accessorKey: 'products',
        header: t('suppliers:table.products'),
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
        header: t('suppliers:table.totalSpent'),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.totalSpent || 0)}
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
                {t('suppliers:table.view')}
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
      <PageHeader
        title={t('suppliers:title')}
        description={t('suppliers:description')}
        icon={Building2}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('suppliers:add')}
          </Button>
        }
      />

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
        searchPlaceholder={t('suppliers:search')}
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
              <SelectValue>
                {searchParams.supplierType
                  ? t(`suppliers:types.${searchParams.supplierType}`)
                  : t('suppliers:types.all')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('suppliers:types.all')}</SelectItem>
              {supplier_types.map((type) => (
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
        emptyTitle={t('suppliers:empty.title')}
        emptyDescription={t('suppliers:empty.desc')}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('suppliers:form.addTitle')}</DialogTitle>
            <DialogDescription>{t('suppliers:form.addDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('suppliers:form.name')}</Label>
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
              <Label htmlFor="phone">{t('suppliers:form.phone')}</Label>
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
              <Label htmlFor="email">{t('suppliers:form.email')}</Label>
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
              <Label htmlFor="location">{t('suppliers:form.location')}</Label>
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
              <Label htmlFor="supplierType">{t('suppliers:form.type')}</Label>
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
                  <SelectValue>
                    {formData.supplierType
                      ? supplier_types.find(
                          (s) => s.value === formData.supplierType,
                        )?.label
                      : t('suppliers:form.selectType')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {supplier_types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="products">{t('suppliers:form.products')}</Label>
              <Input
                id="products"
                value={formData.products}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    products: e.target.value,
                  }))
                }
                placeholder={t('suppliers:form.productsPlaceholder')}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t('suppliers:form.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.phone}
              >
                {isSubmitting ? t('common:saving') : t('suppliers:form.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
