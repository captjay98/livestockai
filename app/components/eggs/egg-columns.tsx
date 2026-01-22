import { useMemo } from 'react'
import { Bird, Edit2, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { EggCollectionWithDetails } from '~/features/eggs/repository'
import { Button } from '~/components/ui/button'

interface UseEggColumnsProps {
  t: (key: string, options?: any) => string
  formatDate: (date: Date | string) => string
  onEdit: (record: EggCollectionWithDetails) => void
  onDelete: (record: EggCollectionWithDetails) => void
}

export function useEggColumns({
  t,
  formatDate,
  onEdit,
  onDelete,
}: UseEggColumnsProps): Array<ColumnDef<EggCollectionWithDetails>> {
  return useMemo(
    () => [
      {
        accessorKey: 'date',
        header: t('common:date', { defaultValue: 'Date' }),
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'batchSpecies',
        header: t('batches:batch', { defaultValue: 'Batch' }),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Bird className="h-4 w-4 text-orange-600" />
            <span className="font-medium">{row.original.batchSpecies}</span>
          </div>
        ),
      },
      {
        accessorKey: 'quantityCollected',
        header: t('eggs:collected', { defaultValue: 'Collected' }),
      },
      {
        accessorKey: 'quantityBroken',
        header: t('eggs:broken', { defaultValue: 'Broken' }),
      },
      {
        accessorKey: 'quantitySold',
        header: t('eggs:sold', { defaultValue: 'Sold' }),
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
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, formatDate, onEdit, onDelete],
  )
}
