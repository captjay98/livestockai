import { Eye } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { InvoiceRecord } from '~/features/invoices/types'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

interface GetInvoiceColumnsProps {
    t: (key: string, options?: any) => string
    formatCurrency: (amount: number) => string
    formatDate: (date: Date) => string
    onView: (invoice: InvoiceRecord) => void
}

export function getInvoiceColumns({
    t,
    formatCurrency,
    formatDate,
    onView,
}: GetInvoiceColumnsProps): Array<ColumnDef<InvoiceRecord>> {
    return [
        {
            accessorKey: 'invoiceNumber',
            header: t('labels.invoiceNumber'),
            cell: ({ row }) => (
                <span className="font-mono text-xs">
                    {row.original.invoiceNumber}
                </span>
            ),
        },
        {
            accessorKey: 'customerName',
            header: t('labels.customer'),
            cell: ({ row }) => (
                <span className="font-medium">{row.original.customerName}</span>
            ),
        },
        {
            accessorKey: 'date',
            header: t('labels.date'),
            cell: ({ row }) => formatDate(row.original.date),
        },
        {
            accessorKey: 'dueDate',
            header: t('labels.dueDate'),
            cell: ({ row }) =>
                row.original.dueDate ? formatDate(row.original.dueDate) : '-',
        },
        {
            accessorKey: 'totalAmount',
            header: t('labels.amount'),
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatCurrency(row.original.totalAmount)}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: t('labels.status'),
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.status === 'paid'
                            ? 'default'
                            : row.original.status === 'partial'
                              ? 'secondary'
                              : 'destructive'
                    }
                    className={
                        row.original.status === 'paid'
                            ? 'bg-success/15 text-success hover:bg-success/25'
                            : row.original.status === 'partial'
                              ? 'bg-warning/15 text-warning hover:bg-warning/25'
                              : 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                    }
                >
                    {t('status.' + row.original.status, {
                        defaultValue: row.original.status,
                    })}
                </Badge>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(row.original)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('common.view')}
                    </Button>
                </div>
            ),
        },
    ]
}
