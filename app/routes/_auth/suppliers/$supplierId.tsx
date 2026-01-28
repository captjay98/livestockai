import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Edit,
    Mail,
    MapPin,
    Package,
    Phone,
    Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
    deleteSupplierFn,
    getSupplierWithExpenses,
} from '~/features/suppliers/server'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/_auth/suppliers/$supplierId')({
    component: SupplierDetailPage,
    loader: async ({ params }) => {
        return getSupplierWithExpenses(params.supplierId)
    },
})

function SupplierDetailPage() {
    const { t } = useTranslation(['suppliers', 'common'])
    const supplier = Route.useLoaderData()
    const navigate = useNavigate()
    const { format: formatCurrency } = useFormatCurrency()
    const { format: formatDate } = useFormatDate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    if (!supplier) {
        return (
            <div className="min-h-screen bg-background">
                <main className="space-y-6">
                    <p>
                        {t('suppliers:notFound', {
                            defaultValue: 'Supplier not found',
                        })}
                    </p>
                </main>
            </div>
        )
    }

    const handleDeleteConfirm = async () => {
        try {
            await deleteSupplierFn({ data: { id: supplier.id } })
            toast.success(
                t('suppliers:messages.deleted', {
                    defaultValue: 'Supplier deleted',
                }),
            )
            navigate({ to: '/suppliers' })
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : t('suppliers:errors.delete', {
                          defaultValue: 'Failed to delete supplier',
                      }),
            )
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="space-y-6">
                <Link
                    to="/suppliers"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t('suppliers:back', { defaultValue: 'Back to Suppliers' })}
                </Link>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {supplier.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {t('suppliers:details.title', {
                                defaultValue: 'Supplier Details',
                            })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-10 px-4 min-h-[44px]">
                            <Edit className="h-4 w-4 mr-2" />
                            {t('suppliers:details.edit', {
                                defaultValue: 'Edit',
                            })}
                        </button>
                        <button
                            onClick={() => setDeleteDialogOpen(true)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-10 px-4 min-h-[44px]"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('suppliers:details.delete', {
                                defaultValue: 'Delete',
                            })}
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="bg-card rounded-lg border p-6">
                        <h2 className="font-semibold mb-4">
                            {t('suppliers:details.contactInfo', {
                                defaultValue: 'Contact Information',
                            })}
                        </h2>
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
                        <h2 className="font-semibold mb-4">
                            {t('suppliers:details.productsSupplied', {
                                defaultValue: 'Products Supplied',
                            })}
                        </h2>
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
                                {t('suppliers:details.noProducts', {
                                    defaultValue: 'No products listed',
                                })}
                            </p>
                        )}
                    </div>

                    <div className="bg-card rounded-lg border p-6 md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">
                                {t('suppliers:details.purchaseSummary', {
                                    defaultValue: 'Purchase Summary',
                                })}
                            </h2>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                    {t('suppliers:table.totalSpent', {
                                        defaultValue: 'Total Spent',
                                    })}
                                </p>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(supplier.totalSpent)}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {supplier.expenseCount}{' '}
                            {t('suppliers:details.purchasesRecorded', {
                                defaultValue: 'purchases recorded',
                            })}
                        </p>
                    </div>

                    {supplier.expenses.length > 0 && (
                        <div className="bg-card rounded-lg border p-6 md:col-span-2">
                            <h2 className="font-semibold mb-4">
                                {t('suppliers:details.recentPurchases', {
                                    defaultValue: 'Recent Purchases',
                                })}
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 font-medium">
                                                {t('suppliers:table.date', {
                                                    defaultValue: 'Date',
                                                })}
                                            </th>
                                            <th className="text-left py-2 font-medium">
                                                {t('suppliers:table.category', {
                                                    defaultValue: 'Category',
                                                })}
                                            </th>
                                            <th className="text-left py-2 font-medium">
                                                {t(
                                                    'suppliers:table.description',
                                                    {
                                                        defaultValue:
                                                            'Description',
                                                    },
                                                )}
                                            </th>
                                            <th className="text-right py-2 font-medium">
                                                {t('suppliers:table.amount', {
                                                    defaultValue: 'Amount',
                                                })}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplier.expenses
                                            .slice(0, 10)
                                            .map((expense) => (
                                                <tr
                                                    key={expense.id}
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="py-2">
                                                        {formatDate(
                                                            expense.date,
                                                        )}
                                                    </td>
                                                    <td className="py-2 capitalize">
                                                        {expense.category}
                                                    </td>
                                                    <td className="py-2">
                                                        {expense.description}
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        {formatCurrency(
                                                            parseFloat(
                                                                expense.amount,
                                                            ),
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('suppliers:dialog.deleteTitle', {
                                    defaultValue: 'Delete Supplier',
                                })}
                            </DialogTitle>
                            <DialogDescription>
                                {t('suppliers:dialog.deleteDesc', {
                                    defaultValue:
                                        'Are you sure you want to delete {{name}}?',
                                    name: supplier.name,
                                })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(false)}
                            >
                                {t('common:cancel', { defaultValue: 'Cancel' })}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                            >
                                {t('common:delete', { defaultValue: 'Delete' })}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
