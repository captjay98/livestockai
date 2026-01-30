import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit,
  Mail,
  MapPin,
  Phone,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  deleteCustomerFn,
  getCustomerWithSalesFn,
  updateCustomerFn,
} from '~/features/customers/server'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { CustomerDetailSkeleton } from '~/components/customers/customer-detail-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/customers/$customerId')({
  loader: ({ params }) =>
    getCustomerWithSalesFn({ data: { customerId: params.customerId } }),
  pendingComponent: CustomerDetailSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const { t } = useTranslation(['customers', 'common'])
  const customer = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t('customers:notFound', {
              defaultValue: 'Customer Not Found',
            })}
          </h1>
          <Button asChild>
            <Link to="/customers">
              {t('customers:back', {
                defaultValue: 'Back to Customers',
              })}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editFormData, setEditFormData] = useState<{
    name: string
    phone: string
    email: string
    location: string
    customerType: 'individual' | 'restaurant' | 'retailer' | 'wholesaler' | ''
  }>({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    location: customer.location || '',
    customerType: customer.customerType as
      | 'individual'
      | 'restaurant'
      | 'retailer'
      | 'wholesaler'
      | '',
  })

  // Customer types helper
  const customer_types = [
    { value: 'individual', label: t('customers:types.individual') },
    { value: 'restaurant', label: t('customers:types.restaurant') },
    { value: 'retailer', label: t('customers:types.retailer') },
    { value: 'wholesaler', label: t('customers:types.wholesaler') },
  ]

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await deleteCustomerFn({ data: { id: customer.id } })
      toast.success(
        t('customers:messages.deleted', {
          defaultValue: 'Customer deleted',
        }),
      )
      navigate({ to: '/customers' })
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('customers:errors.delete', {
              defaultValue: 'Failed to delete customer',
            }),
      )
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
          id: customer.id,
          data: {
            name: editFormData.name,
            phone: editFormData.phone,
            email: editFormData.email || null,
            location: editFormData.location || null,
            customerType: editFormData.customerType || null,
          },
        },
      })
      toast.success(
        t('customers:messages.updated', {
          defaultValue: 'Customer updated',
        }),
      )
      setEditDialogOpen(false)
      router.invalidate()
    } catch (err) {
      toast.error(
        t('customers:messages.updateFailed', {
          defaultValue: 'Failed to update customer',
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="space-y-6">
        <Link
          to="/customers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('customers:back', { defaultValue: 'Back to Customers' })}
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
                {customer.name}
              </h1>
              {customer.customerType && (
                <Badge variant="outline" className="capitalize">
                  {t(`customers:types.${customer.customerType}`, {
                    defaultValue: customer.customerType,
                  })}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {t('customers:details.title', {
                defaultValue: 'Customer Details',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
              className="glass border-white/20 dark:border-white/10"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('customers:details.edit', {
                defaultValue: 'Edit',
              })}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white glass-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('customers:details.delete', {
                defaultValue: 'Delete',
              })}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />

            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('customers:details.contactInfo', {
                defaultValue: 'Contact Information',
              })}
            </h2>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-4">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                    Phone
                  </p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-center p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/10">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-4">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                      Email
                    </p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.location && (
                <div className="flex items-center p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/10">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-4">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                      Location
                    </p>
                    <p className="font-medium">{customer.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl translate-y-10 -translate-x-10 pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                {t('customers:details.purchaseSummary', {
                  defaultValue: 'Purchase Summary',
                })}
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center py-6 relative z-10">
              <div className="w-32 h-32 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border-4 border-green-500/5 group-hover:scale-110 transition-transform duration-500">
                <span className="text-3xl font-black text-green-600 dark:text-green-400">
                  {formatCurrency(customer.totalSpent).split('.')[0]}
                  <span className="text-sm opacity-50">
                    .{formatCurrency(customer.totalSpent).split('.')[1] || '00'}
                  </span>
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                {t('customers:table.totalSpent', {
                  defaultValue: 'Total Spent',
                })}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-center relative z-10">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">
                  {customer.salesCount}
                </span>{' '}
                {t('customers:details.purchasesRecorded', {
                  defaultValue: 'purchases recorded',
                })}
              </p>
            </div>
          </div>

          {customer.sales.length > 0 && (
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden md:col-span-2">
              <h2 className="font-bold text-lg mb-6">
                {t('customers:details.recentPurchases', {
                  defaultValue: 'Recent Purchases',
                })}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        {t('customers:table.date', {
                          defaultValue: 'Date',
                        })}
                      </th>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        {t('customers:table.type', {
                          defaultValue: 'Type',
                        })}
                      </th>
                      <th className="text-right py-3 px-2 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        {t('customers:table.quantity', {
                          defaultValue: 'Quantity',
                        })}
                      </th>
                      <th className="text-right py-3 px-2 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        {t('customers:table.unitPrice', {
                          defaultValue: 'Unit Price',
                        })}
                      </th>
                      <th className="text-right py-3 px-2 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        {t('customers:table.total', {
                          defaultValue: 'Total',
                        })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.sales.slice(0, 10).map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-dashed border-white/10 last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium">
                          {formatDate(sale.date)}
                        </td>
                        <td className="py-3 px-2 capitalize">
                          <Badge
                            variant="secondary"
                            className="bg-white/20 dark:bg-white/5 font-normal"
                          >
                            {sale.livestockType}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {sale.quantity}
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          {formatCurrency(parseFloat(sale.unitPrice))}
                        </td>
                        <td className="py-3 px-2 text-right font-bold">
                          {formatCurrency(parseFloat(sale.totalAmount))}
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
          <DialogContent className="sm:max-w-lg bg-white/80 dark:bg-black/80 backdrop-blur-xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('customers:form.editTitle', {
                  defaultValue: 'Edit Customer',
                })}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  {t('customers:form.name', {
                    defaultValue: 'Name',
                  })}
                </Label>
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
                <Label htmlFor="edit-phone">
                  {t('customers:form.phone', {
                    defaultValue: 'Phone',
                  })}
                </Label>
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
                <Label htmlFor="edit-email">
                  {t('customers:form.email', {
                    defaultValue: 'Email',
                  })}
                </Label>
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
                <Label htmlFor="edit-location">
                  {t('customers:form.location', {
                    defaultValue: 'Location',
                  })}
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
                  {t('customers:form.type', {
                    defaultValue: 'Customer Type',
                  })}
                </Label>
                <Select
                  value={editFormData.customerType}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      customerType: value || '',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {editFormData.customerType
                        ? customer_types.find(
                            (item) => item.value === editFormData.customerType,
                          )?.label || editFormData.customerType
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  {t('common:cancel', {
                    defaultValue: 'Cancel',
                  })}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !editFormData.name || !editFormData.phone
                  }
                >
                  {isSubmitting
                    ? t('common:saving', {
                        defaultValue: 'Saving...',
                      })
                    : t('customers:form.save', {
                        defaultValue: 'Save Changes',
                      })}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-white/80 dark:bg-black/80 backdrop-blur-xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('customers:dialog.deleteTitle', {
                  defaultValue: 'Delete Customer',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('customers:dialog.deleteDesc', {
                  defaultValue: 'Are you sure you want to delete {{name}}?',
                  name: customer.name,
                })}
                {customer.salesCount > 0 && (
                  <span className="block mt-2 text-destructive">
                    {t('customers:dialog.deleteWarning', {
                      defaultValue:
                        'Warning: This customer has {{count}} sales records.',
                      count: customer.salesCount,
                    })}
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
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t('common:deleting', {
                      defaultValue: 'Deleting...',
                    })
                  : t('common:delete', {
                      defaultValue: 'Delete',
                    })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
