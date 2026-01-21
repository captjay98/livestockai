import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type {
  CustomerRecord,
  PaginatedResult,
} from '~/features/customers/server'
import {
  createCustomerFn,
  getCustomersPaginatedFn,
  getTopCustomers,
  updateCustomerFn,
} from '~/features/customers/server'
import { useFormatCurrency } from '~/features/settings'
import { useFarm } from '~/features/farms/context'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
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
import { DataTable } from '~/components/ui/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { PageHeader } from '~/components/page-header'

interface TopCustomer {
  id: string
  name: string
  phone: string
  location: string | null
  salesCount: number
  totalSpent: number
}

interface CustomerSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  customerType?: string
}

const get_customer_types = (t: any) => [
  {
    value: 'individual',
    label: t('customers:types.individual', { defaultValue: 'Individual' }),
  },
  {
    value: 'restaurant',
    label: t('customers:types.restaurant', { defaultValue: 'Restaurant' }),
  },
  {
    value: 'retailer',
    label: t('customers:types.retailer', { defaultValue: 'Retailer' }),
  },
  {
    value: 'wholesaler',
    label: t('customers:types.wholesaler', { defaultValue: 'Wholesaler' }),
  },
]

const getCustomerData = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      customerType?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('~/features/auth/server-middleware')
      await requireAuth()
      const [paginatedCustomers, topCustomers] = await Promise.all([
        getCustomersPaginatedFn({
          data: {
            page: data.page,
            pageSize: data.pageSize,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder,
            search: data.search,
            customerType: data.customerType,
          },
        }),
        getTopCustomers(5),
      ])
      return { paginatedCustomers, topCustomers }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/_auth/customers/')({
  component: CustomersPage,
  validateSearch: (search: Record<string, unknown>): CustomerSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'createdAt',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: (search.q as string) || '',
    customerType:
      typeof search.customerType === 'string' ? search.customerType : undefined,
  }),
})

function CustomersPage() {
  const { t } = useTranslation(['customers', 'common'])
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { format: formatCurrency } = useFormatCurrency()
  const { selectedFarmId } = useFarm()
  const customer_types = get_customer_types(t)

  const [paginatedCustomers, setPaginatedCustomers] = useState<
    PaginatedResult<CustomerRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [topCustomers, setTopCustomers] = useState<Array<TopCustomer>>([])

  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    customerType: '' as
      | ''
      | 'individual'
      | 'restaurant'
      | 'retailer'
      | 'wholesaler',
  })

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    customerType: '' as
      | ''
      | 'individual'
      | 'restaurant'
      | 'retailer'
      | 'wholesaler',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getCustomerData({
        data: {
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          customerType: searchParams.customerType,
        },
      })
      setPaginatedCustomers(result.paginatedCustomers)
      setTopCustomers(result.topCustomers as Array<TopCustomer>)
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
    searchParams.customerType,
  ])

  const updateSearch = (updates: Partial<CustomerSearchParams>) => {
    navigate({
      search: (prev: CustomerSearchParams) => ({
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
      await createCustomerFn({
        data: {
          farmId: selectedFarmId ?? '',
          ...formData,
          email: formData.email || null,
          location: formData.location || null,
          customerType: formData.customerType || null,
        },
      })
      setDialogOpen(false)
      toast.success(
        t('customers:form.createSuccess', { defaultValue: 'Customer added' }),
      )
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        customerType: '',
      })
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('customers:errors.create', {
              defaultValue: 'Failed to create customer',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCustomer = (customer: CustomerRecord) => {
    setSelectedCustomer(customer)
    setEditFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      location: customer.location || '',
      customerType: (customer.customerType || '') as
        | ''
        | 'individual'
        | 'restaurant'
        | 'retailer'
        | 'wholesaler',
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setIsSubmitting(true)

    try {
      await updateCustomerFn({
        data: {
          id: selectedCustomer.id,
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
      toast.success(
        t('customers:messages.updated', { defaultValue: 'Customer updated' }),
      )
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<CustomerRecord>>>(
    () => [
      {
        accessorKey: 'name',
        header: t('customers:table.name'),
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
        header: t('customers:table.contact', { defaultValue: 'Contact' }),
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
        header: t('customers:table.location', { defaultValue: 'Location' }),
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
        accessorKey: 'customerType',
        header: t('customers:table.type', { defaultValue: 'Type' }),
        cell: ({ row }) =>
          row.original.customerType ? (
            <Badge variant="outline" className="capitalize text-xs">
              {t(`customers:types.${row.original.customerType}`)}
            </Badge>
          ) : (
            '-'
          ),
      },
      {
        accessorKey: 'salesCount',
        header: t('customers:table.orders'),
        cell: ({ row }) => row.original.salesCount,
      },
      {
        accessorKey: 'totalSpent',
        header: t('customers:table.totalSpent'),
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditCustomer(row.original)}
            >
              <Edit className="h-4 w-4" />
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
        title={t('customers:title')}
        description={t('customers:description')}
        icon={Users}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('customers:add')}
          </Button>
        }
      />

      {/* Top Customers */}
      {topCustomers.length > 0 &&
        searchParams.page === 1 &&
        !searchParams.q && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('customers:top.title')}
              </CardTitle>
              <CardDescription>{t('customers:top.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    style={{ borderColor: index === 0 ? '#fbbf24' : undefined }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={index === 0 ? 'default' : 'outline'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-500 text-white hover:bg-yellow-600' : ''}`}
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.salesCount} {t('customers:top.purchases')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('customers:top.spent')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      <DataTable
        columns={columns}
        data={paginatedCustomers.data}
        total={paginatedCustomers.total}
        page={paginatedCustomers.page}
        pageSize={paginatedCustomers.pageSize}
        totalPages={paginatedCustomers.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q || ''}
        searchPlaceholder={t('customers:search')}
        isLoading={isLoading}
        filters={
          <Select
            value={searchParams.customerType || 'all'}
            onValueChange={(value: string) => {
              updateSearch({
                customerType: value === 'all' || !value ? undefined : value,
                page: 1,
              })
            }}
          >
            <SelectTrigger className="w-[150px] h-10">
              <SelectValue>
                {searchParams.customerType === undefined
                  ? t('customers:types.all')
                  : t(`customers:types.${searchParams.customerType}`, {
                      defaultValue:
                        searchParams.customerType.charAt(0).toUpperCase() +
                        searchParams.customerType.slice(1),
                    })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('customers:types.all')}</SelectItem>
              {customer_types.map((type) => (
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
        emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('customers:empty.title')}
        emptyDescription={t('customers:empty.desc')}
      />

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('customers:form.addTitle')}</DialogTitle>
            <DialogDescription>{t('customers:form.addDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('customers:form.name')}</Label>
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
              <Label htmlFor="phone">{t('customers:form.phone')}</Label>
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
              <Label htmlFor="location">{t('customers:form.location')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerType">{t('customers:form.type')}</Label>
              <Select
                value={formData.customerType}
                onValueChange={(value: string | null) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerType: value as typeof formData.customerType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.customerType
                      ? customer_types.find(
                          (item) => item.value === formData.customerType,
                        )?.label
                      : t('customers:form.selectType', {
                          defaultValue: 'Select type',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customer_types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('customers:form.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t('customers:form.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name}>
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('customers:form.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('customers:form.editTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('customers:form.name')}</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t('customers:form.phone')}</Label>
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
              <Label htmlFor="edit-location">
                {t('customers:form.location')}
              </Label>
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
              <Label htmlFor="edit-customerType">
                {t('customers:form.type')}
              </Label>
              <Select
                value={editFormData.customerType}
                onValueChange={(value: string | null) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    customerType: value as typeof editFormData.customerType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {editFormData.customerType
                      ? customer_types.find(
                          (item) => item.value === editFormData.customerType,
                        )?.label
                      : t('customers:form.selectType', {
                          defaultValue: 'Select type',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customer_types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t('customers:form.email')}</Label>
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('customers:form.save', { defaultValue: 'Save Changes' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
