import { TYPE_COLORS, getTypeIcon } from './utils'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { ActionColumn } from '~/components/ui/action-column'
import { PAYMENT_STATUSES } from '~/features/sales/server'

export interface Sale {
  id: string
  farmId?: string
  farmName?: string | null
  customerId?: string | null
  customerName: string | null
  livestockType: string
  quantity: number
  unitPrice: string
  totalAmount: string
  date: Date
  notes: string | null
  batchSpecies: string | null
  unitType: string | null
  ageWeeks: number | null
  averageWeightKg: string | null
  paymentStatus: string | null
  paymentMethod: string | null
}

interface GetSaleColumnsProps {
  t: (key: string, options?: any) => string
  formatCurrency: (amount: number) => string
  formatDate: (date: Date) => string
  onView: (sale: Sale) => void
  onEdit: (sale: Sale) => void
  onDelete: (sale: Sale) => void
}

export const getSaleColumns = ({
  t,
  formatCurrency,
  formatDate,
  onView,
  onEdit,
  onDelete,
}: GetSaleColumnsProps): Array<ColumnDef<Sale>> => [
  {
    accessorKey: 'livestockType',
    header: t('labels.type'),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${TYPE_COLORS[row.original.livestockType] || 'bg-muted'}`}
        >
          {getTypeIcon(row.original.livestockType)}
        </div>
        <span className="capitalize font-medium">
          {row.original.livestockType}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'customerName',
    header: t('labels.customer'),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.customerName ||
          t('sales:walkIn', { defaultValue: 'Walk-in' })}
      </span>
    ),
  },
  {
    accessorKey: 'quantity',
    header: t('labels.quantity'),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.quantity}</span>
    ),
  },
  {
    accessorKey: 'totalAmount',
    header: t('labels.amount'),
    cell: ({ row }) => (
      <span className="font-medium text-success">
        {formatCurrency(Number(row.original.totalAmount))}
      </span>
    ),
  },
  {
    accessorKey: 'paymentStatus',
    header: t('labels.payment'),
    cell: ({ row }) => {
      const status =
        PAYMENT_STATUSES.find((s) => s.value === row.original.paymentStatus) ||
        PAYMENT_STATUSES[0]
      return (
        <Badge className={`${status.color} border-0`}>{status.label}</Badge>
      )
    },
  },
  {
    accessorKey: 'date',
    header: t('labels.date'),
    cell: ({ row }) => (
      <Badge variant="outline">{formatDate(row.original.date)}</Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <ActionColumn
        entity={`sale ${row.original.id}`}
        onView={() => onView(row.original)}
        onEdit={() => onEdit(row.original)}
        onDelete={() => onDelete(row.original)}
      />
    ),
  },
]
