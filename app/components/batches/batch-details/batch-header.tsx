import { Link } from '@tanstack/react-router'
import { ArrowLeft, Bird, Calendar, Edit, Fish, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useFormatDate } from '~/features/settings'

export interface BatchHeaderData {
  id: string
  batchName: string | null
  species: string
  status: string
  sourceSize: string | null
  acquisitionDate: Date
  livestockType: string
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/batches" aria-label="Back to batches">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {batch.livestockType === 'poultry' ? (
                <Bird className="h-6 w-6 text-orange-600" />
              ) : (
                <Fish className="h-6 w-6 text-blue-600" />
              )}
              {batch.batchName || batch.species}
            </h1>
            <Badge
              variant={batch.status === 'active' ? 'default' : 'secondary'}
            >
              {batch.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1 flex-wrap">
            <span>{batch.species}</span>
            {batch.sourceSize && (
              <>
                <span>•</span>
                <span className="capitalize">{batch.sourceSize}</span>
              </>
            )}
            <span>•</span>
            <Calendar className="h-3 w-3" />
            <span>
              {formatDate(batch.acquisitionDate)}{' '}
              {t('batches:ageInDays', {
                count: ageInDays,
                defaultValue: '({{count}} days)',
              })}
            </span>
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />{' '}
          {t('common:edit', { defaultValue: 'Edit' })}
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />{' '}
          {t('common:delete', { defaultValue: 'Delete' })}
        </Button>
      </div>
    </div>
  )
}
