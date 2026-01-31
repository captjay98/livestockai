import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Bird,
  Calendar,
  Edit,
  Fish,
  MapPin,
  Trash2,
  Warehouse,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useFormatDate } from '~/features/settings'

export interface BatchHeaderData {
  id: string
  batchName: string | null
  species: string
  status: string
  sourceSize: string | null
  acquisitionDate: Date
  livestockType: string
  farmName?: string | null
  structureName?: string | null
}

interface BatchHeaderProps {
  batch: BatchHeaderData
  onEdit: () => void
  onDelete: () => void
}

export function BatchHeader({ batch, onEdit, onDelete }: BatchHeaderProps) {
  const { t } = useTranslation(['batches', 'common'])
  const { format: formatDate } = useFormatDate()

  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(batch.acquisitionDate).getTime()) /
      (1000 * 60 * 60 * 24),
  )

  return (
    <div className="mb-6">
      {/* Back button + Actions row */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="hover:bg-white/10 rounded-full h-9 w-9"
        >
          <Link
            to="/batches"
            aria-label={t('batches:backToBatches', {
              defaultValue: 'Back to batches',
            })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-lg h-8"
          >
            <Edit className="h-3.5 w-3.5 sm:mr-2" />
            <span className="hidden sm:inline">
              {t('common:edit', { defaultValue: 'Edit' })}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="rounded-lg h-8 hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5 sm:mr-2" />
            <span className="hidden sm:inline">
              {t('common:delete', { defaultValue: 'Delete' })}
            </span>
          </Button>
        </div>
      </div>

      {/* Title + Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-white/40 dark:bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          {batch.livestockType === 'poultry' ? (
            <Bird className="h-5 w-5 text-orange-600" />
          ) : (
            <Fish className="h-5 w-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {batch.batchName || batch.species}
            </h1>
            <Badge
              variant={batch.status === 'active' ? 'default' : 'secondary'}
              className={cn(
                'rounded-full text-[10px] font-semibold uppercase',
                batch.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted/50 text-muted-foreground',
              )}
            >
              {batch.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{batch.species}</span>
          {batch.sourceSize && (
            <span className="capitalize">({batch.sourceSize})</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDate(batch.acquisitionDate)} ({ageInDays}d)
          </span>
        </div>

        {batch.farmName && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{batch.farmName}</span>
          </div>
        )}

        {batch.structureName && (
          <div className="flex items-center gap-1.5">
            <Warehouse className="h-3 w-3" />
            <span className="truncate">{batch.structureName}</span>
          </div>
        )}
      </div>
    </div>
  )
}
