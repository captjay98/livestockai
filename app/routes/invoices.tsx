import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Eye, FileText, Plus } from 'lucide-react'
import { getInvoices } from '~/lib/invoices/server'
import { formatNaira } from '~/lib/currency'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  date: string
  dueDate: string | null
  totalAmount: string
  status: 'paid' | 'partial' | 'unpaid'
}

const fetchInvoices = createServerFn({ method: 'GET' }).handler(async () => {
  return getInvoices()
})

export const Route = createFileRoute('/invoices')({
  component: InvoicesPage,
  loader: () => fetchInvoices(),
})

function InvoicesPage() {
  const invoices = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer invoices
            </p>
          </div>
          <Link
            to="/invoices/new"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first invoice
            </p>
            <Link
              to="/invoices/new"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-card rounded-lg border overflow-hidden"
              >
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium">
                      {invoice.invoiceNumber}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <p className="font-medium truncate">{invoice.customerName}</p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(invoice.date).toLocaleDateString()}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due:</span>
                      <span>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground font-medium">
                      Amount:
                    </span>
                    <span className="font-bold">
                      {formatNaira(parseFloat(invoice.totalAmount))}
                    </span>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-9 px-4 w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
