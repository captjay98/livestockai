import { Mail, MapPin, Phone } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { CustomerRecord } from '~/features/customers/types'
import { ActionColumn } from '~/components/ui/action-column'
import { Badge } from '~/components/ui/badge'
import { useFormatCurrency } from '~/features/settings'

interface GetCustomerColumnsProps {
  t: (key: string, options?: any) => string
  onEdit: (customer: CustomerRecord) => void
}

export function getCustomerColumns({
  t,
  onEdit,
}: GetCustomerColumnsProps): Array<ColumnDef<CustomerRecord>> {
  const { format: formatCurrency } = useFormatCurrency()

  return [
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
        <ActionColumn
          entity={`customer ${row.original.name}`}
          onEdit={() => onEdit(row.original)}
        />
      ),
    },
  ]
}
