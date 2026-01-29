import { Calendar, Edit, Pill, Syringe, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export interface HealthRecord {
  id: string
  batchId: string
  type: 'vaccination' | 'treatment'
  name: string
  date: Date
  dosage: string
  notes?: string
  reason?: string
  withdrawalDays?: number
  nextDueDate?: Date
  species: string
  livestockType: string
  farmName?: string
}

interface GetHealthColumnsProps {
  t: (key: string, options?: any) => string
  formatDate: (date: Date) => string
  onEdit: (record: HealthRecord) => void
  onDelete: (record: HealthRecord) => void
}

export const getHealthColumns = ({
  t,
  formatDate,
  onEdit,
  onDelete,
}: GetHealthColumnsProps): Array<ColumnDef<HealthRecord>> => [
  {
    accessorKey: 'date',
    header: t('vaccinations:columns.date'),
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: 'type',
    header: t('vaccinations:columns.type'),
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === 'vaccination' ? 'default' : 'secondary'}
        className={
          row.original.type === 'treatment'
            ? 'bg-warning/15 text-warning-foreground'
            : ''
        }
      >
        {row.original.type === 'vaccination' ? (
          <span className="flex items-center">
            <Syringe className="h-3 w-3 mr-1" />
            {t('vaccinations:types.prevention')}
          </span>
        ) : (
          <span className="flex items-center">
            <Pill className="h-3 w-3 mr-1" />
            {t('vaccinations:types.treatment')}
          </span>
        )}
      </Badge>
    ),
  },
  {
    accessorKey: 'name',
    header: t('vaccinations:columns.name'),
  },
  {
    accessorKey: 'species',
    header: t('vaccinations:columns.batch'),
  },
  {
    id: 'details',
    header: t('vaccinations:columns.details'),
    cell: ({ row }) => {
      if (row.original.type === 'vaccination' && row.original.nextDueDate) {
        return (
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {t('vaccinations:details.next')}:{' '}
            {formatDate(row.original.nextDueDate)}
          </div>
        )
      }
      if (row.original.type === 'treatment') {
        return (
          <div className="text-xs text-muted-foreground">
            {row.original.reason && (
              <span>
                {t('vaccinations:details.for')} {row.original.reason}
              </span>
            )}
            {row.original.withdrawalDays
              ? ` • ${row.original.withdrawalDays} days`
              : ''}
          </div>
        )
      }
      return null
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]
