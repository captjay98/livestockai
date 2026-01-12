import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ArrowLeft, Edit, Printer, Trash2 } from 'lucide-react'
import {
  deleteInvoice,
  getInvoiceById,
  updateInvoiceStatus,
} from '~/lib/invoices/server'
import { formatNaira } from '~/lib/currency'

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
  const invoice = Route.useLoaderData()
  const navigate = useNavigate()
  const params = Route.useParams()

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <p>Invoice not found</p>
        </main>
      </div>
    )
  }

  const handleStatusChange = async (status: 'unpaid' | 'partial' | 'paid') => {
    await changeStatus({ data: { invoiceId: params.invoiceId, status } })
    window.location.reload()
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await removeInvoice({ data: { invoiceId: params.invoiceId } })
      navigate({ to: '/invoices' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to="/invoices"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Invoices
          </Link>
          <div className="flex gap-2">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3 min-h-[44px]">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-3 min-h-[44px]"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-9 px-3 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Invoice Document */}
        <div className="max-w-3xl mx-auto bg-card rounded-lg border p-8 print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
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
                Bill To
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
                <span className="text-sm text-muted-foreground">Date: </span>
                <span>{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
              {invoice.dueDate && (
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">
                    Due Date:{' '}
                  </span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'paid'
                      ? 'bg-success/10 text-success'
                      : invoice.status === 'partial'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 font-medium">Description</th>
                  <th className="text-right py-3 font-medium">Qty</th>
                  <th className="text-right py-3 font-medium">Unit Price</th>
                  <th className="text-right py-3 font-medium">Total</th>
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
                        {formatNaira(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right">
                        {formatNaira(item.total)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-4 text-right font-medium">
                    Total:
                  </td>
                  <td className="py-4 text-right text-xl font-bold">
                    {formatNaira(parseFloat(invoice.totalAmount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Notes
              </h3>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          <div className="print:hidden border-t pt-6">
            <h3 className="text-sm font-medium mb-3">Update Status</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange('unpaid')}
                disabled={invoice.status === 'unpaid'}
                className={`px-4 py-2 rounded-md text-sm font-medium ${invoice.status === 'unpaid'
                    ? 'bg-destructive/10 text-destructive'
                    : 'border border-input hover:bg-muted'
                  }`}
              >
                Unpaid
              </button>
              <button
                onClick={() => handleStatusChange('partial')}
                disabled={invoice.status === 'partial'}
                className={`px-4 py-2 rounded-md text-sm font-medium ${invoice.status === 'partial'
                    ? 'bg-warning/10 text-warning'
                    : 'border border-input hover:bg-muted'
                  }`}
              >
                Partial
              </button>
              <button
                onClick={() => handleStatusChange('paid')}
                disabled={invoice.status === 'paid'}
                className={`px-4 py-2 rounded-md text-sm font-medium ${invoice.status === 'paid'
                    ? 'bg-success/10 text-success'
                    : 'border border-input hover:bg-muted'
                  }`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
