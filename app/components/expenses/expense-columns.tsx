import { Edit, Eye, Trash2 } from 'lucide-react'
import { CATEGORY_COLORS, getCategoryIcon } from './utils'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export interface Expense {
  id: string
  farmId?: string
  farmName?: string | null
  category: string
  amount: string
  date: Date
  description: string
  supplierName: string | null
  batchSpecies: string | null
  batchType?: string | null
  isRecurring: boolean
}

interface GetExpenseColumnsProps {
  t: (key: string, options?: any) => string
  formatCurrency: (amount: number) => string
  formatDate: (date: Date) => string
  onView: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export const getExpenseColumns = ({
  t,
  formatCurrency,
  formatDate,
  onView,
  onEdit,
  onDelete,
}: GetExpenseColumnsProps): Array<ColumnDef<Expense>> => [
  {
    accessorKey: 'category',
    header: t('labels.category'),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${CATEGORY_COLORS[row.original.category] || 'bg-muted'}`}
        >
          {getCategoryIcon(row.original.category)}
        </div>
        <span className="capitalize font-medium">
          {t('categories.' + row.original.category, {
            defaultValue: row.original.category,
          })}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: t('labels.description'),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: t('labels.amount'),
    cell: ({ row }) => (
      <span className="font-medium text-destructive">
        -{formatCurrency(parseFloat(row.original.amount))}
      </span>
    ),
  },
  {
    accessorKey: 'date',
    header: t('labels.date'),
    cell: ({ row }) => (
      <Badge variant="outline">{formatDate(row.original.date)}</Badge>
    ),
  },
  {
    accessorKey: 'supplierName',
    header: t('labels.supplier'),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.supplierName || '-'}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="sm" onClick={() => onView(row.original)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]
