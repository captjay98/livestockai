import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getInvoices } from '~/lib/invoices/server'
import { Header } from '~/components/navigation'
import { formatNaira } from '~/lib/currency'
import { FileText, Plus, Eye } from 'lucide-react'

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
  const invoices = Route.useLoaderData() as Invoice[]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground mt-1">Manage customer invoices</p>
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
            <p className="text-muted-foreground mb-4">Create your first invoice</p>
            <Link
              to="/invoices/new"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 font-medium">Customer</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Due Date</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4">{invoice.customerName}</td>
                      <td className="py-3 px-4">{new Date(invoice.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatNaira(parseFloat(invoice.totalAmount))}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-muted h-8 px-3"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}