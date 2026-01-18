import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Edit, Printer, Trash2 } from 'lucide-react'
import {
  deleteInvoice,
  getInvoiceById,
  updateInvoiceStatus,
} from '~/features/invoices/server'
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

const fetchInvoice = createServerFn({ method: 'GET' })
  .inputValidator((data: { invoiceId: string }) => data)
  .handler(async ({ data }) => {
    return getInvoiceById(data.invoiceId)
  })

const changeStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { invoiceId: string; status: 'unpaid' | 'partial' | 'paid' }) =>
      data,
  )
  .handler(async ({ data }) => {
    await updateInvoiceStatus(data.invoiceId, data.status)
  })

const removeInvoice = createServerFn({ method: 'POST' })
  .inputValidator((data: { invoiceId: string }) => data)
  .handler(async ({ data }) => {
    await deleteInvoice(data.invoiceId)
  })

export const Route = createFileRoute('/_auth/invoices/$invoiceId')({
  component: InvoiceDetailPage,
  loader: async ({ params }) => {
    return fetchInvoice({ data: { invoiceId: params.invoiceId } })
  },
})

function InvoiceDetailPage() {
  const { t } = useTranslation()
  const invoice = Route.useLoaderData()
  const navigate = useNavigate()
  const params = Route.useParams()
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <main className="space-y-6">
          <p>{t('invoices.detail.notFound')}</p>
        </main>
      </div>
    )
  }

  const handleStatusChange = async (status: 'unpaid' | 'partial' | 'paid') => {
    try {
      await changeStatus({ data: { invoiceId: params.invoiceId, status } })
      toast.success(t('invoices.messages.statusUpdated'))
      window.location.reload()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('invoices.messages.statusError'),
      )
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await removeInvoice({ data: { invoiceId: params.invoiceId } })
      toast.success(t('invoices.messages.deleted'))
      navigate({ to: '/invoices' })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('invoices.messages.deleteError'),
      )
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="space-y-6">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to="/invoices"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('invoices.detail.back')}
          </Link>
          <div className="flex gap-2">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3 min-h-[44px]">
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3 min-h-[44px]"
            >
              <Printer className="h-4 w-4 mr-2" />
              {t('invoices.actions.print')}
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-9 px-3 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </button>
          </div>
        </div>

        {/* Invoice Document */}
        <div className="max-w-3xl mx-auto bg-card rounded-lg border p-8 print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold">
                {t('invoices.detail.title')}
              </h1>
              <p className="text-muted-foreground font-mono">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-lg">{invoice.farmName}</h2>
              <p className="text-sm text-muted-foreground">
                {invoice.farmLocation}
              </p>
            </div>
          </div>

          {/* Customer & Dates */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t('invoices.detail.billTo')}
              </h3>
              <p className="font-medium">{invoice.customerName}</p>
              {invoice.customerPhone && (
                <p className="text-sm">{invoice.customerPhone}</p>
              )}
              {invoice.customerEmail && (
                <p className="text-sm">{invoice.customerEmail}</p>
              )}
              {invoice.customerLocation && (
                <p className="text-sm">{invoice.customerLocation}</p>
              )}
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-sm text-muted-foreground">
                  {t('invoices.labels.date')}:{' '}
                </span>
                <span>{formatDate(invoice.date)}</span>
              </div>
              {invoice.dueDate && (
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">
                    {t('invoices.labels.dueDate')}:{' '}
                  </span>
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    invoice.status === 'paid'
                      ? 'bg-success/10 text-success'
                      : invoice.status === 'partial'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {t('invoices.status.' + invoice.status).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 font-medium">
                    {t('invoices.detail.items.description')}
                  </th>
                  <th className="text-right py-3 font-medium">
                    {t('invoices.detail.items.qty')}
                  </th>
                  <th className="text-right py-3 font-medium">
                    {t('invoices.detail.items.unitPrice')}
                  </th>
                  <th className="text-right py-3 font-medium">
                    {t('invoices.detail.items.total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map(
                  (item: {
                    id: string
                    description: string
                    quantity: number
                    unitPrice: number
                    total: number
                  }) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-4 text-right font-medium">
                    {t('invoices.detail.items.total')}:
                  </td>
                  <td className="py-4 text-right text-xl font-bold">
                    {formatCurrency(parseFloat(invoice.totalAmount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t('invoices.detail.notes')}
              </h3>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          <div className="print:hidden border-t pt-6">
            <h3 className="text-sm font-medium mb-3">
              {t('invoices.detail.updateStatus')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange('unpaid')}
                disabled={invoice.status === 'unpaid'}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  invoice.status === 'unpaid'
                    ? 'bg-destructive/10 text-destructive'
                    : 'border border-input hover:bg-muted'
                }`}
              >
                {t('invoices.status.unpaid')}
              </button>
              <button
                onClick={() => handleStatusChange('partial')}
                disabled={invoice.status === 'partial'}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  invoice.status === 'partial'
                    ? 'bg-warning/10 text-warning'
                    : 'border border-input hover:bg-muted'
                }`}
              >
                {t('invoices.status.partial')}
              </button>
              <button
                onClick={() => handleStatusChange('paid')}
                disabled={invoice.status === 'paid'}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  invoice.status === 'paid'
                    ? 'bg-success/10 text-success'
                    : 'border border-input hover:bg-muted'
                }`}
              >
                {t('invoices.status.paid')}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('invoices.detail.deleteTitle')}</DialogTitle>
              <DialogDescription>
                {t('invoices.detail.deleteDesc', {
                  number: invoice.invoiceNumber,
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
