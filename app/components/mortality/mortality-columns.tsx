import { Edit, Info, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { MORTALITY_CAUSES } from '~/components/mortality'

export interface MortalityRecord {
  id: string
  batchId: string
  quantity: number
  date: Date
  cause: string
  notes?: string
  species: string
  livestockType: string
  farmId: string
  farmName?: string
}

interface GetMortalityColumnsProps {
  t: (key: string, options?: any) => string
  formatDate: (date: Date) => string
  onEdit: (record: MortalityRecord) => void
  onDelete: (record: MortalityRecord) => void
}

export const getMortalityColumns = ({
  t,
  formatDate,
  onEdit,
  onDelete,
}: GetMortalityColumnsProps): Array<ColumnDef<MortalityRecord>> => [
  {
    accessorKey: 'date',
    header: t('common.date'),
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: 'species',
    header: t('batches.batch'),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.species}</span>
    ),
  },
  {
    accessorKey: 'quantity',
    header: t('common.quantity'),
    cell: ({ row }) => (
      <span className="font-bold text-destructive">
        -{row.original.quantity}
      </span>
    ),
  },
  {
    accessorKey: 'cause',
    header: t('mortality.cause'),
    cell: ({ row }) => {
      const causes = MORTALITY_CAUSES(t)
      const cause =
        causes.find((c) => c.value === row.original.cause)?.label ||
        row.original.cause
      return <Badge variant="outline">{cause}</Badge>
    },
  },
  {
    accessorKey: 'notes',
    header: t('common.notes'),
    cell: ({ row }) => {
      if (!row.original.notes) return null
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{row.original.notes}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
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
          title={t('common.edit')}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(row.original)}
          title={t('common.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]
