import { Link } from '@tanstack/react-router'
import { Bird, Edit, Eye, Fish, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export interface Batch {
  id: string
  farmId: string
  farmName?: string | null
  livestockType: string
  species: string
  breedId?: string | null
  breedName?: string | null
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: string
  createdAt?: Date
  updatedAt?: Date
}

interface GetBatchColumnsProps {
  t: (key: string, options?: any) => string
  formatDate: (date: Date) => string
  onEdit: (batch: Batch) => void
  onDelete: (batch: Batch) => void
}

export const getBatchColumns = ({
  t,
  formatDate,
  onEdit,
  onDelete,
}: GetBatchColumnsProps): Array<ColumnDef<Batch>> => [
  {
    accessorKey: 'species',
    header: t('columns.species', { defaultValue: 'Species' }),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.livestockType === 'poultry' ? (
          <Bird className="h-4 w-4 text-orange-600" />
        ) : (
          <Fish className="h-4 w-4 text-blue-600" />
        )}
        <div className="flex flex-col">
          <span className="capitalize font-medium">
            {row.getValue('species')}
          </span>
          {row.original.breedName && (
            <span className="text-[10px] text-muted-foreground">
              {row.original.breedName}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: t('columns.status', { defaultValue: 'Status' }),
    cell: ({ row }) => {
      const status = row.original.status
      const isLowStock =
        row.original.currentQuantity <= row.original.initialQuantity * 0.1 &&
        status === 'active'

      return (
        <div className="flex flex-col gap-1">
          <Badge
            variant={
              status === 'active'
                ? 'default'
                : status === 'depleted'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {t(`statuses.${status}`, { defaultValue: status })}
          </Badge>
          {isLowStock && (
            <Badge variant="warning" className="text-[10px] px-1 py-0 h-4">
              {t('lowStock', { defaultValue: 'Low Stock' })}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'currentQuantity',
    header: t('columns.currentQty', {
      defaultValue: 'Current Qty',
    }),
    cell: ({ row }) => row.original.currentQuantity.toLocaleString(),
  },
  {
    accessorKey: 'initialQuantity',
    header: t('columns.initialQty', {
      defaultValue: 'Initial Qty',
    }),
    cell: ({ row }) => row.original.initialQuantity.toLocaleString(),
  },
  {
    accessorKey: 'acquisitionDate',
    header: t('columns.acquisitionDate', {
      defaultValue: 'Acquisition Date',
    }),
    cell: ({ row }) => formatDate(row.original.acquisitionDate),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          asChild
          title={t('actions.viewDetails', {
            defaultValue: 'View Details',
          })}
        >
          <Link to={`/batches/${row.original.id}` as any}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          title={t('actions.editBatch', {
            defaultValue: 'Edit Batch',
          })}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(row.original)}
          title={t('actions.deleteBatch', {
            defaultValue: 'Delete Batch',
          })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]
